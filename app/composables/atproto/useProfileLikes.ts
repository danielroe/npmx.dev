export type LikesResult = {
  records: {
    value: {
      subjectRef: string
    }
  }[]
}

export function useProfileLikes(handle: MaybeRefOrGetter<string>) {
  const cachedFetch = useCachedFetch()
  return useLazyAsyncData(`profile:${toValue(handle)}:likes`, async (_nuxtApp, { signal }) => {
    const { data: likes, isStale } = await cachedFetch<LikesResult>(
      `/api/social/profile/${toValue(handle)}/likes`,
      { signal },
    )

    return { likes, isStale }
  })
}
