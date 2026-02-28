<script setup lang="ts">
const { info, requestedDate } = defineProps<{
  info: ChangelogReleaseInfo
  requestedDate?: string
}>()

const { data: releases } = useFetch<ReleaseData[]>(
  () => `/api/changelog/releases/${info.provider}/${info.repo}`,
)

const route = useRoute()
const router = useRouter()

watch(
  [() => route.hash, () => requestedDate, releases],
  ([hash, date, r]) => {
    console.log('mario')
    if (hash || !date || !r) {
      return
    }

    router.push(`#date-${date}`)
  },
  {
    immediate: true,
  },
)
</script>
<template>
  <div class="flex flex-col gap-2 py-3" v-if="releases">
    <ClientOnly>
      <ChangelogCard v-for="release of releases" :release :key="release.id" />
    </ClientOnly>
  </div>
</template>
