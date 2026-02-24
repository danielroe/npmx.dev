<script setup lang="ts">
import type { Role } from '#server/api/contributors.get'
import LogoVercel from '~/assets/logos/sponsors/vercel.svg'
import LogoVoidZero from '~/assets/logos/sponsors/void-zero.svg'
import LogoNuxt from '~/assets/logos/oss-partners/nuxt.svg'
import LogoOpenSourcePledge from '~/assets/logos/oss-partners/open-source-pledge.svg'
import LogoOxC from '~/assets/logos/oss-partners/oxc.svg'
import LogoRolldown from '~/assets/logos/oss-partners/rolldown.svg'
import LogoStorybook from '~/assets/logos/oss-partners/storybook.svg'
import LogoVite from '~/assets/logos/oss-partners/vite.svg'
import LogoVitest from '~/assets/logos/oss-partners/vitest.svg'
import LogoVue from '~/assets/logos/oss-partners/vue.svg'

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

const pmLinks = {
  npm: 'https://www.npmjs.com/',
  pnpm: 'https://pnpm.io/',
  yarn: 'https://yarnpkg.com/',
  bun: 'https://bun.sh/',
  deno: 'https://deno.com/',
  vlt: 'https://www.vlt.sh/',
}

const { data: contributors, status: contributorsStatus } = useLazyFetch('/api/contributors')

const governanceMembers = computed(
  () => contributors.value?.filter(c => c.role !== 'contributor') ?? [],
)

const communityContributors = computed(
  () => contributors.value?.filter(c => c.role === 'contributor') ?? [],
)

const SPONSOR = [
  {
    name: 'Vercel',
    logo: LogoVercel,
    url: 'https://vercel.com/',
    colorScheme: 'dark',
  },
  {
    name: 'Void Zero',
    logo: LogoVoidZero,
    url: 'https://voidzero.dev/',
    colorScheme: 'dark',
  },
]

const OSS_PARTNERS = [
  {
    name: 'Open Source Pledge',
    logo: LogoOpenSourcePledge,
    url: 'https://opensourcepledge.com/',
    colorScheme: 'dark',
  },
  {
    name: 'Void Zero',
    items: [
      {
        name: 'Vite',
        logo: LogoVite,
        url: 'https://vite.dev/',
        colorScheme: 'light-dark',
      },
      {
        name: 'OxC',
        logo: LogoOxC,
        url: 'https://oxc.rs/',
        colorScheme: 'light-dark',
      },
      {
        name: 'Vitest',
        logo: LogoVitest,
        url: 'https://vitest.dev/',
        colorScheme: 'light-dark',
      },
      {
        name: 'Rolldown',
        logo: LogoRolldown,
        url: 'https://rolldown.rs/',
        colorScheme: 'light-dark',
      },
    ],
  },
  {
    name: 'Nuxt',
    logo: LogoNuxt,
    url: 'https://nuxt.com/',
    colorScheme: 'light-dark',
  },
  {
    name: 'Storybook',
    logo: LogoStorybook,
    url: 'https://storybook.js.org/',
    colorScheme: 'light-dark',
  },
  {
    name: 'Vue',
    logo: LogoVue,
    url: 'https://vuejs.org/',
    colorScheme: 'light-dark',
  },
]

const roleLabels = computed(
  () =>
    ({
      steward: $t('about.team.role_steward'),
      maintainer: $t('about.team.role_maintainer'),
    }) as Partial<Record<Role, string>>,
)
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
            type="button"
            class="cursor-pointer inline-flex items-center gap-2 p-1.5 -mx-1.5 font-mono text-sm text-fg-muted hover:text-fg transition-colors duration-200 rounded focus-visible:outline-accent/70 shrink-0"
            @click="router.back()"
            v-if="canGoBack"
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

        <div>
          <h2 class="text-lg text-fg uppercase tracking-wider mb-4">
            {{ $t('about.sponsors.title') }}
          </h2>
          <ul class="flex flex-wrap gap-2 md:gap-x-6 md:gap-y-4 list-none">
            <li v-for="sponsor in SPONSOR" :key="sponsor.name">
              <a
                :href="sponsor.url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center justify-center h-full min-w-13 rounded-md hover:opacity-80 transition-opacity p-2"
                :class="
                  sponsor.colorScheme === 'dark'
                    ? 'light:bg-fg-muted'
                    : sponsor.colorScheme === 'light'
                      ? 'dark:bg-fg-muted'
                      : undefined
                "
              >
                <img
                  :src="sponsor.logo"
                  loading="lazy"
                  height="24"
                  :alt="sponsor.name"
                  class="h-6 md:h-9 w-auto block"
                />
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 class="text-lg text-fg uppercase tracking-wider mb-4">
            {{ $t('about.oss_partners.title') }}
          </h2>
          <ul class="flex flex-wrap gap-5 md:gap-7 list-none">
            <li v-for="partner in OSS_PARTNERS" :key="partner.name">
              <a
                v-if="partner.logo"
                :href="partner.url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center justify-center h-full min-w-10 rounded-md hover:opacity-80 transition-opacity p-0.5"
                :class="
                  partner.colorScheme === 'dark'
                    ? 'light:bg-fg-muted'
                    : partner.colorScheme === 'light'
                      ? 'dark:bg-fg-muted'
                      : undefined
                "
              >
                <img
                  :src="partner.logo"
                  loading="lazy"
                  height="36"
                  :alt="partner.name"
                  class="w-auto block"
                />
              </a>
              <div v-else-if="partner.items" class="relative flex items-center justify-center">
                <svg
                  width="11"
                  height="38"
                  viewBox="0 0 11 38"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M5.62151 0C-1.8519 10.6931 -1.89574 27.2683 5.62151 37.9997H10.6709C3.15538 27.2683 3.19922 10.6931 10.6709 0H5.62151Z"
                    fill="currentColor"
                  />
                </svg>
                <ul class="flex items-center justify-center h-full gap-0.5 list-none">
                  <li v-for="item in partner.items" :key="item.name">
                    <a
                      :href="item.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex items-center justify-center h-full min-w-10 rounded-md hover:opacity-80 transition-opacity p-0.5"
                      :class="
                        item.colorScheme === 'dark'
                          ? 'light:bg-fg-muted'
                          : item.colorScheme === 'light'
                            ? 'dark:bg-fg-muted'
                            : undefined
                      "
                    >
                      <img
                        :src="item.logo"
                        loading="lazy"
                        height="36"
                        :alt="item.name"
                        class="w-auto block"
                      />
                    </a>
                  </li>
                </ul>
                <svg
                  width="11"
                  height="38"
                  viewBox="0 0 11 38"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M5.04935 0H0C7.4734 10.6931 7.51725 27.2683 0 37.9997H5.04935C12.5648 27.2683 12.521 10.6931 5.04935 0Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </li>
          </ul>
        </div>

        <div>
          <h2 class="text-lg uppercase tracking-wider mb-4">
            {{ $t('about.team.title') }}
          </h2>
          <p class="text-fg-muted leading-relaxed mb-6">
            {{ $t('about.contributors.description') }}
          </p>

          <!-- Governance: stewards + maintainers -->
          <section
            v-if="governanceMembers.length"
            class="mb-12"
            aria-labelledby="governance-heading"
          >
            <h3 id="governance-heading" class="text-sm text-fg uppercase tracking-wider mb-4">
              {{ $t('about.team.governance') }}
            </h3>

            <ul class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 list-none p-0">
              <li
                v-for="person in governanceMembers"
                :key="person.id"
                class="relative flex items-center gap-3 p-3 border border-border rounded-lg hover:border-border-hover hover:bg-bg-muted transition-[border-color,background-color] duration-200 cursor-pointer focus-within:ring-2 focus-within:ring-offset-bg focus-within:ring-offset-2 focus-within:ring-fg/50"
              >
                <img
                  :src="`${person.avatar_url}&s=80`"
                  :alt="`${person.login}'s avatar`"
                  class="w-12 h-12 rounded-md ring-1 ring-border shrink-0"
                  loading="lazy"
                />
                <div class="min-w-0 flex-1">
                  <div class="font-mono text-sm text-fg truncate">
                    <NuxtLink
                      :to="person.html_url"
                      target="_blank"
                      class="decoration-none after:content-[''] after:absolute after:inset-0"
                      :aria-label="$t('about.contributors.view_profile', { name: person.login })"
                    >
                      @{{ person.login }}
                    </NuxtLink>
                  </div>
                  <div class="text-xs text-fg-muted tracking-tight">
                    {{ roleLabels[person.role] ?? person.role }}
                  </div>
                  <LinkBase
                    v-if="person.sponsors_url"
                    :to="person.sponsors_url"
                    no-underline
                    no-external-icon
                    classicon="i-lucide:heart"
                    class="relative z-10 text-xs text-fg-muted hover:text-pink-400 mt-0.5"
                    :aria-label="$t('about.team.sponsor_aria', { name: person.login })"
                  >
                    {{ $t('about.team.sponsor') }}
                  </LinkBase>
                </div>
                <span
                  class="i-lucide:external-link rtl-flip w-3.5 h-3.5 text-fg-muted opacity-50 shrink-0 self-start mt-0.5 pointer-events-none"
                  aria-hidden="true"
                />
              </li>
            </ul>
          </section>

          <!-- Contributors cloud -->
          <section aria-labelledby="contributors-heading">
            <h3 id="contributors-heading" class="text-sm uppercase tracking-wider mb-4">
              {{
                $t(
                  'about.contributors.title',
                  { count: $n(communityContributors.length) },
                  communityContributors.length,
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
              v-else-if="communityContributors.length"
              class="grid grid-cols-[repeat(auto-fill,48px)] justify-center gap-2 list-none p-0"
            >
              <li
                v-for="contributor in communityContributors"
                :key="contributor.id"
                class="block group relative"
              >
                <a
                  :href="contributor.html_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="$t('about.contributors.view_profile', { name: contributor.login })"
                  class="block rounded-lg"
                >
                  <img
                    :src="`${contributor.avatar_url}&s=64`"
                    :alt="`${contributor.login}'s avatar`"
                    width="48"
                    height="48"
                    class="w-12 h-12 rounded-lg ring-2 ring-transparent group-hover:ring-accent transition-all duration-200 ease-out group-hover:scale-125 will-change-transform"
                    loading="lazy"
                  />
                  <span
                    class="pointer-events-none absolute -top-9 inset-is-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs px-2 py-1 shadow-lg opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100"
                    dir="ltr"
                    role="tooltip"
                  >
                    @{{ contributor.login }}
                  </span>
                </a>
              </li>
            </ul>
          </section>
        </div>

        <CallToAction />
      </section>
    </article>
  </main>
</template>
