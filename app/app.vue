<script setup lang="ts">
import type { Directions } from '@nuxtjs/i18n'
import { useEventListener } from '@vueuse/core'

const route = useRoute()
const router = useRouter()
const { locale, locales } = useI18n()

// Initialize user preferences (accent color, package manager) before hydration to prevent flash/CLS
initPreferencesOnPrehydrate()

const isHomepage = computed(() => route.name === 'index')

const localeMap = locales.value.reduce(
  (acc, l) => {
    acc[l.code] = l.dir ?? 'ltr'
    return acc
  },
  {} as Record<string, Directions>,
)

useHead({
  htmlAttrs: {
    lang: () => locale.value,
    dir: () => localeMap[locale.value] ?? 'ltr',
  },
  titleTemplate: titleChunk => {
    return titleChunk ? titleChunk : 'npmx - Better npm Package Browser'
  },
})

if (import.meta.server) {
  setJsonLd(createWebSiteSchema())
}

// Global keyboard shortcut:
// "/" focuses search or navigates to search page
// "?" highlights all keyboard shortcut elements
function handleGlobalKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement

  const isEditableTarget =
    target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

  if (isEditableTarget) {
    return
  }

  if (e.key === '/') {
    e.preventDefault()

    // Try to find and focus search input on current page
    const searchInput = document.querySelector<HTMLInputElement>(
      'input[type="search"], input[name="q"]',
    )

    if (searchInput) {
      searchInput.focus()
      return
    }

    router.push('/search')
  }

  if (e.key === '?') {
    e.preventDefault()
    document.documentElement.setAttribute('data-keyboard-shortcut-highlight', 'true')
  }
}

function handleGlobalKeyup() {
  // Don't check for key, "?" requires a combination and keys can be released independently
  document.documentElement.removeAttribute('data-keyboard-shortcut-highlight')
}

if (import.meta.client) {
  useEventListener(document, 'keydown', handleGlobalKeydown)
  useEventListener(document, 'keyup', handleGlobalKeyup)
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-bg text-fg">
    <NuxtPwaAssets />
    <a href="#main-content" class="skip-link font-mono">{{ $t('common.skip_link') }}</a>

    <AppHeader :show-logo="!isHomepage" />

    <div id="main-content" class="flex-1 flex flex-col">
      <NuxtPage />
    </div>

    <AppFooter />

    <ScrollToTop />
  </div>
</template>

<style>
/* Keyboard shortcut highlight */
kbd {
  position: relative;
}

kbd::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 0 4px 2px var(--accent);
  opacity: 0;
  transition: opacity 100ms cubic-bezier(0.5, 0, 0.64, 0.73);
  pointer-events: none;
}

html[data-keyboard-shortcut-highlight='true'] kbd::before {
  opacity: 1;
}
</style>
