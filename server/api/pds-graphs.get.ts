import type { AtprotoProfile } from '#server/api/pds-users.get.ts'

interface GraphLink {
  source: string
  target: string
}

export default defineCachedEventHandler(
  async (): Promise<{ nodes: AtprotoProfile[]; links: GraphLink[] }> => {
    const response = await fetch('https://npmx.social/xrpc/com.atproto.sync.listRepos?limit=1000')

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: 'Failed to fetch PDS repos',
      })
    }

    const listRepos = (await response.json()) as { repos: { did: string }[] }
    const dids = listRepos.repos.map(repo => repo.did)
    const localDids = new Set(dids)

    const getProfilesUrl = 'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfiles'
    const nodes: AtprotoProfile[] = []
    const links: GraphLink[] = []

    for (let i = 0; i < dids.length; i += 25) {
      const batch = dids.slice(i, i + 25)

      const params = new URLSearchParams()
      for (const did of batch) {
        params.append('actors', did)
      }

      try {
        const profilesResponse = await fetch(`${getProfilesUrl}?${params.toString()}`)

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
        console.warn(`Failed to fetch atproto profiles: ${followResponse.status}`)
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
)
