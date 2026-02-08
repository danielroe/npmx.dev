import type { NpmSearchResponse, NpmSearchResult, MinimalPackument } from '#shared/types'

/**
 * Convert packument to search result format for display
 */
export function packumentToSearchResult(
  pkg: MinimalPackument,
  weeklyDownloads?: number,
): NpmSearchResult {
  let latestVersion = ''
  if (pkg['dist-tags']) {
    latestVersion = pkg['dist-tags'].latest || Object.values(pkg['dist-tags'])[0] || ''
  }
  const modified = pkg.time.modified || pkg.time[latestVersion] || ''

  return {
    package: {
      name: pkg.name,
      version: latestVersion,
      description: pkg.description,
      keywords: pkg.keywords,
      date: pkg.time[latestVersion] || modified,
      links: {
        npm: `https://www.npmjs.com/package/${pkg.name}`,
      },
      maintainers: pkg.maintainers,
    },
    score: { final: 0, detail: { quality: 0, popularity: 0, maintenance: 0 } },
    searchScore: 0,
    downloads: weeklyDownloads !== undefined ? { weekly: weeklyDownloads } : undefined,
    updated: pkg.time[latestVersion] || modified,
  }
}

export function emptySearchResponse(): NpmSearchResponse {
  return {
    objects: [],
    total: 0,
    isStale: false,
    time: new Date().toISOString(),
  }
}
