import { Client } from '@atproto/lex'
import * as dev from '#shared/types/lexicons/dev'
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

  const getTheUsersLikedRecord = await likesUtil.getTheUsersLikedRecord(
    body.packageName,
    loggedInUsersDid,
  )
  if (getTheUsersLikedRecord) {
    //Checks if the user has a scope to like packages
    await checkOAuthScope(oAuthSession, LIKES_SCOPE)
    const client = new Client(oAuthSession)

    await client.delete(dev.npmx.feed.like, {
      rkey: getTheUsersLikedRecord.rkey,
    })
    var result = await likesUtil.unlikeAPackageAndReturnLikes(body.packageName, loggedInUsersDid)
    return result
  }
})
