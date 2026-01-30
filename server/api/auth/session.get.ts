import type { UserSession } from '#shared/schemas/userSession'

export default eventHandlerWithOAuthSession(async (event, oAuthSession, serverSession) => {
  return serverSession.data as UserSession
})
