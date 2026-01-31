import * as v from 'valibot'

export const BlogPostSchema = v.object({
  author: v.string(),
  title: v.string(),
  date: v.string(),
  description: v.string(),
  slug: v.string(),
  excerpt: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  draft: v.optional(v.boolean()),
})

/**
 * Inferred type for blog post frontmatter
 */
/** @public */
export type BlogPostFrontmatter = v.InferOutput<typeof BlogPostSchema>
