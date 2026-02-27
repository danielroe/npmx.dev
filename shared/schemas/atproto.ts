import { object, string, startsWith, minLength, regex, pipe } from 'valibot'
import type { InferOutput } from 'valibot'
import { AT_URI_REGEX } from '#shared/utils/constants'

/**
 * INFO: Validates AT Protocol URI format (at://did:plc:.../app.bsky.feed.post/...)
 * Used for referencing Bluesky posts in our database and API routes.
 */
export const BlueSkyUriSchema = object({
  uri: pipe(
    string(),
    startsWith('at://'),
    minLength(10),
    regex(AT_URI_REGEX, 'Must be a valid at:// URI'),
  ),
})

export type BlueSkyUri = InferOutput<typeof BlueSkyUriSchema>
