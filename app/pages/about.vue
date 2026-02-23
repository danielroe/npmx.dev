<script setup lang="ts">
import type { Role, GitHubContributor } from '#server/api/contributors.get'

const router = useRouter()
const canGoBack = useCanGoBack()

// SSR & Validation Fix
const isMounted = shallowRef(false)
const activeContributor = shallowRef<GitHubContributor | null>(null)
const openTimer = shallowRef<any>(null)
const closeTimer = shallowRef<any>(null)
const isFlipped = shallowRef(false)

onMounted(() => {
  isMounted.value = true
})

useSeoMeta({
  title: () => `${$t('about.title')} - npmx`,
  ogTitle: () => `${$t('about.title')} - npmx`,
  twitterTitle: () => `${$t('about.title')} - npmx`,
  description: () => $t('about.meta_description'),
  ogDescription: () => $t('about.meta_description'),
  twitterDescription: () => $t('about.meta_description'),
})

defineOgImageComponent('Default', {
  primaryColor: '#60a5fa',
  title: 'about npmx',
  description: 'a fast, modern browser for the **npm registry**',
})

const pmLinks = {
  npm: 'https://www.npmjs.com/',
  pnpm: 'https://pnpm.io/',
  yarn: 'https://yarnpkg.com/',
  bun: 'https://bun.sh/',
  deno: 'https://deno.com/',
  vlt: 'https://www.vlt.sh/',
}

const { data, status: contributorsStatus } = useLazyFetch('/api/contributors')

/**
 * Checks if a contributor should show the expanded card.
 */
function isExpandable(c: GitHubContributor) {
  const isGovernance = c.role === 'steward' || c.role === 'maintainer'
  return (
    isGovernance ||
    !!c.bio ||
    !!c.company ||
    !!c.name ||
    !!c.location ||
    !!c.twitterUsername ||
    !!c.websiteUrl
  )
}

const contributors = computed(() => data.value ?? [])

const roleLabels = computed(
  () =>
    ({
      steward: $t('about.team.role_steward'),
      maintainer: $t('about.team.role_maintainer'),
    }) as Partial<Record<Role, string>>,
)

/**
 * High-performance positioning for Firefox and Chrome (TODO: Safari will require a review :fingers_crossed:).
 * Handles vertical collision for top-row items.
 */
async function positionPopover(anchorId: string) {
  const popover = document.getElementById('shared-contributor-popover')
  const anchor = document.getElementById(anchorId)

  if (!popover || !anchor) return

  // 1. Wait for Vue to update the reactive state
  await nextTick()

  // 2. Open popover so it enters Top Layer (Firefox dimensions fix)
  if (!popover.matches(':popover-open')) {
    try {
      ;(popover as any).showPopover()
    } catch (e) {}
  }

  // 3. One more tick to ensure the DOM is actually painted with the content
  // This fixes the "only showing website link" bug in some browsers
  await nextTick()

  const rect = anchor.getBoundingClientRect()
  const padding = 16
  const popoverWidth = popover.offsetWidth || 256
  const popoverHeight = popover.offsetHeight || 280

  // Check if there is enough space above the avatar (including header margin)
  // If we are too close to the top (e.g., < 300px), show below
  const showBelow = rect.top < popoverHeight + 20
  isFlipped.value = showBelow

  const idealLeft = rect.left + rect.width / 2
  const minLeft = popoverWidth / 2 + padding
  const maxLeft = window.innerWidth - popoverWidth / 2 - padding
  const finalLeft = Math.max(minLeft, Math.min(idealLeft, maxLeft))

  // 4. Position using fixed viewport coordinates
  const yBase = showBelow ? rect.bottom + 12 : rect.top - 12
  const yPercent = showBelow ? '0' : '-100%'

  popover.style.transform = `translate3d(${finalLeft}px, ${yBase}px, 0) translate(-50%, ${yPercent})`

  // --- Inside positionPopover function ---
  const arrow = popover.querySelector('.popover-arrow') as HTMLElement
  if (arrow) {
    const delta = idealLeft - finalLeft
    // We use a CSS variable to pass the value safely to the template
    arrow.style.setProperty('--arrow-delta', `${delta}px`)
  }
}

function onMouseEnter(contributor: GitHubContributor) {
  if (!isExpandable(contributor)) return
  cancelClose()
  clearTimeout(openTimer.value)

  const trigger = () => {
    activeContributor.value = contributor
    positionPopover(`anchor-${contributor.id}`)
  }

  if (activeContributor.value) {
    trigger()
  } else {
    openTimer.value = setTimeout(trigger, 80)
  }
}

function cancelClose() {
  if (closeTimer.value) {
    clearTimeout(closeTimer.value)
    closeTimer.value = null
  }
}

function onMouseLeave() {
  clearTimeout(openTimer.value)
  closeTimer.value = setTimeout(() => {
    const popover = document.getElementById('shared-contributor-popover')
    if (popover && !popover.matches(':hover')) {
      try {
        ;(popover as any).hidePopover()
      } catch (e) {}
      activeContributor.value = null
    }
  }, 120)
}
</script>

<template>
  <main class="container flex-1 py-12 sm:py-16 overflow-x-hidden">
    <article class="max-w-2xl mx-auto">
      <header class="mb-12">
        <div class="flex items-baseline justify-between gap-4 mb-4">
          <h1 class="font-mono text-3xl sm:text-4xl font-medium">
            {{ $t('about.heading') }}
          </h1>
          <button
            v-if="canGoBack"
            type="button"
            class="cursor-pointer inline-flex items-center gap-2 font-mono text-sm text-fg-muted hover:text-fg transition-colors duration-200 rounded focus-visible:outline-accent/70 shrink-0"
            @click="router.back()"
          >
            <span class="i-lucide:arrow-left rtl-flip w-4 h-4" aria-hidden="true" />
            <span class="hidden sm:inline">{{ $t('nav.back') }}</span>
          </button>
        </div>
        <p class="text-fg-muted text-lg">
          {{ $t('tagline') }}
        </p>
      </header>

      <section class="prose prose-invert max-w-none space-y-8">
        <div>
          <h2 class="text-lg text-fg-subtle uppercase tracking-wider mb-4">
            {{ $t('about.what_we_are.title') }}
          </h2>
          <p class="text-fg-muted leading-relaxed mb-4">
            <i18n-t keypath="about.what_we_are.description" tag="span" scope="global">
              <template #betterUxDx>
                <strong class="text-fg">{{ $t('about.what_we_are.better_ux_dx') }}</strong>
              </template>
              <template #jsr>
                <LinkBase to="https://jsr.io/">JSR</LinkBase>
              </template>
            </i18n-t>
          </p>
          <p class="text-fg-muted leading-relaxed">
            <i18n-t keypath="about.what_we_are.admin_description" tag="span" scope="global">
              <template #adminUi>
                <strong class="text-fg">{{ $t('about.what_we_are.admin_ui') }}</strong>
              </template>
            </i18n-t>
          </p>
        </div>

        <div>
          <h2 class="text-lg text-fg-subtle uppercase tracking-wider mb-4">
            {{ $t('about.what_we_are_not.title') }}
          </h2>
          <ul class="space-y-3 text-fg-muted list-none p-0">
            <li class="flex items-start gap-3">
              <span class="text-fg-subtle shrink-0 mt-1">&mdash;</span>
              <span>
                <strong class="text-fg">{{
                  $t('about.what_we_are_not.not_package_manager')
                }}</strong>
                {{ ' ' }}
                <i18n-t
                  keypath="about.what_we_are_not.package_managers_exist"
                  tag="span"
                  scope="global"
                >
                  <template #already>{{ $t('about.what_we_are_not.words.already') }}</template>
                  <template #people>
                    <LinkBase :to="pmLinks.npm" class="font-sans">{{
                      $t('about.what_we_are_not.words.people')
                    }}</LinkBase>
                  </template>
                  <template #building>
                    <LinkBase :to="pmLinks.pnpm" class="font-sans">{{
                      $t('about.what_we_are_not.words.building')
                    }}</LinkBase>
                  </template>
                  <template #really>
                    <LinkBase :to="pmLinks.yarn" class="font-sans">{{
                      $t('about.what_we_are_not.words.really')
                    }}</LinkBase>
                  </template>
                  <template #cool>
                    <LinkBase :to="pmLinks.bun" class="font-sans">{{
                      $t('about.what_we_are_not.words.cool')
                    }}</LinkBase>
                  </template>
                  <template #package>
                    <LinkBase :to="pmLinks.deno" class="font-sans">{{
                      $t('about.what_we_are_not.words.package')
                    }}</LinkBase>
                  </template>
                  <template #managers>
                    <LinkBase :to="pmLinks.vlt" class="font-sans">{{
                      $t('about.what_we_are_not.words.managers')
                    }}</LinkBase>
                  </template>
                </i18n-t>
              </span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-fg-subtle shrink-0 mt-1">&mdash;</span>
              <span>
                <strong class="text-fg">{{ $t('about.what_we_are_not.not_registry') }}</strong>
                {{ $t('about.what_we_are_not.registry_description') }}
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h2 class="text-lg text-fg-subtle uppercase tracking-wider mb-4">
            {{ $t('about.team.title') }}
          </h2>
          <p class="text-fg-muted leading-relaxed mb-6">
            {{ $t('about.contributors.description') }}
          </p>
          <section aria-labelledby="contributors-heading">
            <h3
              id="contributors-heading"
              class="text-sm text-fg-subtle uppercase tracking-wider mb-4"
            >
              {{
                $t(
                  'about.contributors.title',
                  { count: $n(contributors.length) },
                  contributors.length,
                )
              }}
            </h3>

            <div
              v-if="contributorsStatus === 'pending'"
              class="text-fg-subtle text-sm"
              role="status"
            >
              {{ $t('about.contributors.loading') }}
            </div>
            <div
              v-else-if="contributorsStatus === 'error'"
              class="text-fg-subtle text-sm"
              role="alert"
            >
              {{ $t('about.contributors.error') }}
            </div>
            <ul
              v-if="contributors.length"
              class="grid grid-cols-[repeat(auto-fill,48px)] justify-center gap-2 list-none p-0 overflow-visible"
            >
              <li
                v-for="contributor in contributors"
                :key="contributor.id"
                class="relative h-12 w-12 list-none"
              >
                <LinkBase
                  :id="`anchor-${contributor.id}`"
                  :to="contributor.html_url"
                  :aria-label="$t('about.contributors.view_profile', { name: contributor.login })"
                  no-underline
                  no-external-icon
                  class="group relative block h-12 w-12 rounded-lg transition-all outline-none focus-visible:(ring-2 ring-accent z-20)"
                  :class="[
                    !isExpandable(contributor)
                      ? 'hover:scale-125 focus-visible:scale-125'
                      : 'hover:scale-110 focus-visible:scale-110',
                  ]"
                  @mouseenter="onMouseEnter(contributor)"
                  @mouseleave="onMouseLeave"
                >
                  <img
                    :src="`${contributor.avatar_url}&s=64`"
                    :alt="$t('about.contributors.avatar', { name: contributor.login })"
                    width="64"
                    height="64"
                    class="w-12 h-12 rounded-lg ring-2 ring-transparent transition-all duration-200 hover:ring-accent"
                    loading="lazy"
                  />
                </LinkBase>
              </li>
            </ul>
          </section>
        </div>
        <CallToAction />
      </section>
    </article>

    <ClientOnly>
      <div
        id="shared-contributor-popover"
        popover="manual"
        class="fixed top-0 inset-is-0 m-0 border-none bg-transparent p-0 overflow-visible opacity-0 invisible transition-[opacity,visibility] duration-150 ease-out allow-discrete popover-open:(opacity-100 visible) z-40"
        @mouseenter="cancelClose"
        @mouseleave="onMouseLeave"
      >
        <div
          v-if="activeContributor"
          class="relative z-10 w-64 rounded-xl border border-border-subtle bg-bg-elevated p-4 shadow-2xl text-start"
        >
          <div class="flex flex-col gap-1 min-w-0">
            <span class="w-full font-sans font-bold text-fg leading-tight truncate block">
              {{ activeContributor.name || activeContributor.login }}
            </span>
            <div
              v-if="roleLabels[activeContributor.role]"
              class="font-mono text-3xs uppercase tracking-wider text-accent font-bold"
            >
              {{ roleLabels[activeContributor.role] }}
            </div>
            <p
              v-if="activeContributor.bio"
              class="mt-1 font-sans text-xs text-fg-subtle line-clamp-3 leading-relaxed"
            >
              "{{ activeContributor.bio }}"
            </p>

            <div
              v-if="activeContributor.companyHTML"
              class="mt-1 flex items-center gap-1 font-sans text-2xs text-fg-muted text-start min-w-0"
            >
              <div
                class="i-lucide:building-2 size-3 shrink-0 mt-0.5 text-accent/80"
                aria-hidden="true"
              />
              <div
                class="company-content leading-relaxed break-words min-w-0 [&_a]:(text-accent no-underline hover:underline transition-all)"
                v-html="activeContributor.companyHTML"
              />
            </div>

            <div
              v-else-if="activeContributor.company"
              class="mt-1 flex items-center gap-1 font-sans text-2xs text-fg-muted text-start min-w-0"
            >
              <div
                class="i-lucide:building-2 size-3 shrink-0 mt-0.5 text-accent/80"
                aria-hidden="true"
              />
              <div
                class="company-content leading-relaxed break-words min-w-0 [&_a]:(text-accent no-underline hover:underline transition-all)"
              >
                {{ activeContributor.company }}
              </div>
            </div>
          </div>

          <div class="mt-3 flex flex-col gap-1 text-3xs text-fg-subtle font-sans">
            <div v-if="activeContributor.location" class="flex items-center gap-1 min-w-0">
              <div class="i-lucide:map-pin size-3 shrink-0" aria-hidden="true" />
              <span class="w-full truncate">{{ activeContributor.location }}</span>
            </div>

            <a
              v-if="activeContributor.websiteUrl"
              :href="activeContributor.websiteUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1 hover:text-accent transition-colors"
            >
              <div class="i-lucide:link size-3 shrink-0" />
              <span class="truncate">{{
                activeContributor.websiteUrl.replace(/^https?:\/\//, '')
              }}</span>
            </a>
            <a
              v-if="activeContributor.twitterUsername"
              :href="`https://x.com/${activeContributor.twitterUsername}`"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1 hover:text-accent transition-colors"
            >
              <div class="i-simple-icons:x size-2.5 shrink-0" />
              <span>@{{ activeContributor.twitterUsername }}</span>
            </a>
          </div>

          <div
            class="mt-3 flex items-center justify-between border-t border-t-gray-400/65 dark:border-t-gray-300 border-border-subtle pt-3"
          >
            <a
              :href="activeContributor.html_url"
              target="_blank"
              class="text-3xs text-fg-subtle font-mono hover:text-accent"
              rel="noopener noreferrer"
            >
              @{{ activeContributor.login }}
            </a>
            <a
              v-if="activeContributor.sponsors_url"
              :href="activeContributor.sponsors_url"
              :aria-label="$t('about.team.sponsor_aria', { name: activeContributor.login })"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1 rounded border border-purple-700/30 bg-purple-700/5 text-purple-700 dark:border-purple-300/30 dark:bg-purple-300/5 dark:text-purple-300 px-2 py-0.5 text-4xs font-bold uppercase tracking-wider transition-colors hover:bg-purple-700/15 dark:hover:bg-purple-300/15"
            >
              <span class="i-lucide:heart size-3" aria-hidden="true" />
              <span>{{ $t('about.team.sponsor') }}</span>
            </a>
          </div>

          <div
            aria-hidden="true"
            class="popover-arrow absolute inset-is-1/2 z-0 h-3 w-3 border-border-subtle bg-bg-elevated will-change-transform"
            :class="
              isFlipped ? 'top-[-6px] border-te border-is' : 'bottom-[-6px] border-be border-ie'
            "
            :style="{ transform: 'translateX(calc(-50% + var(--arrow-delta, 0px))) rotate(45deg)' }"
          />
        </div>
      </div>
    </ClientOnly>
  </main>
</template>

<style scoped>
[popover]:not(:popover-open) {
  display: none;
}
[popover] {
  @apply top-0 inset-is-0;
  will-change: transform, opacity;
  transition:
    opacity 0.15s ease-out,
    visibility 0.15s ease-out;
}

/* Prevent any parent from clipping the arrow or the card shadow */
#shared-contributor-popover {
  overflow: visible;
}

/* Arrow will-change to keep animations smooth */
.popover-arrow {
  will-change: transform;
}
</style>
