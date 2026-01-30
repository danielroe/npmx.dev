export default eventHandlerWithOAuthSession(async (event, oAuthSession, serverSession) => {
  return serverSession.data
})
