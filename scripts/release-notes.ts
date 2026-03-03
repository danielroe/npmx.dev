/**
 * Generates full release notes with changelogen + @username contributor mentions.
 *
 * Usage: node scripts/release-notes.ts <from-ref> [to-ref]
 *
 * Outputs the complete release notes markdown to stdout, including:
 * - Changelog sections (features, fixes, etc.) via changelogen
 * - Contributors section with GitHub @username mentions
 *
 * Set GITHUB_TOKEN for higher API rate limits.
 */

import process from 'node:process'
import { $fetch } from 'ofetch'
import { getGitDiff, loadChangelogConfig, parseCommits, generateMarkDown } from 'changelogen'

const REPO = 'npmx-dev/npmx.dev'

interface Contributor {
  name: string
  username: string
}

async function resolveContributors(
  rawCommits: Awaited<ReturnType<typeof getGitDiff>>,
): Promise<Contributor[]> {
  const contributors: Contributor[] = []
  const seenEmails = new Set<string>()
  const seenUsernames = new Set<string>()
  const token = process.env.GITHUB_TOKEN

  for (const commit of rawCommits) {
    if (
      seenEmails.has(commit.author.email) ||
      commit.author.name.endsWith('[bot]') ||
      commit.author.email === 'noreply@github.com'
    ) {
      continue
    }
    seenEmails.add(commit.author.email)

    try {
      const data = await $fetch<{ author: { login: string } | null }>(
        `https://api.github.com/repos/${REPO}/commits/${commit.shortHash}`,
        {
          headers: {
            'User-Agent': REPO,
            'Accept': 'application/vnd.github.v3+json',
            ...(token ? { Authorization: `token ${token}` } : {}),
          },
        },
      )

      if (data.author?.login && !seenUsernames.has(data.author.login)) {
        seenUsernames.add(data.author.login)
        contributors.push({ name: commit.author.name, username: data.author.login })
      }
    } catch {
      // If API call fails (rate limit, etc.), skip this contributor
    }
  }

  return contributors
}

async function main() {
  const from = process.argv[2]
  const to = process.argv[3] || 'HEAD'

  if (!from) {
    console.error('Usage: node scripts/release-notes.ts <from-ref> [to-ref]')
    process.exit(1)
  }

  const config = await loadChangelogConfig(process.cwd(), { from, to, noAuthors: true })
  const rawCommits = await getGitDiff(from, to)
  const commits = parseCommits(rawCommits, config)

  // Generate changelog markdown via changelogen
  const markdown = await generateMarkDown(commits, config)

  // Resolve contributors to GitHub @username mentions
  const contributors = await resolveContributors(rawCommits)

  let output = markdown

  if (contributors.length > 0) {
    const lines = contributors.map(c => `- ${c.name} (@${c.username})`).join('\n')

    output += `\n\n### ❤️ Contributors\n\n${lines}`
  }

  console.log(output)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
