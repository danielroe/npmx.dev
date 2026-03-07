import * as v from 'valibot'
import { CACHE_MAX_AGE_ONE_DAY, BLUESKY_API } from '#shared/utils/constants'
import { AuthorSchema } from '#shared/schemas/blog'
import { Client } from '@atproto/lex'
import type { Author, ResolvedAuthor } from '#shared/schemas/blog'
import * as app from '#shared/types/lexicons/app'

export default defineCachedEventHandler(
  async event => {
    console.log('bluesky author profiles 1')
    const query = getQuery(event)
    const authorsParam = query.authors
    console.log('bluesky author profiles 2', authorsParam)

    if (!authorsParam || typeof authorsParam !== 'string') {
      console.log('bluesky author profiles 3')
      throw createError({
        statusCode: 400,
        statusMessage: 'authors query parameter is required (JSON array)',
      })
    }

    let authors: Author[]
    try {
      const parsed = JSON.parse(authorsParam)
      authors = v.parse(v.array(AuthorSchema), parsed)
    } catch (error) {
      console.log('bluesky author profiles 4', error)
      if (error instanceof v.ValiError) {
        throw createError({
          statusCode: 400,
          statusMessage: `Invalid authors format: ${error.message}`,
        })
      }
      throw createError({
        statusCode: 400,
        statusMessage: 'authors must be valid JSON',
      })
    }
    console.log('bluesky author profiles 5', authors)

    if (!Array.isArray(authors) || authors.length === 0) {
      return { authors: [] }
    }

    const handles = authors.map(a => a.blueskyHandle).filter(v => v != null)
    console.log('bluesky author profiles 6', handles)

    if (handles.length === 0) {
      return {
        authors: authors.map(author => Object.assign(author, { avatar: null, profileUrl: null })),
      }
    }

    const client = new Client({ service: BLUESKY_API })
    const response = await client
      .call(app.bsky.actor.getProfiles, { actors: handles })
      .catch(() => ({ profiles: [] }))

    const avatarMap = new Map<string, string>()

    for (const profile of response.profiles) {
      if (profile.avatar) {
        avatarMap.set(profile.handle, profile.avatar)
      }
    }

    const resolvedAuthors: ResolvedAuthor[] = authors.map(author =>
      Object.assign(author, {
        avatar: author.blueskyHandle ? avatarMap.get(author.blueskyHandle) || null : null,
        profileUrl: author.blueskyHandle
          ? `https://bsky.app/profile/${author.blueskyHandle}`
          : null,
      }),
    )
    console.log('bluesky author profiles 7', resolvedAuthors)

    return { authors: resolvedAuthors }
  },
  {
    name: 'author-profiles',
    maxAge: CACHE_MAX_AGE_ONE_DAY,
    // getKey: event => {
    //   const { authors } = getQuery(event)
    //   return `author-profiles:${authors ?? 'npmx.dev'}`
    // },
  },
)
