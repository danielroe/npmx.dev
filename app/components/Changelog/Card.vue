<script setup lang="ts">
import type { ReleaseData } from '~~/shared/types/changelog'

const { release } = defineProps<{
  release: ReleaseData
}>()
</script>
<template>
  <section class="border border-border rounded-lg p-4 sm:p-6">
    <h1 class="text-1xl sm:text-2xl font-medium min-w-0 break-words py-2">
      {{ release.title }}
    </h1>
    <Readme :html="release.html.trim()" class="whitespace-pre-line"></Readme>
  </section>
</template>

<!--     class="group bg-bg-subtle border border-border rounded-lg p-4 sm:p-6 transition-[border-color,background-color] duration-200 hover:(border-border-hover bg-bg-muted) cursor-pointer relative focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-bg focus-within:ring-offset-2 focus-within:ring-fg/50 focus-within:bg-bg-muted focus-within:border-border-hover" -->
