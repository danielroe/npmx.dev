<script setup lang="ts">
import { useProviderIcon } from '~/composables/useProviderIcon'

definePageMeta({
  name: 'changes',
  path: '/package-changes/:path+',
  alias: ['/package/changes/:path+', '/changes/:path+'],
  scrollMargin: 200,
})

/// routing

const route = useRoute('changes')
const router = useRouter()
// Parse package name, version, and file path from URL
// Patterns:
//   /code/nuxt/v/4.2.0 → packageName: "nuxt", version: "4.2.0", filePath: null (show tree)
//   /code/nuxt/v/4.2.0/src/index.ts → packageName: "nuxt", version: "4.2.0", filePath: "src/index.ts"
//   /code/@nuxt/kit/v/1.0.0 → packageName: "@nuxt/kit", version: "1.0.0", filePath: null
const parsedRoute = computed(() => {
  const segments = route.params.path

  // Find the /v/ separator for version
  const vIndex = segments.indexOf('v')
  if (vIndex === -1 || vIndex >= segments.length - 1) {
    // No version specified - redirect or error
    return {
      packageName: segments.join('/'),
      version: null as string | null,
      filePath: null as string | null,
    }
  }

  const packageName = segments.slice(0, vIndex).join('/')
  const afterVersion = segments.slice(vIndex + 1)
  const version = afterVersion[0] ?? null
  const filePath = afterVersion.length > 1 ? afterVersion.slice(1).join('/') : null

  return { packageName, version, filePath }
})

const packageName = computed(() => parsedRoute.value.packageName)
const version = computed(() => parsedRoute.value.version)
const filePath = computed(() => parsedRoute.value.filePath?.replace(/\/$/, ''))

const { data: pkg } = usePackage(packageName, version)

const versionUrlPattern = computed(() => {
  const base = `/package-changes/${packageName.value}/v/{version}`
  return filePath.value ? `${base}/${filePath.value}` : base
})

const latestVersion = computed(() => {
  if (!pkg.value) return null
  const latestTag = pkg.value['dist-tags']?.latest
  if (!latestTag) return null
  return pkg.value.versions[latestTag] ?? null
})

watch(
  [version, latestVersion, packageName],
  ([v, latest, name]) => {
    if (!v && latest && name) {
      const pathSegments = [...name.split('/'), 'v', latest]
      router.replace({ name: 'changes', params: { path: pathSegments as [string, ...string[]] } })
    }
  },
  { immediate: true },
)

// getting info
const { data: changelog, pending } = usePackageChangelog(packageName, version)

const repoProviderIcon = useProviderIcon(() => changelog.value?.provider)
const tptoc = useTemplateRef('tptoc')

const versionDate = computed(() => {
  if (!version.value) {
    return
  }
  const time = pkg.value?.time[version.value]
  if (time) {
    return new Date(time).toISOString().split('T')[0]
  }
})

const viewOnGit = useViewOnGitProvider(() => changelog.value?.provider)

const packageHeaderHeight = usePackageHeaderHeight()
const stickyStyle = computed(() => {
  return {
    '--combined-header-height': `${50 + (packageHeaderHeight.value || 44)}px`,
  }
})

defineOgImageComponent('Default', {
  title: () => `${pkg.value?.name ?? 'Package'} - Changelogs`,
  description: () => pkg.value?.license ?? '',
  primaryColor: '#60a5fa',
})
</script>
<template>
  <main class="flex-1 flex flex-col" :style="stickyStyle">
    <PackageHeader
      page="changes"
      :versionUrlPattern
      :pkg
      :latestVersion
      :resolved-version="version"
      :display-version="pkg?.requestedVersion"
    />
    <section class="container w-full pt-3" v-if="!pending">
      <div
        class="sticky top-[--combined-header-height] pa-3 z-2 flex justify-between gap-4"
        :class="$style.gitTocHeader"
      >
        <LinkBase
          v-if="changelog?.link"
          :to="changelog?.link"
          :classicon="repoProviderIcon"
          :title="viewOnGit"
        >
          {{ changelog.provider }}
        </LinkBase>
        <div v-if="changelog?.type == 'md'" ref="tptoc" class="w-14 h-8">
          <!- prevents layout shift while loading ->
        </div>
      </div>

      <LazyChangelogReleases
        v-if="changelog?.type == 'release'"
        :info="changelog"
        :requestedDate="versionDate"
        :requested-version="version || latestVersion?.version"
      />
      <LazyChangelogMarkdown
        v-else-if="changelog?.type == 'md'"
        :info="changelog"
        :tpTarget="tptoc"
        :requested-version="version || latestVersion?.version"
      />
      <p class="mt-5" v-else>{{ $t('changelog.no_logs') }}</p>
    </section>
  </main>
</template>

<style module>
.gitTocHeader {
  border-bottom-width: 1px;
  border-color: color-mix(in srgb, var(--border) var(--un-border-opacity), transparent);
  background-color: color-mix(in srgb, var(--bg) var(--un-bg-opacity), transparent);
}
</style>
