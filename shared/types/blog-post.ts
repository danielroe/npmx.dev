import type * as app from '#shared/types/lexicons/app'
import type { BlogMetaResponse } from '#shared/schemas/atproto'
import type { ResolvedAuthor } from '#shared/schemas/blog'

export type CommentEmbed =
  | { type: 'images'; images: app.bsky.embed.images.ViewImage[] }
  | { type: 'external'; external: app.bsky.embed.external.ViewExternal }

export interface Comment {
  uri: string
  cid: string
  author: Pick<app.bsky.actor.defs.ProfileViewBasic, 'did' | 'handle' | 'displayName' | 'avatar'>
  text: string
  facets?: app.bsky.richtext.facet.Main[]
  embed?: CommentEmbed
  createdAt: string
  likeCount: number
  replyCount: number
  repostCount: number
  replies: Comment[]
}

/*
  WARN: FederatedArticleInput specifics
  interface - All strings must be captured in single quotes in order to be parsed correctly in the MD file
  authorHandle - Must not contain `@` symbol prefix
  description - Passing an empty string `''` will fallback to the description provided by the scraped meta tags
  description - Any additional single quotes must be properly escaped with a `\`
*/
export interface FederatedArticleInput {
  url: string
  authorHandle: string
  description?: string
}

export type ResolvedFederatedArticle = Omit<BlogMetaResponse, 'author' | '_meta'> & {
  url: string
  author: ResolvedAuthor
}
