import { flatten, safeParse } from 'valibot'
import { BlogMetaRequestSchema } from '#shared/schemas/atproto'
import { handleApiError } from '#server/utils/error-handler'
import { BLOG_META_TAG_REGEX } from '#shared/utils/constants'

export default defineEventHandler(async event => {
  const query = getQuery(event)
  const parsed = safeParse(BlogMetaRequestSchema, query)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid URL provided',
      data: flatten(parsed.issues),
    })
  }

  const { url } = parsed.output

  try {
    const html = await $fetch<string>(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)' },
    })

    const metaTags: Record<string, string> = {}
    const matches = html.matchAll(BLOG_META_TAG_REGEX)

    for (const match of matches) {
      // INFO: match[1] is the name/property, match[2] is the content
      if (match[1] && match[2]) {
        metaTags[match[1]] = match[2]
      }
    }

    return {
      title: getMeta(html, metaTags, ['og:title', 'twitter:title', 'title']),
      author: getMeta(html, metaTags, ['author', 'og:site_name', 'twitter:site']),
      description: getMeta(html, metaTags, [
        'og:description',
        'twitter:description',
        'description',
      ]),
      image: getMeta(html, metaTags, ['og:image', 'twitter:image', 'og:image:secure_url']),
      // INFO: Extract all meta tags for debugging
      _meta: metaTags,
      _fetchedAt: new Date().toISOString(),
    }
  } catch (error) {
    handleApiError(error, {
      statusCode: 502,
      message: 'Failed to fetch URL',
    })
  }
})

// INFO: Helper to get specific meta Simple regex extraction
const getMeta = (html: string, metaTags: Record<string, string>, keys: string[]) => {
  for (const key of keys) {
    if (metaTags[key]) return metaTags[key]
    // Try different case variations
    const found = Object.keys(metaTags).find(k => k.toLowerCase() === key.toLowerCase())
    if (found) return metaTags[found]
  }
  // Fallback to title tag
  if (keys.includes('title')) {
    return html.match(/<title>([^<]*)<\/title>/i)?.[1] || null
  }
  return null
}
