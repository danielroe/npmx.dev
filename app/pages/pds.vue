<script setup lang="ts">
import type { AtprotoProfile } from '#shared/types/atproto'

const router = useRouter()
const canGoBack = useCanGoBack()

useSeoMeta({
  title: 'npmx.social - npmx',
  ogTitle: 'npmx.social - npmx',
  twitterTitle: 'npmx.social - npmx',
  description: 'The official AT Protocol Personal Data Server (PDS) for the npmx community.',
  ogDescription: 'The official AT Protocol Personal Data Server (PDS) for the npmx community.',
  twitterDescription: 'The official AT Protocol Personal Data Server (PDS) for the npmx community.',
})

defineOgImageComponent('Default', {
  primaryColor: '#60a5fa',
  title: 'npmx.social',
  description: 'The official **PDS** for the npmx community.',
})

const brokenImages = ref(new Set<string>())

const handleImageError = (handle: string) => {
  brokenImages.value.add(handle)
}

const { data: pdsUsers, status: pdsStatus } = useLazyFetch<AtprotoProfile[]>(
  '/api/atproto/pds-users',
  {
    default: () => [],
  },
)

const usersWithAvatars = computed(() => {
  return pdsUsers.value.filter(user => user.avatar && !brokenImages.value.has(user.handle))
})
</script>

<template>
  <main class="container flex-1 py-12 sm:py-16 overflow-x-hidden">
    <article class="max-w-2xl mx-auto">
      <header class="mb-12">
        <div class="flex items-baseline justify-between gap-4 mb-4">
          <h1 class="font-mono text-3xl sm:text-4xl font-medium">npmx.social</h1>
          <button
            type="button"
            class="cursor-pointer inline-flex items-center gap-2 p-1.5 -mx-1.5 font-mono text-sm text-fg-muted hover:text-fg transition-colors duration-200 rounded focus-visible:outline-accent/70 shrink-0"
            @click="router.back()"
            v-if="canGoBack"
          >
            <span class="i-lucide:arrow-left rtl-flip w-4 h-4" aria-hidden="true" />
            <span class="hidden sm:inline">Back</span>
          </button>
        </div>
        <p class="text-fg-muted text-lg">
          The official AT Protocol Personal Data Server (PDS) for the npmx community.
        </p>
      </header>

      <section class="prose prose-invert max-w-none space-y-12">
        <div>
          <h2 class="text-lg text-fg uppercase tracking-wider mb-4">Join the Community</h2>
          <p class="text-fg-muted leading-relaxed mb-4">
            Whether you are creating your first Bluesky account or migrating an existing one, you
            belong here. You can migrate your current account without losing your handle, your
            posts, or your followers.
          </p>
          <div class="mt-6">
            <LinkBase
              to="https://pdsmoover.com/moover/npmx.social"
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-border hover:border-border-hover bg-bg-muted hover:bg-bg transition-colors"
            >
              <span class="i-lucide:arrow-right-left w-4 h-4 text-fg-muted" aria-hidden="true" />
              Migrate with PDS MOOver
            </LinkBase>
          </div>
        </div>

        <div>
          <h2 class="text-lg text-fg uppercase tracking-wider mb-4">Server Details</h2>
          <ul class="space-y-3 text-fg-muted list-none p-0">
            <li class="flex items-start gap-3">
              <span
                class="i-lucide:map-pin shrink-0 mt-1 w-4 h-4 text-fg-subtle"
                aria-hidden="true"
              />
              <span>
                <strong class="text-fg">Location:</strong>
                Nuremberg, Germany
              </span>
            </li>
            <li class="flex items-start gap-3">
              <span
                class="i-lucide:server shrink-0 mt-1 w-4 h-4 text-fg-subtle"
                aria-hidden="true"
              />
              <span>
                <strong class="text-fg">Infrastructure:</strong>
                Hosted on Hetzner
              </span>
            </li>
            <li class="flex items-start gap-3">
              <span
                class="i-lucide:shield-check shrink-0 mt-1 w-4 h-4 text-fg-subtle"
                aria-hidden="true"
              />
              <span>
                <strong class="text-fg">Privacy:</strong>
                Subject to strict EU Data Protection laws
              </span>
            </li>
          </ul>
        </div>
        <div aria-labelledby="community-heading">
          <h2 id="community-heading" class="text-lg text-fg uppercase tracking-wider mb-4">
            Who is here
          </h2>
          <p class="text-fg-muted leading-relaxed mb-6">
            They are already calling npmx.social home.
          </p>

          <div v-if="pdsStatus === 'pending'" class="text-fg-subtle text-sm" role="status">
            Loading PDS community...
          </div>
          <div v-else-if="pdsStatus === 'error'" class="text-fg-subtle text-sm" role="alert">
            Failed to load PDS community.
          </div>
          <ul
            v-else-if="usersWithAvatars.length"
            class="grid grid-cols-[repeat(auto-fill,48px)] gap-2 list-none p-0"
          >
            <li v-for="user in usersWithAvatars" :key="user.handle" class="block group relative">
              <a
                :href="`https://bsky.app/profile/${user.handle}`"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="`View ${user.handle}'s profile`"
                class="block rounded-lg"
              >
                <img
                  :src="user.avatar"
                  :alt="`${user.handle}'s avatar`"
                  @error="handleImageError(user.handle)"
                  width="48"
                  height="48"
                  class="w-12 h-12 rounded-lg ring-2 ring-transparent group-hover:ring-accent transition-all duration-200 ease-out group-hover:scale-125 will-change-transform"
                  loading="lazy"
                />

                <span
                  class="pointer-events-none absolute -top-9 inset-is-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs px-2 py-1 shadow-lg opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 z-10"
                  dir="ltr"
                  role="tooltip"
                >
                  @{{ user.handle }}
                </span>
              </a>
            </li>
          </ul>
        </div>
      </section>
    </article>
  </main>
</template>
