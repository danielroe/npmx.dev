<script setup lang="ts">
const props = defineProps<{
  headline: string
  articles: {
    url: string
    // WARN: Must not contain @ symbol prefix
    authorHandle: string
  }[]
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
    <div
      v-if="federatedArticles?.length"
      class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] transition-[grid-template-cols]"
    >
      <section
        v-for="article in federatedArticles"
        :key="article.url"
        class="rounded-lg border border-border p-2 transition-shadow hover:shadow-lg hover:shadow-gray-500/50"
      >
        <a
          :href="article.url"
          target="_blank"
          rel="noopener noreferrer"
          class="grid grid-cols-[auto_1fr] items-center gap-x-5 no-underline hover:no-underline"
        >
          <AuthorAvatar
            v-if="article?.author"
            :author="article.author"
            size="md"
            class="row-span-2"
          />
          <div class="flex flex-col gap-y-4">
            <p class="text-lg font-bold text-fg uppercase line-clamp-2 m-0">{{ article.title }}</p>
            <p class="text-md font-semibold text-fg-muted m-0">{{ article.author.name }}</p>
            <p class="text-xs line-clamp-1 text-fg-subtle m-0">{{ article.description }}</p>
          </div>
        </a>
      </section>
    </div>
  </article>
</template>
