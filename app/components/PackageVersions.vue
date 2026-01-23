<script setup lang="ts">
import type { PackumentVersion, PackageVersionInfo } from '#shared/types'

const props = defineProps<{
  packageName: string
  versions: Record<string, PackumentVersion>
  distTags: Record<string, string>
  time: Record<string, string>
}>()

/** A version with its metadata */
interface VersionDisplay {
  version: string
  time?: string
  tag?: string
  hasProvenance: boolean
}

/** A dist-tag row */
interface TagRow {
  id: string
  tag: string
  primaryVersion: VersionDisplay
  /** Versions in this tag's channel (same major + same prerelease type) */
  allVersions: VersionDisplay[]
  loading: boolean
  expanded: boolean
}

/** Unclaimed major version group */
interface MajorGroup {
  major: number
  versions: VersionDisplay[]
  expanded: boolean
}

// Check if a version has provenance/attestations
function hasProvenance(version: PackumentVersion | undefined): boolean {
  if (!version?.dist) return false
  const dist = version.dist as { attestations?: unknown }
  return !!dist.attestations
}

// Parse semver
function parseVersion(version: string): { major: number, minor: number, patch: number, prerelease: string } {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?/)
  if (!match) return { major: 0, minor: 0, patch: 0, prerelease: '' }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? '',
  }
}

// Compare versions (descending - higher version = smaller result for sort)
function compareVersions(a: string, b: string): number {
  const va = parseVersion(a)
  const vb = parseVersion(b)

  if (va.major !== vb.major) return va.major - vb.major
  if (va.minor !== vb.minor) return va.minor - vb.minor
  if (va.patch !== vb.patch) return va.patch - vb.patch

  if (va.prerelease && vb.prerelease) return va.prerelease.localeCompare(vb.prerelease)
  if (va.prerelease) return -1
  if (vb.prerelease) return 1

  return 0
}

// Get prerelease channel or empty string for stable
function getPrereleaseChannel(version: string): string {
  const parsed = parseVersion(version)
  if (!parsed.prerelease) return ''
  const match = parsed.prerelease.match(/^([a-z]+)/i)
  return match ? match[1]!.toLowerCase() : ''
}

// Cached full version list
const allVersionsCache = ref<PackageVersionInfo[] | null>(null)
const loadingVersions = ref(false)
const hasLoadedAll = ref(false)

// Version to tag lookup
const versionToTag = computed(() => {
  const map = new Map<string, string>()
  for (const [tag, version] of Object.entries(props.distTags)) {
    const existing = map.get(version)
    if (!existing || tag === 'latest' || (tag.length < existing.length && existing !== 'latest')) {
      map.set(version, tag)
    }
  }
  return map
})

// Dist-tag rows (stable structure)
const tagRows = ref<TagRow[]>([])

// Unclaimed versions section
const otherVersionsExpanded = ref(false)
const otherMajorGroups = ref<MajorGroup[]>([])

// Initialize tag rows from props
watchEffect(() => {
  const rows: TagRow[] = Object.entries(props.distTags)
    .map(([tag, version]) => {
      const versionData = props.versions[version]
      return {
        id: `tag:${tag}`,
        tag,
        primaryVersion: {
          version,
          time: props.time[version],
          tag,
          hasProvenance: hasProvenance(versionData),
        },
        allVersions: [],
        loading: false,
        expanded: false,
      }
    })
    .sort((a, b) => compareVersions(b.primaryVersion.version, a.primaryVersion.version))

  tagRows.value = rows
})

// npm registry packument type (simplified)
interface NpmPackument {
  versions: Record<string, unknown>
  time: Record<string, string>
}

// Load all versions directly from npm registry
async function loadAllVersions(): Promise<PackageVersionInfo[]> {
  if (allVersionsCache.value) return allVersionsCache.value

  if (loadingVersions.value) {
    await new Promise<void>((resolve) => {
      const unwatch = watch(allVersionsCache, (val) => {
        if (val) {
          unwatch()
          resolve()
        }
      })
    })
    return allVersionsCache.value!
  }

  loadingVersions.value = true
  try {
    // Fetch directly from npm registry
    const encodedName = props.packageName.startsWith('@')
      ? `@${encodeURIComponent(props.packageName.slice(1))}`
      : encodeURIComponent(props.packageName)

    const data = await $fetch<NpmPackument>(`https://registry.npmjs.org/${encodedName}`)

    // Convert to our format
    const versions: PackageVersionInfo[] = Object.keys(data.versions)
      .filter(v => data.time[v])
      .map(version => ({
        version,
        time: data.time[version],
        hasProvenance: false, // We don't have this info from the basic packument
      }))
      .sort((a, b) => compareVersions(b.version, a.version))

    allVersionsCache.value = versions
    return versions
  }
  finally {
    loadingVersions.value = false
  }
}

// Process loaded versions - populate tag rows and find unclaimed versions
function processLoadedVersions(allVersions: PackageVersionInfo[]) {
  const distTags = props.distTags

  // For each tag, find versions in its channel (same major + same prerelease channel)
  const claimedVersions = new Set<string>()

  for (const row of tagRows.value) {
    const tagVersion = distTags[row.tag]
    if (!tagVersion) continue

    const tagParsed = parseVersion(tagVersion)
    const tagChannel = getPrereleaseChannel(tagVersion)

    const channelVersions = allVersions
      .filter((v) => {
        const vParsed = parseVersion(v.version)
        const vChannel = getPrereleaseChannel(v.version)
        return vParsed.major === tagParsed.major && vChannel === tagChannel
      })
      .sort((a, b) => compareVersions(b.version, a.version))
      .map(v => ({
        version: v.version,
        time: v.time,
        tag: versionToTag.value.get(v.version),
        hasProvenance: v.hasProvenance,
      }))

    row.allVersions = channelVersions

    for (const v of channelVersions) {
      claimedVersions.add(v.version)
    }
  }

  // Group unclaimed versions by major
  const byMajor = new Map<number, VersionDisplay[]>()

  for (const v of allVersions) {
    if (claimedVersions.has(v.version)) continue

    const major = parseVersion(v.version).major
    if (!byMajor.has(major)) {
      byMajor.set(major, [])
    }
    byMajor.get(major)!.push({
      version: v.version,
      time: v.time,
      tag: versionToTag.value.get(v.version),
      hasProvenance: v.hasProvenance,
    })
  }

  // Sort within each major
  for (const versions of byMajor.values()) {
    versions.sort((a, b) => compareVersions(b.version, a.version))
  }

  // Build major groups sorted by major descending
  const sortedMajors = Array.from(byMajor.keys()).sort((a, b) => b - a)
  otherMajorGroups.value = sortedMajors.map(major => ({
    major,
    versions: byMajor.get(major)!,
    expanded: false,
  }))

  hasLoadedAll.value = true
}

// Expand a tag row
async function expandTagRow(index: number) {
  const row = tagRows.value[index]
  if (!row) return

  if (row.expanded) {
    row.expanded = false
    return
  }

  if (!hasLoadedAll.value) {
    row.loading = true
    try {
      const allVersions = await loadAllVersions()
      processLoadedVersions(allVersions)
    }
    catch (error) {
      console.error('Failed to load versions:', error)
    }
    finally {
      row.loading = false
    }
  }

  row.expanded = true
}

// Expand "Other versions" section
async function expandOtherVersions() {
  if (otherVersionsExpanded.value) {
    otherVersionsExpanded.value = false
    return
  }

  if (!hasLoadedAll.value) {
    try {
      const allVersions = await loadAllVersions()
      processLoadedVersions(allVersions)
    }
    catch (error) {
      console.error('Failed to load versions:', error)
    }
  }

  otherVersionsExpanded.value = true
}

// Toggle a major group
function toggleMajorGroup(index: number) {
  const group = otherMajorGroups.value[index]
  if (group) {
    group.expanded = !group.expanded
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <section
    v-if="tagRows.length > 0"
    aria-labelledby="versions-heading"
  >
    <h2
      id="versions-heading"
      class="text-xs text-fg-subtle uppercase tracking-wider mb-3"
    >
      Versions
    </h2>

    <div class="space-y-0.5">
      <!-- Dist-tag rows -->
      <div
        v-for="(row, index) in tagRows"
        :key="row.id"
      >
        <div class="flex items-center gap-2">
          <!-- Expand button (only if there are more versions to show) -->
          <button
            v-if="row.allVersions.length > 1 || !hasLoadedAll"
            type="button"
            class="w-4 h-4 flex items-center justify-center text-fg-subtle hover:text-fg transition-colors"
            :aria-expanded="row.expanded"
            :aria-label="row.expanded ? `Collapse ${row.tag}` : `Expand ${row.tag}`"
            @click="expandTagRow(index)"
          >
            <span
              v-if="row.loading"
              class="i-carbon-rotate w-3 h-3 animate-spin"
            />
            <span
              v-else
              class="w-3 h-3 transition-transform duration-200"
              :class="row.expanded ? 'i-carbon-chevron-down' : 'i-carbon-chevron-right'"
            />
          </button>
          <span
            v-else
            class="w-4"
          />

          <!-- Version info -->
          <div class="flex-1 flex items-center justify-between py-1.5 text-sm gap-2 min-w-0">
            <div class="flex items-center gap-2 min-w-0">
              <NuxtLink
                :to="`/package/${packageName}/v/${row.primaryVersion.version}`"
                class="font-mono text-fg-muted hover:text-fg transition-colors duration-200 truncate"
              >
                {{ row.primaryVersion.version }}
              </NuxtLink>
              <span class="px-1.5 py-0.5 text-[10px] font-semibold text-fg-subtle bg-bg-muted border border-border rounded shrink-0">
                {{ row.tag }}
              </span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <time
                v-if="row.primaryVersion.time"
                :datetime="row.primaryVersion.time"
                class="text-xs text-fg-subtle"
              >
                {{ formatDate(row.primaryVersion.time) }}
              </time>
              <ProvenanceBadge
                v-if="row.primaryVersion.hasProvenance"
                :package-name="packageName"
                :version="row.primaryVersion.version"
                compact
              />
            </div>
          </div>
        </div>

        <!-- Expanded versions -->
        <div
          v-if="row.expanded && row.allVersions.length > 1"
          class="ml-4 pl-2 border-l border-border space-y-0.5"
        >
          <div
            v-for="v in row.allVersions.slice(1)"
            :key="v.version"
            class="flex items-center justify-between py-1 text-sm gap-2"
          >
            <div class="flex items-center gap-2 min-w-0">
              <NuxtLink
                :to="`/package/${packageName}/v/${v.version}`"
                class="font-mono text-xs text-fg-subtle hover:text-fg-muted transition-colors duration-200 truncate"
              >
                {{ v.version }}
              </NuxtLink>
              <span
                v-if="v.tag && v.tag !== row.tag"
                class="px-1 py-0.5 text-[9px] font-semibold text-fg-subtle bg-bg-muted border border-border rounded shrink-0"
              >
                {{ v.tag }}
              </span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <time
                v-if="v.time"
                :datetime="v.time"
                class="text-[10px] text-fg-subtle"
              >
                {{ formatDate(v.time) }}
              </time>
              <ProvenanceBadge
                v-if="v.hasProvenance"
                :package-name="packageName"
                :version="v.version"
                compact
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Other versions section -->
      <div class="pt-1">
        <button
          type="button"
          class="flex items-center gap-2 text-left"
          :aria-expanded="otherVersionsExpanded"
          @click="expandOtherVersions"
        >
          <span class="w-4 h-4 flex items-center justify-center text-fg-subtle hover:text-fg transition-colors">
            <span
              v-if="loadingVersions && !hasLoadedAll"
              class="i-carbon-rotate w-3 h-3 animate-spin"
            />
            <span
              v-else
              class="w-3 h-3 transition-transform duration-200"
              :class="otherVersionsExpanded ? 'i-carbon-chevron-down' : 'i-carbon-chevron-right'"
            />
          </span>
          <span class="text-xs text-fg-muted py-1.5">
            Other versions
          </span>
        </button>

        <!-- Expanded other versions -->
        <div
          v-if="otherVersionsExpanded"
          class="ml-4 pl-2 border-l border-border space-y-0.5"
        >
          <template v-if="otherMajorGroups.length > 0">
            <div
              v-for="(group, groupIndex) in otherMajorGroups"
              :key="group.major"
            >
              <!-- Major group header -->
              <button
                v-if="group.versions.length > 1"
                type="button"
                class="flex items-center gap-2 w-full text-left py-1"
                :aria-expanded="group.expanded"
                @click="toggleMajorGroup(groupIndex)"
              >
                <span
                  class="w-3 h-3 transition-transform duration-200 text-fg-subtle"
                  :class="group.expanded ? 'i-carbon-chevron-down' : 'i-carbon-chevron-right'"
                />
                <span class="font-mono text-xs text-fg-muted">
                  {{ group.versions[0]?.version }}
                </span>
                <span
                  v-if="group.versions[0]?.tag"
                  class="px-1 py-0.5 text-[9px] font-semibold text-fg-subtle bg-bg-muted border border-border rounded shrink-0"
                >
                  {{ group.versions[0].tag }}
                </span>
              </button>
              <!-- Single version (no expand needed) -->
              <div
                v-else
                class="flex items-center gap-2 py-1"
              >
                <span class="w-3" />
                <NuxtLink
                  :to="`/package/${packageName}/v/${group.versions[0]?.version}`"
                  class="font-mono text-xs text-fg-muted hover:text-fg transition-colors duration-200"
                >
                  {{ group.versions[0]?.version }}
                </NuxtLink>
                <span
                  v-if="group.versions[0]?.tag"
                  class="px-1 py-0.5 text-[9px] font-semibold text-fg-subtle bg-bg-muted border border-border rounded shrink-0"
                >
                  {{ group.versions[0].tag }}
                </span>
              </div>

              <!-- Major group versions -->
              <div
                v-if="group.expanded && group.versions.length > 1"
                class="ml-5 space-y-0.5"
              >
                <div
                  v-for="v in group.versions.slice(1)"
                  :key="v.version"
                  class="flex items-center justify-between py-1 text-sm gap-2"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <NuxtLink
                      :to="`/package/${packageName}/v/${v.version}`"
                      class="font-mono text-xs text-fg-subtle hover:text-fg-muted transition-colors duration-200 truncate"
                    >
                      {{ v.version }}
                    </NuxtLink>
                    <span
                      v-if="v.tag"
                      class="px-1 py-0.5 text-[9px] font-semibold text-fg-subtle bg-bg-muted border border-border rounded shrink-0"
                    >
                      {{ v.tag }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <time
                      v-if="v.time"
                      :datetime="v.time"
                      class="text-[10px] text-fg-subtle"
                    >
                      {{ formatDate(v.time) }}
                    </time>
                    <ProvenanceBadge
                      v-if="v.hasProvenance"
                      :package-name="packageName"
                      :version="v.version"
                      compact
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
          <div
            v-else-if="hasLoadedAll"
            class="py-1 text-xs text-fg-subtle"
          >
            All versions are covered by tags above
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
