import type { CachedFetchFunction, CachedFetchResult } from '#shared/utils/fetch-cache-config'
import { CACHE_MAX_AGE_ONE_DAY } from '#shared/utils/constants'

type GitHubContributorWeek = {
  w: number
  a: number
  d: number
  c: number
}

type GitHubContributorStats = {
  total: number
  weeks: GitHubContributorWeek[]
}

export default defineCachedEventHandler(
  async event => {
    const owner = getRouterParam(event, 'owner')
    const repo = getRouterParam(event, 'repo')

    if (!owner || !repo) {
      throw createError({
        status: 400,
        message: 'repository not provided',
      })
    }

    let cachedFetch: CachedFetchFunction
    if (event.context.cachedFetch) {
      cachedFetch = event.context.cachedFetch
    } else {
      cachedFetch = async <T = unknown>(
        url: string,
        options: Parameters<typeof $fetch>[1] = {},
        _ttl?: number,
      ): Promise<CachedFetchResult<T>> => {
        const data = (await $fetch<T>(url, options)) as T
        return { data, isStale: false, cachedAt: null }
      }
    }

    try {
      const { data } = await cachedFetch<GitHubContributorStats[]>(
        `https://api.github.com/repos/${owner}/${repo}/stats/contributors`,
        {
          headers: {
            'User-Agent': 'npmx',
            'Accept': 'application/vnd.github+json',
          },
        },
        CACHE_MAX_AGE_ONE_DAY,
      )

      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  },
  {
    maxAge: CACHE_MAX_AGE_ONE_DAY,
  },
)
