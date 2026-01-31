<script setup lang="ts">
import type { BlogPostFrontmatter } from '#shared/schemas/blog'

const props = defineProps<{
  frontmatter?: BlogPostFrontmatter
}>()

useSeoMeta({
  title: props.frontmatter?.title,
  description: props.frontmatter?.description || props.frontmatter?.excerpt,
  ogTitle: props.frontmatter?.title,
  ogDescription: props.frontmatter?.description || props.frontmatter?.excerpt,
  ogType: 'article',
})
</script>
<template>
  <main class="container w-full py-8">
    <article class="prose dark:prose-invert mx-auto">
      <slot />
    </article>
  </main>
</template>
