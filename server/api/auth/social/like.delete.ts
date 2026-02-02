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

  const cachedFetch = event.context.cachedFetch
  if (!cachedFetch) {
    // TODO: Probably needs to add in a normal fetch if not provided
    // but ideally should not happen
    throw createError({
      status: 500,
      message: 'cachedFetch not provided in context',
    })
  }

  const likesUtil = new PackageLikesUtils(cachedFetch)

  const getTheUsersLikedRecord = await likesUtil.getTheUsersLikedRecord(
    body.packageName,
    loggedInUsersDid,
  )
  if (getTheUsersLikedRecord) {
    //Checks if the user has a scope to like packages
    await checkOAuthScope(oAuthSession, LIKES_SCOPE)
    const client = new Client(oAuthSession)

    var result = await client.delete(dev.npmx.feed.like, {
      rkey: getTheUsersLikedRecord.rkey,
    })
    console.log(result)
    return await likesUtil.unlikeAPackageAndReturnLikes(body.packageName, loggedInUsersDid)
  }
})
