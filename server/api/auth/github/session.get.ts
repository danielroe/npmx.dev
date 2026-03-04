import { useServerSession } from '#server/utils/server-session'

export default defineEventHandler(async event => {
  const session = await useServerSession(event)
  const github = session.data.github

  return github ? { username: github.username } : null
})
