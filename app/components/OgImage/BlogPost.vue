<script setup lang="ts">
import type { ResolvedAuthor } from '#shared/schemas/blog'

console.log('blog post 1')

const props = withDefaults(
  defineProps<{
    title: string
    authors?: ResolvedAuthor[]
    date?: string
    primaryColor?: string
  }>(),
  {
    authors: () => [],
    date: '',
    primaryColor: '#60a5fa',
  },
)
console.log('blog post 2', props)
</script>

<template>
  <div>Test</div>
</template>
