import type { H3Event } from 'h3'
import { createError, readBody } from 'h3'
import * as v from 'valibot'
import { GitHubStarBodySchema } from '#shared/schemas/github'
import { useServerSession } from '#server/utils/server-session'
import { handleApiError } from '#server/utils/error-handler'

export async function toggleGitHubStar(event: H3Event, method: 'PUT' | 'DELETE') {
  const session = await useServerSession(event)
  const github = session.data.github

  if (!github) {
    throw createError({
      statusCode: 401,
      message: 'GitHub account not connected.',
    })
  }

  const { owner, repo } = v.parse(GitHubStarBodySchema, await readBody(event))

  if (!owner || !repo) {
    throw createError({
      statusCode: 400,
      message: 'Missing owner or repo in request body.',
    })
  }

  const isPut = method === 'PUT'

  try {
    await $fetch(`https://api.github.com/user/starred/${owner}/${repo}`, {
      method,
      headers: {
        'Authorization': `Bearer ${github.accessToken}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'npmx',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    return { starred: isPut }
  } catch (error) {
    return handleApiError(error, {
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: `Failed to ${isPut ? 'star' : 'unstar'} repository.`,
    })
  }
}
