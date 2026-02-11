export interface GitHubContributor {
  login: string
  id: number
  avatar_url: string
  html_url: string
  contributions: number
  role: Role
}

// TODO: stub - need to fetch list of role members from somewhere to avoid hardcoding (
type Role = 'stewards' | 'core' | 'maintainers' | 'contributor'
const roleMembers: Record<Exclude<Role, 'contributor'>, Set<GitHubContributor['login']>> = {
  stewards: new Set(['danielroe', 'patak-dev']),
  core: new Set([]),
  maintainers: new Set([]),
}

function getRoleInfo(login: string): { role: Role; order: number } {
  if (roleMembers.stewards.has(login)) return { role: 'stewards', order: 0 }
  if (roleMembers.core.has(login)) return { role: 'core', order: 1 }
  if (roleMembers.maintainers.has(login)) return { role: 'maintainers', order: 2 }
  return { role: 'contributor', order: 3 }
}

export default defineCachedEventHandler(
  async (): Promise<GitHubContributor[]> => {
    const allContributors: GitHubContributor[] = []
    let page = 1
    const perPage = 100

    while (true) {
      const response = await fetch(
        `https://api.github.com/repos/npmx-dev/npmx.dev/contributors?per_page=${perPage}&page=${page}`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'npmx',
          },
        },
      )

      if (!response.ok) {
        throw createError({
          statusCode: response.status,
          message: 'Failed to fetch contributors',
        })
      }

      const contributors = (await response.json()) as GitHubContributor[]

      if (contributors.length === 0) {
        break
      }

      allContributors.push(...contributors)

      // If we got fewer than perPage results, we've reached the end
      if (contributors.length < perPage) {
        break
      }

      page++
    }

    return (
      allContributors
        // Filter out bots
        .filter(c => !c.login.includes('[bot]'))
        // Assign role
        .map(c => {
          const { role, order } = getRoleInfo(c.login)
          return Object.assign(c, { role, order })
        })
        // Sort by role (steward > core > maintainer > contributor)
        .sort((a, b) => a.order - b.order)
        .map(({ order: _, ...rest }) => rest)
    )
  },
  {
    maxAge: 3600, // Cache for 1 hour
    name: 'github-contributors',
    getKey: () => 'contributors',
  },
)
