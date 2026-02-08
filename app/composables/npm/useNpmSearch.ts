import type { Packument, NpmSearchResponse, NpmDownloadCount } from '#shared/types'
import { emptySearchResponse, packumentToSearchResult } from './search-utils'

export interface NpmSearchOptions {
  /** Number of results */
  size?: number
  /** Offset for pagination */
  from?: number
}

/**
 * Composable that provides npm registry search functions.
 *
 * Mirrors the API shape of `useAlgoliaSearch` so that `useSearch` can
 * swap between providers without branching on implementation details.
 *
 * Must be called during component setup (or inside another composable)
 * because it reads from `useNuxtApp()`. The returned functions are safe
 * to call at any time (event handlers, async callbacks, etc.).
 */
export function useNpmSearch() {
  const { $npmRegistry, $npmApi } = useNuxtApp()

  /**
   * Search npm packages via the npm registry API.
   * Returns results in the same `NpmSearchResponse` format as `useAlgoliaSearch`.
   *
   * Single-character queries are handled specially: they do a direct packument
   * + download count lookup instead of a search, because the search API returns
   * poor results for single-char terms.
   */
  async function search(
    query: string,
    options: NpmSearchOptions = {},
    signal?: AbortSignal,
  ): Promise<NpmSearchResponse> {
    // Single-character: direct packument lookup
    if (query.length === 1) {
      const encodedName = encodePackageName(query)
      const [{ data: pkg, isStale }, { data: downloads }] = await Promise.all([
        $npmRegistry<Packument>(`/${encodedName}`, { signal }),
        $npmApi<NpmDownloadCount>(`/downloads/point/last-week/${encodedName}`, {
          signal,
        }),
      ])

      if (!pkg) {
        return emptySearchResponse()
      }

      const result = packumentToSearchResult(pkg, downloads?.downloads)

      return {
        objects: [result],
        total: 1,
        isStale,
        time: new Date().toISOString(),
      }
    }

    // Standard search
    const params = new URLSearchParams()
    params.set('text', query)
    params.set('size', String(options.size ?? 25))
    if (options.from) {
      params.set('from', String(options.from))
    }

    const { data: response, isStale } = await $npmRegistry<NpmSearchResponse>(
      `/-/v1/search?${params.toString()}`,
      { signal },
      60,
    )

    return { ...response, isStale }
  }

  return {
    /** Search packages by text query */
    search,
  }
}
