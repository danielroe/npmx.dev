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

const slug = computed(() => props.frontmatter?.slug)

// Use Constellation to find the Bluesky post linking to this blog post
const { data: blueskyLink } = await useBlogPostBlueskyLink(slug)
const blueskyPostUri = computed(() => blueskyLink.value?.postUri ?? null)
</script>

<template>
  <main class="container w-full py-8">
    <article class="prose dark:prose-invert mx-auto">
      <slot />
    </article>

    <!--
      - Only renders if Constellation found a Bluesky post linking to this slug
      - Cached API route avoids rate limits during build
    -->
    <LazyBlueskyComments v-if="blueskyPostUri" :post-uri="blueskyPostUri" />
  </main>
</template>
