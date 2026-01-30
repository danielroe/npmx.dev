export default eventHandlerWithOAuthSession(async (event, oAuthSession) => {
  const config = useRuntimeConfig(event)
  if (!config.sessionPassword) {
    throw createError({
      status: 500,
      message: 'NUXT_SESSION_PASSWORD not set',
    })
  }

  const session = await useSession(event, {
    password: config.sessionPassword,
  })

  await oAuthSession?.signOut()
  await session.clear()

  return 'Session cleared'
})
