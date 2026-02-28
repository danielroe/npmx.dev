import {
  ONE_THOUSAND_NPMX_USER_ACCOUNTS_XRPC,
  BSKY_APP_VIEW_USER_PROFILES_XRPC,
  ERROR_PDS_FETCH_FAILED,
} from '#shared/utils/constants'
import type { AtprotoProfile } from '#shared/types/atproto'

const USER_BATCH_AMOUNT = 25

export default defineCachedEventHandler(
  async (): Promise<AtprotoProfile[]> => {
    // INFO: Request npmx.social PDS for every hosted user account
    const response = await fetch(ONE_THOUSAND_NPMX_USER_ACCOUNTS_XRPC)

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: ERROR_PDS_FETCH_FAILED,
      })
    }

    const listRepos = (await response.json()) as { repos: { did: string }[] }
    const dids = listRepos.repos.map(repo => repo.did)

    // INFO: Request the list of user profiles from the Bluesky AppView
    const batchPromises: Promise<AtprotoProfile[]>[] = []

    for (let i = 0; i < dids.length; i += USER_BATCH_AMOUNT) {
      const batch = dids.slice(i, i + USER_BATCH_AMOUNT)
      const url = new URL(BSKY_APP_VIEW_USER_PROFILES_XRPC)

      for (const did of batch) url.searchParams.append('actors', did)

      batchPromises.push(
        fetch(url.toString())
          .then(res => {
            if (!res.ok) throw new Error(`Status ${res.status}`)
            return res.json() as Promise<{ profiles: AtprotoProfile[] }>
          })
          .then(data => data.profiles || [])
          .catch(err => {
            console.warn('Failed to fetch batch:', err)
            // Return empty array on failure so Promise.all doesn't crash
            return []
          }),
      )
    }

    // INFO: Await all batches in parallel and flatten the results
    return (await Promise.all(batchPromises)).flat()
  },
  {
    maxAge: 3600,
    name: 'pds-users',
    getKey: () => 'pds-users',
  },
)
