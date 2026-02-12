import { object, string, optional, array, boolean, pipe, isoTimestamp } from 'valibot'
import type { InferOutput } from 'valibot'

export const AuthorSchema = object({
  name: string(),
  blueskyHandle: optional(string()),
})

export const BlogPostSchema = object({
  authors: array(AuthorSchema),
  title: string(),
  date: pipe(string(), isoTimestamp()),
  description: string(),
  path: string(),
  slug: string(),
  excerpt: optional(string()),
  tags: optional(array(string())),
  draft: optional(boolean()),
})

export type Author = InferOutput<typeof AuthorSchema>

export interface ResolvedAuthor extends Author {
  avatar: string | null
  profileUrl: string | null
}

/**
 * Inferred type for blog post frontmatter
 */
/** @public */
export type BlogPostFrontmatter = InferOutput<typeof BlogPostSchema>
