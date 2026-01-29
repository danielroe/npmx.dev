import { eventHandlerWithOAuthSession } from '#server/utils/atproto'

export default eventHandlerWithOAuthSession(async (event, oAuthSession) => {
  const session = await useSession(event, {
    password: process.env.NUXT_SESSION_PASSWORD as string,
  })

  await oAuthSession?.signOut()
  await session.clear()

  return 'Session cleared'
})
