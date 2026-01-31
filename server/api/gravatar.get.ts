import type { H3Event } from 'h3'
import { CACHE_MAX_AGE_ONE_DAY } from '#shared/utils/constants'
import { getGravatarFromUsername } from '#server/utils/gravatar'
import { assertValidUsername } from '#shared/utils/npm'

function getQueryParam(event: H3Event, key: string): string {
  const query = getQuery(event)
  const value = query[key]
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '')
}

export default defineCachedEventHandler(
  async event => {
    const username = getQueryParam(event, 'username').trim()

    if (!username) {
      throw createError({
        statusCode: 400,
        message: 'Username is required',
      })
    }

    assertValidUsername(username)

    const sizeParam = Number.parseInt(getQueryParam(event, 'size'), 10)
    const size = Number.isNaN(sizeParam) ? 80 : Math.max(16, Math.min(512, sizeParam))

    const url = await getGravatarFromUsername(username, size)

    if (!url) {
      throw createError({
        statusCode: 400,
        message: "User's email not accessible",
      })
    }

    return { url }
  },
  {
    maxAge: CACHE_MAX_AGE_ONE_DAY,
    swr: true,
    getKey: event => {
      const username = getQueryParam(event, 'username').trim().toLowerCase()
      const size = getQueryParam(event, 'size') || '80'
      const defaultImg = getQueryParam(event, 'default') || '404'
      return `gravatar:v1:${username}:${size}:${defaultImg}`
    },
  },
)
