<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => props.error.statusCode || 500)
const statusMessage = computed(() => {
  if (props.error.statusMessage) return props.error.statusMessage
  switch (statusCode.value) {
    case 404: return 'Page not found'
    case 500: return 'Internal server error'
    case 503: return 'Service unavailable'
    default: return 'Something went wrong'
  }
})

function handleError() {
  clearError({ redirect: '/' })
}

useHead({
  title: `${statusCode.value} - ${statusMessage.value}`,
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-bg text-fg">
    <header class="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
      <nav
        aria-label="Main navigation"
        class="container h-14 flex items-center justify-between"
      >
        <a
          href="/"
          class="header-logo font-mono text-lg font-medium text-fg hover:text-fg transition-colors duration-200 focus-ring rounded"
        >
          <span class="text-fg-subtle">./</span>npmx
        </a>

        <ul class="flex items-center gap-6 list-none m-0 p-0">
          <li class="flex">
            <a
              href="/search"
              class="link-subtle font-mono text-sm inline-flex items-center"
            >
              search
            </a>
          </li>
          <li class="flex">
            <a
              href="https://github.com/danielroe/npmx.dev"
              rel="noopener noreferrer"
              class="link-subtle font-mono text-sm inline-flex items-center gap-1.5"
            >
              <span class="i-carbon-logo-github w-4 h-4" />
              <span class="hidden sm:inline">github</span>
            </a>
          </li>
        </ul>
      </nav>
    </header>

    <main class="flex-1 container flex flex-col items-center justify-center py-20 text-center">
      <p class="font-mono text-8xl sm:text-9xl font-medium text-fg-subtle mb-4">
        {{ statusCode }}
      </p>

      <h1 class="font-mono text-2xl sm:text-3xl font-medium mb-4">
        {{ statusMessage }}
      </h1>

      <p
        v-if="error.message && error.message !== statusMessage"
        class="text-fg-muted text-base max-w-md mb-8"
      >
        {{ error.message }}
      </p>

      <button
        type="button"
        class="font-mono text-sm px-6 py-3 bg-fg text-bg rounded-lg transition-all duration-200 hover:bg-fg/90 active:scale-95"
        @click="handleError"
      >
        go home
      </button>
    </main>

    <footer class="border-t border-border mt-auto">
      <div class="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-fg-subtle text-sm">
        <p class="font-mono m-0">
          a better npm browser
        </p>
        <div class="flex items-center gap-6">
          <a
            href="https://github.com/danielroe/npmx.dev"
            rel="noopener noreferrer"
            class="link-subtle font-mono text-xs"
          >
            source
          </a>
          <span class="text-border">|</span>
          <a
            href="https://roe.dev"
            rel="noopener noreferrer"
            class="link-subtle font-mono text-xs"
          >
            @danielroe
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>
