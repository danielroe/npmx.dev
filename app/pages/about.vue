<script setup lang="ts">
import type { Role, GitHubContributor } from '#server/api/contributors.get'
import { SPONSORS } from '~/assets/logos/sponsors'
import { OSS_PARTNERS } from '~/assets/logos/oss-partners'

const router = useRouter()
const canGoBack = useCanGoBack()

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

const isMounted = shallowRef(false)
onMounted(() => {
  isMounted.value = true
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

function isExpandable(c: GitHubContributor) {
  const isGovernance = c.role === 'steward' || c.role === 'maintainer'
  return (
    isGovernance ||
    !!c.bio ||
    !!c.company ||
    !!c.name ||
    !!c.location ||
    !!c.twitterUsername ||
    !!c.websiteUrl ||
    !!c.blueskyHandle ||
    !!c.mastodonUrl
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

function getAriaLabel(c: GitHubContributor): string {
  const separator = $t('about.contributors.separator')
  const role = roleLabels.value[c.role]
    ? $t('about.contributors.role', { separator, role: roleLabels.value[c.role] })
    : ''
  const works_at = c.company
    ? $t('about.contributors.works_at', { separator, company: c.company })
    : ''
  const location = c.location
    ? $t('about.contributors.location', { separator, location: c.location })
    : ''
  return $t('about.contributors.view_profile_detailed', {
    name: c.name || c.login,
    role,
    works_at,
    location,
  })
}

// --- Popover Logic (Single Instance in DOM via v-if) ---
const activeContributor = shallowRef<GitHubContributor | null>(null)
const popoverPos = reactive({ top: 0, left: 0, align: 'center' as 'left' | 'center' | 'right' })
let closeTimer: ReturnType<typeof setTimeout> | null = null

function cancelClose() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function computePos(btn: HTMLElement) {
  const r = btn.getBoundingClientRect()
  const vw = window.innerWidth
  const POP_W = 256
  const GAP = 8

  popoverPos.top = r.bottom + GAP
  const center = r.left + r.width / 2

  if (center - POP_W / 2 < GAP) {
    popoverPos.align = 'left'
    popoverPos.left = r.left
  } else if (center + POP_W / 2 > vw - GAP) {
    popoverPos.align = 'right'
    popoverPos.left = r.right
  } else {
    popoverPos.align = 'center'
    popoverPos.left = center
  }
}

function open(c: GitHubContributor, btnEl: HTMLElement) {
  cancelClose()
  computePos(btnEl)
  activeContributor.value = c
}

function scheduleClose(c: GitHubContributor) {
  cancelClose()
  closeTimer = setTimeout(() => {
    if (activeContributor.value?.id === c.id) activeContributor.value = null
  }, 150)
}

function toggle(c: GitHubContributor, btnEl: HTMLElement) {
  if (activeContributor.value?.id === c.id) {
    activeContributor.value = null
  } else {
    open(c, btnEl)
  }
}

function onDocumentPointerDown(e: PointerEvent) {
  if (!activeContributor.value) return
  const t = e.target
  if (!(t instanceof Element)) return
  if (
    !t.closest('[data-popover-panel]') &&
    !t.closest(`[data-cid="${activeContributor.value.id}"]`)
  ) {
    activeContributor.value = null
  }
}

function onDocumentKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && activeContributor.value) {
    activeContributor.value = null
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
  cancelClose()
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeydown)
})
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
            class="cursor-pointer inline-flex items-center gap-2 p-1.5 -mx-1.5 font-mono text-sm text-fg-muted hover:text-fg transition-colors duration-200 rounded focus-visible:outline-accent/70 shrink-0"
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

      <section class="prose prose-invert max-w-none space-y-12">
        <div>
          <h2 class="text-lg text-fg uppercase tracking-wider mb-4">
            {{ $t('about.what_we_are.title') }}
          </h2>
          <p class="text-fg-muted leading-relaxed mb-4">
            <i18n-t keypath="about.what_we_are.description" tag="span" scope="global">
              <template #betterUxDx>
                <strong class="text-fg">{{ $t('about.what_we_are.better_ux_dx') }}</strong>
              </template>
              <template #jsr>
                <LinkBase to="https://jsr.io/" no-new-tab-icon>JSR</LinkBase>
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
          <h2 class="text-lg text-fg uppercase tracking-wider mb-4">
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
                    <LinkBase :to="pmLinks.npm" class="font-sans" no-new-tab-icon>{{
                      $t('about.what_we_are_not.words.people')
                    }}</LinkBase>
                  </template>
                  <template #building>
                    <LinkBase :to="pmLinks.pnpm" class="font-sans" no-new-tab-icon>{{
                      $t('about.what_we_are_not.words.building')
                    }}</LinkBase>
                  </template>
                  <template #really>
                    <LinkBase :to="pmLinks.yarn" class="font-sans" no-new-tab-icon>{{
                      $t('about.what_we_are_not.words.really')
                    }}</LinkBase>
                  </template>
                  <template #cool>
                    <LinkBase :to="pmLinks.bun" class="font-sans" no-new-tab-icon>{{
                      $t('about.what_we_are_not.words.cool')
                    }}</LinkBase>
                  </template>
                  <template #package>
                    <LinkBase :to="pmLinks.deno" class="font-sans" no-new-tab-icon>{{
                      $t('about.what_we_are_not.words.package')
                    }}</LinkBase>
                  </template>
                  <template #managers>
                    <LinkBase :to="pmLinks.vlt" class="font-sans" no-new-tab-icon>{{
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

        <div class="sponsors-logos">
          <h2 class="text-lg text-fg uppercase tracking-wider mb-4">
            {{ $t('about.sponsors.title') }}
          </h2>
          <AboutLogoList
            :list="SPONSORS"
            class="flex-col gap-6 items-start md:flex-row md:items-center md:gap-4"
          />
        </div>

        <div>
          <h2 class="text-lg text-fg uppercase tracking-wider mb-4">
            {{ $t('about.oss_partners.title') }}
          </h2>
          <AboutLogoList :list="OSS_PARTNERS" class="items-center" />
        </div>

        <div>
          <h2 class="text-lg uppercase tracking-wider mb-4">
            {{ $t('about.team.title') }}
          </h2>
          <p class="text-fg-muted leading-relaxed mb-6">
            {{ $t('about.contributors.description') }}
          </p>
          <section aria-labelledby="contributors-heading">
            <h3 id="contributors-heading" class="text-sm text-fg uppercase tracking-wider mb-4">
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
              v-else-if="contributors.length"
              class="grid grid-cols-[repeat(auto-fill,48px)] justify-center gap-2 list-none p-0 overflow-visible"
            >
              <li
                v-for="contributor in contributors"
                :key="contributor.id"
                class="relative h-12 w-12 list-none"
              >
                <LinkBase
                  v-if="!isExpandable(contributor)"
                  :to="contributor.html_url"
                  :aria-label="getAriaLabel(contributor)"
                  no-underline
                  no-new-tab-icon
                  class="group relative block h-12 w-12 rounded-lg transition-all outline-none p-0 bg-transparent"
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
                <button
                  v-else
                  type="button"
                  :data-cid="contributor.id"
                  :aria-expanded="
                    isMounted && activeContributor?.id === contributor.id ? 'true' : undefined
                  "
                  :aria-label="
                    isExpandable(contributor)
                      ? getAriaLabel(contributor)
                      : $t('about.contributors.view_profile', { name: contributor.login })
                  "
                  class="group relative block h-12 w-12 rounded-lg transition-all outline-none focus-visible:(ring-2 ring-accent z-20) p-0 border-none cursor-pointer bg-transparent"
                  :class="[
                    !isExpandable(contributor)
                      ? 'hover:scale-125 focus-visible:scale-125'
                      : 'hover:scale-110 focus-visible:scale-110',
                  ]"
                  @mouseenter="open(contributor, $event.currentTarget as HTMLElement)"
                  @mouseleave="scheduleClose(contributor)"
                  @click="toggle(contributor, $event.currentTarget as HTMLElement)"
                >
                  <img
                    :src="`${contributor.avatar_url}&s=64`"
                    :alt="$t('about.contributors.avatar', { name: contributor.login })"
                    width="64"
                    height="64"
                    class="w-12 h-12 rounded-lg ring-2 ring-transparent transition-all duration-200 hover:ring-accent"
                    loading="lazy"
                  />
                </button>

                <Transition name="pop">
                  <article
                    v-if="isExpandable(contributor) && activeContributor?.id === contributor.id"
                    data-popover-panel
                    class="contributor-popover"
                    :style="{
                      top: `${popoverPos.top}px`,
                      left: `${popoverPos.left}px`,
                    }"
                    :class="`align-${popoverPos.align}`"
                    @mouseenter="cancelClose()"
                    @mouseleave="scheduleClose(contributor)"
                  >
                    <div
                      class="flex flex-col gap-y-3 w-64 rounded-xl border border-border-subtle bg-bg-elevated p-4 shadow-2xl text-start"
                    >
                      <div class="flex flex-col gap-2 min-w-0">
                        <hgroup
                          class="w-full font-sans font-bold text-fg leading-tight truncate block"
                        >
                          <h3>{{ contributor.name || contributor.login }}</h3>
                        </hgroup>
                        <div
                          v-if="roleLabels[contributor.role]"
                          class="font-mono text-3xs uppercase tracking-wider text-accent font-bold"
                        >
                          {{ roleLabels[contributor.role] }}
                        </div>
                        <p
                          v-if="contributor.bio"
                          class="font-sans text-xs text-fg-subtle line-clamp-3 leading-relaxed"
                        >
                          "{{ contributor.bio }}"
                        </p>

                        <div
                          v-if="contributor.companyHTML"
                          class="flex items-center gap-1 font-sans text-2xs text-fg-muted text-start min-w-0"
                        >
                          <div
                            class="i-lucide:building-2 size-3 shrink-0 text-accent/80"
                            aria-hidden="true"
                          />
                          <div
                            class="company-content leading-relaxed break-words min-w-0 [&_a]:(text-accent no-underline hover:underline transition-all)"
                            v-html="contributor.companyHTML"
                          />
                        </div>
                        <div
                          v-else-if="contributor.company"
                          class="flex items-center font-sans text-2xs text-fg-muted text-start min-w-0"
                        >
                          <div
                            class="i-lucide:building-2 size-3 shrink-0 mt-0.5 text-accent/80"
                            aria-hidden="true"
                          />
                          <div class="company-content leading-relaxed break-words min-w-0">
                            {{ contributor.company }}
                          </div>
                        </div>
                      </div>

                      <div class="flex flex-col gap-2 text-3xs text-fg-subtle font-sans">
                        <div v-if="contributor.location" class="flex items-center gap-1 min-w-0">
                          <div class="i-lucide:map-pin size-3 shrink-0" aria-hidden="true" />
                          <span class="w-full truncate">{{ contributor.location }}</span>
                        </div>
                        <a
                          v-if="contributor.websiteUrl"
                          :href="contributor.websiteUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="flex items-center gap-1 hover:text-accent transition-colors"
                        >
                          <div class="i-lucide:link size-3 shrink-0" aria-hidden="true" />
                          <span class="truncate">{{
                            contributor.websiteUrl.replace(/^https?:\/\//, '')
                          }}</span>
                        </a>
                        <a
                          v-if="contributor.twitterUsername"
                          :href="`https://x.com/${contributor.twitterUsername}`"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="flex items-center gap-1 hover:text-accent transition-colors"
                        >
                          <div class="i-simple-icons:x size-2.5 shrink-0" aria-hidden="true" />
                          <span>@{{ contributor.twitterUsername }}</span>
                        </a>
                        <a
                          v-if="contributor.blueskyHandle"
                          :href="`https://bsky.app/profile/${contributor.blueskyHandle}`"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="flex items-center gap-1 hover:text-accent transition-colors"
                        >
                          <div
                            class="i-simple-icons:bluesky size-2.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>@{{ contributor.blueskyHandle }}</span>
                        </a>
                        <a
                          v-if="contributor.mastodonUrl"
                          :href="contributor.mastodonUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="flex items-center gap-1 hover:text-accent transition-colors"
                        >
                          <div
                            class="i-simple-icons:mastodon size-2.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span class="truncate">{{
                            contributor.mastodonUrl.replace(/^https?:\/\//, '').replace(/\/@?/, '@')
                          }}</span>
                        </a>
                      </div>

                      <div
                        class="flex items-center justify-between border-t border-t-gray-400/65 dark:border-t-gray-300 border-border-subtle pt-3"
                      >
                        <a
                          :href="contributor.html_url"
                          target="_blank"
                          class="text-3xs text-fg-subtle font-mono hover:text-accent"
                          rel="noopener noreferrer"
                        >
                          @{{ contributor.login }}
                        </a>
                        <a
                          v-if="contributor.sponsors_url"
                          :href="contributor.sponsors_url"
                          :aria-label="$t('about.team.sponsor_aria', { name: contributor.login })"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="flex items-center gap-1 rounded border border-purple-700/30 bg-purple-700/5 text-purple-700 dark:border-purple-300/30 dark:bg-purple-300/5 dark:text-purple-300 px-2 py-0.5 text-4xs font-bold uppercase tracking-wider transition-colors hover:bg-purple-700/15 dark:hover:bg-purple-300/15"
                        >
                          <span class="i-lucide:heart size-3" aria-hidden="true" />
                          <span>{{ $t('about.team.sponsor') }}</span>
                        </a>
                      </div>
                    </div>
                  </article>
                </Transition>
              </li>
            </ul>
          </section>
        </div>
        <CallToAction />
      </section>
    </article>
  </main>
</template>

<style scoped>
.contributor-popover {
  position: fixed;
  z-index: 9999;
  margin: 0;
  padding: 0;
  /* Default: centered on anchor */
  transform: translateX(-50%);
}

.contributor-popover.align-left {
  transform: translateX(0);
}
.contributor-popover.align-right {
  transform: translateX(-100%);
}

.pop-enter-active {
  transition:
    opacity 120ms ease-out,
    transform 150ms ease-out;
}
.pop-leave-active {
  transition: opacity 80ms ease-in;
}
.pop-enter-from {
  opacity: 0;
  /* Adjust transform based on alignment logic is tricky in pure CSS transition classes
     because we are already using transform for alignment.
     However, since we are using v-if, the element is inserted with the correct class.
     We can just add a slight Y offset to the existing transform.
     But since we can't easily compose transforms in CSS classes without knowing the base,
     we'll stick to opacity fade for simplicity and robustness, or use a wrapper for animation.
     Let's try a simple opacity fade first to ensure layout stability.
  */
}
.pop-leave-to {
  opacity: 0;
}
</style>
