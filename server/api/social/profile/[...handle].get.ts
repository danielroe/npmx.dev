export default defineEventHandler(async event => {
  const handle = getRouterParam(event, 'handle')
  if (!handle) {
    throw createError({
      status: 400,
      message: 'handle not provided',
    })
  }

  const profileUtil = new ProfileUtils()
  const profile = await profileUtil.getProfile(handle)
  console.log('ENDPOINT', { handle, profile })
  return profile
})
