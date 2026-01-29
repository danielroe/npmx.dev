export default defineEventHandler(async event => {
  const session = await useSession(event, {
    password: process.env.NUXT_SESSION_PASSWORD as string,
  })

  //TODO clear out the oauth agent

  await session.clear()

  return 'Session cleared'
})
