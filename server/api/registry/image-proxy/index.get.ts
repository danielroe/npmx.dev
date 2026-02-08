import { createError, getQuery, setResponseHeaders, sendStream } from 'h3'
import { Readable } from 'node:stream'
import { CACHE_MAX_AGE_ONE_DAY } from '#shared/utils/constants'
import { isAllowedImageUrl } from '#server/utils/image-proxy'

/**
 * Image proxy endpoint to prevent privacy leaks from README images.
 *
 * Instead of letting the client's browser fetch images directly from third-party
 * servers (which exposes visitor IP, User-Agent, etc.), this endpoint fetches
 * images server-side and forwards them to the client.
 *
 * Similar to GitHub's camo proxy: https://github.blog/2014-01-28-proxying-user-images/
 *
 * Usage: /api/registry/image-proxy?url=https://example.com/image.png
 *
 * Resolves: https://github.com/npmx-dev/npmx.dev/issues/1138
 */
export default defineEventHandler(async event => {
  const query = getQuery(event)
  const rawUrl = query.url
  const url = (Array.isArray(rawUrl) ? rawUrl[0] : rawUrl) as string | undefined

  if (!url) {
    throw createError({
      statusCode: 400,
      message: 'Missing required "url" query parameter.',
    })
  }

  // Validate URL
  if (!isAllowedImageUrl(url)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid or disallowed image URL.',
    })
  }

  try {
    const response = await fetch(url, {
      headers: {
        // Use a generic User-Agent to avoid leaking server info
        'User-Agent': 'npmx-image-proxy/1.0',
        'Accept': 'image/*',
      },
      redirect: 'follow',
    })

    // Validate final URL after any redirects to prevent SSRF bypass
    if (response.url !== url && !isAllowedImageUrl(response.url)) {
      throw createError({
        statusCode: 400,
        message: 'Redirect to disallowed URL.',
      })
    }

    if (!response.ok) {
      throw createError({
        statusCode: response.status === 404 ? 404 : 502,
        message: `Failed to fetch image: ${response.status}`,
      })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    // Only allow image content types
    if (!contentType.startsWith('image/')) {
      throw createError({
        statusCode: 400,
        message: 'URL does not point to an image.',
      })
    }

    // Check Content-Length header if present (may be absent or dishonest)
    const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
    const contentLength = response.headers.get('content-length')
    if (contentLength && Number.parseInt(contentLength, 10) > MAX_SIZE) {
      throw createError({
        statusCode: 413,
        message: 'Image too large.',
      })
    }

    if (!response.body) {
      throw createError({
        statusCode: 502,
        message: 'No response body from upstream.',
      })
    }

    setResponseHeaders(event, {
      'Content-Type': contentType,
      'Cache-Control': `public, max-age=${CACHE_MAX_AGE_ONE_DAY}, s-maxage=${CACHE_MAX_AGE_ONE_DAY}`,
      // Security headers - prevent content sniffing and restrict usage
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
    })

    // Stream the response with a size limit to prevent memory exhaustion.
    // This avoids buffering the entire image into memory before sending.
    let bytesRead = 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upstream = Readable.fromWeb(response.body as any)
    const limited = new Readable({
      read() {
        /* pulling is driven by upstream push */
      },
    })

    upstream.on('data', (chunk: Buffer) => {
      bytesRead += chunk.length
      if (bytesRead > MAX_SIZE) {
        upstream.destroy()
        limited.destroy(new Error('Image too large'))
      } else {
        limited.push(chunk)
      }
    })
    upstream.on('end', () => limited.push(null))
    upstream.on('error', (err: Error) => limited.destroy(err))

    return sendStream(event, limited)
  } catch (error: unknown) {
    // Re-throw H3 errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 502,
      message: 'Failed to proxy image.',
    })
  }
})
