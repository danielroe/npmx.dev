export interface AtprotoProfile {
  did: string
  handle: string
  displayName?: string
  avatar?: string
}

export default defineCachedEventHandler(
  async (): Promise<AtprotoProfile[]> => {
    const response = await fetch('https://npmx.social/xrpc/com.atproto.sync.listRepos?limit=1000')

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: 'Failed to fetch PDS repos',
      })
    }

    const listRepos = (await response.json()) as { repos: { did: string }[] }
    const dids = listRepos.repos.map(repo => repo.did)

    const getProfilesUrl = 'https://public.api.bsky.app/xrpc/app.bsky.actor.getProfiles'
    const allProfiles: AtprotoProfile[] = []

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
          allProfiles.push(...profilesData.profiles)
        }
      } catch (error) {
        console.warn('Failed to fetch atproto profiles:', error)
      }
    }

    return allProfiles
  },
  {
    maxAge: 3600,
    name: 'pds-users',
    getKey: () => 'pds-users',
  },
)
