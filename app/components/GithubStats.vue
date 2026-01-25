<script setup lang="ts">
const { repositoryUrl } = defineProps<{
  repositoryUrl: string | null
}>()

const {
  githubRepo,
  stars: githubStars,
  forks: githubForks,
  pending: githubPending,
  error: githubError,
} = useGithubRepo(repositoryUrl)
</script>

<template>
  <div v-if="githubRepo" class="inline-flex items-center gap-2">
    <a
      :href="`https://github.com/${githubRepo.owner}/${githubRepo.repo}`"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1 font-mono text-sm text-fg-muted hover:text-fg transition-colors"
      title="GitHub stars"
    >
      <span>{{ formatNumber(githubStars) }}</span>
      <span class="i-carbon-star-filled w-4 h-4" aria-hidden="true" />
    </a>

    <span class="text-fg-subtle">·</span>

    <span
      class="inline-flex items-center gap-1 font-mono text-sm text-fg-muted"
      title="GitHub forks"
    >
      <span>{{ formatNumber(githubForks) }}</span>
      <span class="i-carbon-fork w-4 h-4" aria-hidden="true" />
    </span>

    <span v-if="githubPending" class="text-fg-subtle font-mono text-xs">loading…</span>
  </div>
</template>
