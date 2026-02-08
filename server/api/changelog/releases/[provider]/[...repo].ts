import type { ProviderId } from '~~/shared/utils/git-providers'
import type { ReleaseData } from '~~/shared/types/changelog'
import { GithubReleaseCollectionSchama } from '~~/shared/schemas/changelog/release'
import { ERROR_CHANGELOG_RELEASES_FAILED, THROW_INCOMPLETE_PARAM } from '~~/shared/utils/constants'
import { parse } from 'valibot'

export default defineCachedEventHandler(async event => {
  const provider = getRouterParam(event, 'provider')
  const repo = getRouterParam(event, 'repo')

  if (!repo || !provider || !/^[\w-]+\/[\w-]+$/.test(repo)) {
    throw createError({
      status: 404,
      statusMessage: THROW_INCOMPLETE_PARAM,
    })
  }

  try {
    switch (provider as ProviderId) {
      case 'github':
        return getReleasesFromGithub(repo)

      default:
        return false
    }
  } catch (error) {
    handleApiError(error, {
      statusCode: 502,
      // message: 'temp',
      message: ERROR_CHANGELOG_RELEASES_FAILED,
    })
  }
})

async function getReleasesFromGithub(repo: string) {
  const data = await $fetch(`https://ungh.cc/repos/${repo}/releases`, {
    headers: {
      'Accept': '*/*',
      'User-Agent': 'npmx.dev',
    },
  })

  const { releases } = parse(GithubReleaseCollectionSchama, data)

  return releases.map(
    r =>
      ({
        id: r.id,
        html: r.html,
        title: r.name,
        draft: r.draft,
        prerelease: r.prerelease,
        publishedAt: r.publishedAt,
      }) satisfies ReleaseData,
  )
}
