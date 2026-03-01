import type { AtprotoProfile } from '#shared/types/atproto'

import {
  ONE_THOUSAND_NPMX_USER_ACCOUNTS_XRPC,
  BSKY_APP_VIEW_USER_PROFILES_XRPC,
  ERROR_PDS_FETCH_FAILED,
} from '#shared/utils/constants'

interface GraphLink {
  source: string
  target: string
}

const USER_BATCH_AMOUNT = 25

export default defineCachedEventHandler(
  async (): Promise<{ nodes: AtprotoProfile[]; links: GraphLink[] }> => {
    const response = await fetch(ONE_THOUSAND_NPMX_USER_ACCOUNTS_XRPC)

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: ERROR_PDS_FETCH_FAILED,
      })
    }

    const listRepos = (await response.json()) as { repos: { did: string }[] }
    const dids = listRepos.repos.map(repo => repo.did)
    const localDids = new Set(dids)

    const nodes: AtprotoProfile[] = []
    const links: GraphLink[] = []

    for (let i = 0; i < dids.length; i += USER_BATCH_AMOUNT) {
      const batch = dids.slice(i, i + USER_BATCH_AMOUNT)

      const url = new URL(BSKY_APP_VIEW_USER_PROFILES_XRPC)
      for (const did of batch) {
        url.searchParams.append('actors', did)
      }

      try {
        const profilesResponse = await fetch(url.toString())

        if (!profilesResponse.ok) {
          console.warn(`Failed to fetch atproto profiles: ${profilesResponse.status}`)
          continue
        }

        const profilesData = (await profilesResponse.json()) as { profiles: AtprotoProfile[] }

        if (profilesData.profiles) {
          nodes.push(...profilesData.profiles)
        }
      } catch (error) {
        console.warn('Failed to fetch atproto profiles:', error)
      }
    }

    for (const did of dids) {
      const followResponse = await fetch(
        `https://public.api.bsky.app/xrpc/app.bsky.graph.getFollows?actor=${did}`,
      )

      if (!followResponse.ok) {
        console.warn(`Failed to fetch follows: ${followResponse.status}`)
        continue
      }

      const followData = await followResponse.json()

      for (const followedUser of followData.follows) {
        if (localDids.has(followedUser.did)) {
          links.push({ source: did, target: followedUser.did })
        }
      }
    }
    return {
      nodes,
      links,
    }
  },
  {
    maxAge: 3600,
    name: 'pds-graphs',
    getKey: () => 'pds-graphs',
  },
)
