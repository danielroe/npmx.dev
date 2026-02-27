<script setup lang="ts">
import type { FederatedArticleInput } from '#shared/types/blog-post'

const props = defineProps<{
  headline: string
  articles: FederatedArticleInput[]
}>()

const contentKey = computed(() => props.articles.map(a => a.url).join('-'))

const { data: federatedArticles, status } = await useAsyncData(
  `federated-articles-${contentKey.value}`,
  () => useFederatedArticles(props.articles),
  {
    watch: [() => props.articles],
    default: () => [],
  },
)
</script>

<template>
  <article class="px-4 py-2 sm:-mx-6 sm:px-6 sm:-my-3 sm:py-3 sm:rounded-md">
    <h2 class="font-mono text-xl font-medium text-fg">
      {{ headline }}
    </h2>
    <section
      v-if="federatedArticles?.length"
      class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] transition-[grid-template-cols]"
    >
      <a
        :href="article.url"
        target="_blank"
        rel="noopener noreferrer"
        v-for="article in federatedArticles"
        :key="article.url"
        class="grid grid-cols-[auto_1fr] gap-x-5 no-underline hover:no-underline rounded-lg border border-border p-4 transition-shadow hover:shadow-lg hover:shadow-gray-500/50"
      >
        <AuthorAvatar
          v-if="article?.author"
          :author="article.author"
          size="md"
          class="row-span-2"
        />
        <div class="flex flex-col">
          <p class="text-lg text-fg uppercase leading-tight m-0">
            {{ article.title }}
          </p>
          <p class="text-md font-semibold text-fg-muted leading-none mt-2">
            {{ article.author.name }}
          </p>
          <p class="text-xs text-fg-subtle leading-snug m-0">
            {{ article.description }}
          </p>
        </div>
      </a>
    </section>
  </article>
</template>
