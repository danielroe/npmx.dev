import * as v from 'valibot'
import { PackageRouteParamsSchema } from '#shared/schemas/package'
import { CACHE_MAX_AGE_ONE_HOUR } from '#shared/utils/constants'
import { handleApiError } from '#server/utils/error-handler'
import { handleLlmsTxt } from '#server/utils/llms-txt'

/**
 * Serves llms.txt for an npm package — a single LLM-friendly markdown document
 * aggregating README and agent instruction files (CLAUDE.md, AGENTS.md, etc.).
 *
 * URL patterns:
 * - /api/registry/llms-txt/nuxt              → latest version
 * - /api/registry/llms-txt/@nuxt/kit         → scoped, latest
 * - /api/registry/llms-txt/nuxt/v/3.12.0    → specific version
 * - /api/registry/llms-txt/@nuxt/kit/v/1.0.0 → scoped, specific version
 */
export default defineCachedEventHandler(
  async event => {
    const pkgParamSegments = getRouterParam(event, 'pkg')?.split('/') ?? []
    if (pkgParamSegments.length === 0) {
      throw createError({ statusCode: 404, message: 'Package name is required.' })
    }

    const { rawPackageName, rawVersion } = parsePackageParams(pkgParamSegments)

    try {
      const { packageName, version } = v.parse(PackageRouteParamsSchema, {
        packageName: rawPackageName,
        version: rawVersion,
      })

      const content = await handleLlmsTxt(packageName, version)
      setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
      return content
    } catch (error: unknown) {
      handleApiError(error, {
        statusCode: 502,
        message: 'Failed to generate llms.txt.',
      })
    }
  },
  {
    maxAge: CACHE_MAX_AGE_ONE_HOUR,
    swr: true,
    getKey: event => {
      const pkg = getRouterParam(event, 'pkg') ?? ''
      return `llms-txt:${pkg.replace(/\/+$/, '').trim()}`
    },
  },
)
