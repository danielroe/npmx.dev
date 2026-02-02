import { Client } from '@atproto/lex'
import * as dev from '#shared/types/lexicons/dev'
import type { UriString } from '@atproto/lex'
import { LIKES_SCOPE } from '~~/shared/utils/constants'
import { checkOAuthScope } from '~~/server/utils/atproto/oauth'

export default eventHandlerWithOAuthSession(async (event, oAuthSession) => {
  const loggedInUsersDid = oAuthSession?.did.toString()

  if (!oAuthSession || !loggedInUsersDid) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<{ packageName: string }>(event)

  if (!body.packageName) {
    throw createError({
      status: 400,
      message: 'packageName is required',
    })
  }

  const likesUtil = new PackageLikesUtils()

  const hasLiked = await likesUtil.hasTheUserLikedThePackage(body.packageName, loggedInUsersDid)
  if (hasLiked) {
    throw createError({
      status: 400,
      message: 'User has already liked the package',
    })
  }

  //Checks if the user has a scope to like packages
  await checkOAuthScope(oAuthSession, LIKES_SCOPE)

  const subjectRef = PACKAGE_SUBJECT_REF(body.packageName)
  const client = new Client(oAuthSession)

  const like = dev.npmx.feed.like.$build({
    createdAt: new Date().toISOString(),
    subjectRef: subjectRef as UriString,
  })

  const result = await client.create(dev.npmx.feed.like, like)
  if (!result) {
    throw createError({
      status: 500,
      message: 'Failed to create a like',
    })
  }

  return await likesUtil.likeAPackageAndRetunLikes(body.packageName, loggedInUsersDid, result.uri)
})
