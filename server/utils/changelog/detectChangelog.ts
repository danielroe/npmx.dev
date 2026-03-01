import type {
  ChangelogMarkdownInfo,
  ChangelogInfo,
  ChangelogReleaseInfo,
} from '~~/shared/types/changelog'
import { type RepoRef, parseRepoUrl } from '~~/shared/utils/git-providers'
import type { ExtendedPackageJson } from '~~/shared/utils/package-analysis'
import { ERROR_CHANGELOG_NOT_FOUND } from '~~/shared/utils/constants'
import * as v from 'valibot'
import { GithubReleaseSchama } from '~~/shared/schemas/changelog/release'

/**
 * Detect whether changelogs/releases are available for this package
 *
 * first checks if releases are available and then changelog.md
 */
export async function detectChangelog(
  pkg: ExtendedPackageJson,
  // packageName: string,
  // version: string,
) {
  if (!pkg.repository?.url) {
    return false
  }

  const repoRef = parseRepoUrl(pkg.repository.url)
  if (!repoRef) {
    return false
  }

  const changelog = (await checkReleases(repoRef)) || (await checkChangelogFile(repoRef))

  if (changelog) {
    return changelog
  }

  throw createError({
    statusCode: 404,
    statusMessage: ERROR_CHANGELOG_NOT_FOUND,
  })
}

/**
 * check whether releases are being used with this repo
 * @returns true if in use
 */
async function checkReleases(ref: RepoRef): Promise<ChangelogInfo | false> {
  switch (ref.provider) {
    case 'github': {
      return checkLatestGithubRelease(ref)
    }
  }

  // const checkUrls = getLatestReleaseUrl(ref)

  // for (const checkUrl of checkUrls ?? []) {
  //   const exists = await fetch(checkUrl, {
  //     headers: {
  //       // GitHub API requires User-Agent
  //       'User-Agent': 'npmx.dev',
  //     },
  //     method: 'HEAD', // we just need to know if it exists or not
  //   })
  //     .then(r => r.ok)
  //     .catch(() => false)
  //   if (exists) {
  //     return {
  //       provider: ref.provider,
  //       type: 'release',
  //       repo: `${ref.owner}/${ref.repo}`,
  //     }
  //   }
  // }
  return false
}

/// releases

const MD_REGEX = /(?<=\[.*?(changelog|releases|changes|history|news)\.md.*?\]\()(.*?)(?=\))/i

function checkLatestGithubRelease(ref: RepoRef): Promise<ChangelogInfo | false> {
  return $fetch(`https://ungh.cc/repos/${ref.owner}/${ref.repo}/releases/latest`)
    .then(r => {
      const { release } = v.parse(v.object({ release: GithubReleaseSchama }), r)

      const matchedChangelog = release.markdown?.match(MD_REGEX)?.at(0)

      // if no changelog.md or the url doesn't contain /blob/
      if (!matchedChangelog || !matchedChangelog.includes('/blob/')) {
        return {
          provider: ref.provider,
          type: 'release',
          repo: `${ref.owner}/${ref.repo}`,
          link: `https://github.com/${ref.owner}/${ref.repo}/releases`,
        } satisfies ChangelogReleaseInfo
      }

      const path = matchedChangelog.replace(/^.*\/blob\/[^/]+\//i, '')
      return {
        provider: ref.provider,
        type: 'md',
        path,
        repo: `${ref.owner}/${ref.repo}`,
        link: matchedChangelog,
      } satisfies ChangelogMarkdownInfo
    })
    .catch(() => {
      return false
    })
}

/// changelog markdown

const EXTENSIONS = ['.md', ''] as const

const CHANGELOG_FILENAMES = ['changelog', 'releases', 'changes', 'history', 'news']
  .map(fileName => {
    const fileNameUpperCase = fileName.toUpperCase()
    return EXTENSIONS.map(ext => [`${fileNameUpperCase}${ext}`, `${fileName}${ext}`])
  })
  .flat(3)

async function checkChangelogFile(ref: RepoRef): Promise<ChangelogMarkdownInfo | false> {
  const baseUrl = getBaseFileUrl(ref)
  if (!baseUrl) {
    return false
  }

  for (const fileName of CHANGELOG_FILENAMES) {
    const exists = await fetch(`${baseUrl.raw}/${fileName}`, {
      headers: {
        // GitHub API requires User-Agent
        'User-Agent': 'npmx.dev',
      },
      method: 'HEAD', // we just need to know if it exists or not
    })
      .then(r => r.ok)
      .catch(() => false)
    if (exists) {
      return {
        type: 'md',
        provider: ref.provider,
        path: fileName,
        repo: `${ref.owner}/${ref.repo}`,
        link: `${baseUrl.blob}/${fileName}`,
      } satisfies ChangelogMarkdownInfo
    }
  }
  return false
}

interface RepoFileUrl {
  raw: string
  blob: string
}

function getBaseFileUrl(ref: RepoRef): RepoFileUrl | null {
  switch (ref.provider) {
    case 'github':
      return {
        raw: `https://ungh.cc/repos/${ref.owner}/${ref.repo}/files/HEAD`,
        blob: `https://github.com/${ref.owner}/${ref.repo}/blob/HEAD`,
      }
  }
  return null
}
