import * as v from 'valibot'

export const GithubReleaseSchama = v.object({
  id: v.pipe(v.number(), v.integer()),
  name: v.string(),
  draft: v.boolean(),
  prerelease: v.boolean(),
  //   publishedAt: v.pipe(v.string(), v.isoDateTime()),
  html: v.string(),
  markdown: v.string(),
  publishedAt: v.pipe(v.string(), v.isoTimestamp()),
})

export const GithubReleaseCollectionSchama = v.object({
  releases: v.array(GithubReleaseSchama),
})

export type GithubRelease = v.InferOutput<typeof GithubReleaseSchama>
export type GithubReleaseCollection = v.InferOutput<typeof GithubReleaseCollectionSchama>
