import * as v from 'valibot'
import { PackageNameSchema } from './package'

/**
 * Schema for liking/unliking a package
 */
export const PackageLikeBodySchema = v.object({
  packageName: PackageNameSchema,
})

export type PackageLikeBody = v.InferOutput<typeof PackageLikeBodySchema>

// TODO: add 'avatar'
export const ProfileEditBodySchema = v.object({
  displayName: v.string(),
  website: v.optional(v.string()),
  description: v.optional(v.string()),
})

export type ProfileEditBody = v.InferOutput<typeof ProfileEditBodySchema>
