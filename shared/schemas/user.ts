import * as v from 'valibot'

const NPM_USERNAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i
const NPM_USERNAME_MAX_LENGTH = 50

/**
 * Schema for npm usernames.
 */
export const NpmUsernameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty('Username is required'),
  v.maxLength(NPM_USERNAME_MAX_LENGTH, 'Username is too long'),
  v.regex(NPM_USERNAME_RE, 'Invalid username format'),
)

/**
 * Schema for Gravatar query inputs.
 */
export const GravatarQuerySchema = v.object({
  username: NpmUsernameSchema,
  size: v.optional(
    v.pipe(
      v.union([v.number(), v.string()]),
      v.transform(value => {
        if (typeof value === 'string') {
          const trimmed = value.trim()
          return /^\d+$/.test(trimmed) ? Number(trimmed) : Number.NaN
        }
        return value
      }),
      v.check(value => !Number.isNaN(value), 'Invalid size'),
      v.number(),
      v.minValue(16),
      v.maxValue(512),
    ),
  ),
})

/** @public */
export type NpmUsername = v.InferOutput<typeof NpmUsernameSchema>
/** @public */
export type GravatarQuery = v.InferOutput<typeof GravatarQuerySchema>
