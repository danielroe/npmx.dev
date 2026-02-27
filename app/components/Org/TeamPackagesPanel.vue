<script setup lang="ts">
import type { AccessPermission } from '#cli/types'
import { buildScopeTeam } from '~/utils/npm/common'

const props = defineProps<{
  orgName: string
}>()

const {
  isConnected,
  lastExecutionTime,
  listOrgTeams,
  listTeamPackages,
  error: connectorError,
} = useConnector()

// Teams data
const teams = shallowRef<string[]>([])
const isLoadingTeams = shallowRef(false)
const teamsError = shallowRef<string | null>(null)

// Selected team
const selectedTeam = shallowRef<string | null>(null)

// Packages data
const packages = shallowRef<Record<string, AccessPermission>>({})
const isLoadingPackages = shallowRef(false)
const packagesError = shallowRef<string | null>(null)

// Search/filter
const searchQuery = shallowRef('')

// Filtered packages
const filteredPackages = computed(() => {
  const entries = Object.entries(packages.value)

  if (!searchQuery.value.trim()) {
    return entries
  }

  const query = searchQuery.value.toLowerCase()
  return entries.filter(([name]) => name.toLowerCase().includes(query))
})

// Load teams
async function loadTeams() {
  if (!isConnected.value) return

  isLoadingTeams.value = true
  teamsError.value = null

  try {
    const result = await listOrgTeams(props.orgName)
    if (result) {
      // Teams come as "org:team" format, extract just the team name
      teams.value = result.map((t: string) => t.replace(`${props.orgName}:`, ''))
    } else {
      teamsError.value = connectorError.value || 'Failed to load teams'
    }
  } finally {
    isLoadingTeams.value = false
  }
}

// Load packages for selected team
async function loadPackages() {
  if (!isConnected.value || !selectedTeam.value) return

  isLoadingPackages.value = true
  packagesError.value = null

  try {
    const scopeTeam = buildScopeTeam(props.orgName, selectedTeam.value)
    const result = await listTeamPackages(scopeTeam)
    if (result) {
      packages.value = result
    } else {
      packagesError.value = connectorError.value || 'Failed to load packages'
    }
  } finally {
    isLoadingPackages.value = false
  }
}

// Watch for team selection changes
watch(selectedTeam, () => {
  packages.value = {}
  if (selectedTeam.value) {
    loadPackages()
  }
})

// Load on mount when connected
watch(
  isConnected,
  connected => {
    if (connected) {
      loadTeams()
    }
  },
  { immediate: true },
)

// Refresh data when operations complete
watch(lastExecutionTime, () => {
  if (isConnected.value) {
    loadTeams()
    if (selectedTeam.value) {
      loadPackages()
    }
  }
})

// Get permission badge class
function getPermissionClass(permission: AccessPermission) {
  return permission === 'read-write'
    ? 'bg-green-500/10 text-green-400 border-green-500/20'
    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
}
</script>

<template>
  <section v-if="isConnected" class="bg-bg-subtle border border-border rounded-lg overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-start p-4 border-b border-border">
      <h2 id="team-packages-heading" class="font-mono text-sm font-medium flex items-center gap-2">
        <span class="i-lucide:package w-4 h-4 text-fg-muted" aria-hidden="true" />
        {{ $t('org.team_access.title') }}
      </h2>
      <span aria-hidden="true" class="flex-shrink-1 flex-grow-1" />
      <button
        type="button"
        class="p-1.5 text-fg-muted hover:text-fg transition-colors duration-200 rounded focus-visible:outline-accent/70"
        :aria-label="$t('org.team_access.refresh')"
        :disabled="isLoadingTeams || isLoadingPackages"
        @click="selectedTeam ? loadPackages() : loadTeams()"
      >
        <span
          class="i-lucide:refresh-ccw w-4 h-4"
          :class="{ 'animate-spin': isLoadingTeams || isLoadingPackages }"
          aria-hidden="true"
        />
      </button>
    </div>

    <!-- Team selector -->
    <div class="p-3 border-b border-border bg-bg">
      <label for="team-packages-select" class="sr-only">{{
        $t('org.team_access.select_team')
      }}</label>
      <select
        id="team-packages-select"
        v-model="selectedTeam"
        :disabled="isLoadingTeams || teams.length === 0"
        class="w-full px-3 py-2 font-mono text-sm text-fg bg-bg border border-border rounded-md transition-colors duration-200 hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-accent-fallback/50 disabled:opacity-50"
      >
        <option :value="null">{{ $t('org.team_access.select_team') }}</option>
        <option v-for="team in teams" :key="team" :value="team">@{{ orgName }}:{{ team }}</option>
      </select>
    </div>

    <!-- Loading teams state -->
    <div v-if="isLoadingTeams && teams.length === 0" class="p-8 text-center">
      <span class="i-svg-spinners:ring-resize w-5 h-5 text-fg-muted mx-auto" aria-hidden="true" />
      <p class="font-mono text-sm text-fg-muted mt-2">{{ $t('org.teams.loading') }}</p>
    </div>

    <!-- Teams error state -->
    <div v-else-if="teamsError" class="p-4 text-center" role="alert">
      <p class="font-mono text-sm text-red-400">
        {{ teamsError }}
      </p>
      <button
        type="button"
        class="mt-2 font-mono text-xs text-fg-muted hover:text-fg transition-colors duration-200 rounded focus-visible:outline-accent/70"
        @click="loadTeams"
      >
        {{ $t('common.try_again') }}
      </button>
    </div>

    <!-- No teams state -->
    <div v-else-if="teams.length === 0 && !isLoadingTeams" class="p-8 text-center">
      <p class="font-mono text-sm text-fg-muted">{{ $t('org.teams.no_teams') }}</p>
    </div>

    <!-- No team selected -->
    <div v-else-if="!selectedTeam" class="p-8 text-center">
      <p class="font-mono text-sm text-fg-muted">{{ $t('org.team_access.select_team_hint') }}</p>
    </div>

    <!-- Team selected - show packages -->
    <template v-else>
      <!-- Search filter -->
      <div class="p-3 border-b border-border bg-bg">
        <div class="relative">
          <span
            class="absolute inset-is-2 top-1/2 -translate-y-1/2 i-lucide:search w-3.5 h-3.5 text-fg-subtle"
            aria-hidden="true"
          />
          <label for="team-packages-search" class="sr-only">{{
            $t('org.team_access.filter_packages')
          }}</label>
          <InputBase
            id="team-packages-search"
            v-model="searchQuery"
            type="search"
            name="team-packages-search"
            :placeholder="$t('org.team_access.filter_packages_placeholder')"
            no-correct
            class="w-full min-w-25 ps-7"
            size="medium"
          />
        </div>
      </div>

      <!-- Loading packages state -->
      <div v-if="isLoadingPackages" class="p-8 text-center">
        <span class="i-svg-spinners:ring-resize w-5 h-5 text-fg-muted mx-auto" aria-hidden="true" />
        <p class="font-mono text-sm text-fg-muted mt-2">
          {{ $t('org.team_access.loading_packages') }}
        </p>
      </div>

      <!-- Packages error state -->
      <div v-else-if="packagesError" class="p-4 text-center" role="alert">
        <p class="font-mono text-sm text-red-400">
          {{ packagesError }}
        </p>
        <button
          type="button"
          class="mt-2 font-mono text-xs text-fg-muted hover:text-fg transition-colors duration-200 rounded focus-visible:outline-accent/70"
          @click="loadPackages"
        >
          {{ $t('common.try_again') }}
        </button>
      </div>

      <!-- No packages state -->
      <div v-else-if="Object.keys(packages).length === 0" class="p-8 text-center">
        <p class="font-mono text-sm text-fg-muted">{{ $t('org.team_access.no_packages') }}</p>
      </div>

      <!-- Packages list -->
      <ul
        v-else
        class="divide-y divide-border max-h-80 overflow-y-auto"
        :aria-label="$t('org.team_access.packages_list')"
      >
        <li
          v-for="[pkgName, permission] in filteredPackages"
          :key="pkgName"
          class="flex items-center justify-start p-3 hover:bg-bg transition-colors duration-200"
        >
          <NuxtLink
            :to="packageRoute(pkgName)"
            class="font-mono text-sm text-fg hover:text-accent-fallback transition-colors duration-200 truncate flex-1"
            dir="ltr"
          >
            {{ pkgName }}
          </NuxtLink>
          <span
            class="ms-2 px-2 py-0.5 text-xs font-mono rounded border shrink-0"
            :class="getPermissionClass(permission)"
          >
            {{ permission }}
          </span>
        </li>
      </ul>

      <!-- No results -->
      <div
        v-if="Object.keys(packages).length > 0 && filteredPackages.length === 0"
        class="p-4 text-center"
      >
        <p class="font-mono text-sm text-fg-muted">
          {{ $t('org.team_access.no_match', { query: searchQuery }) }}
        </p>
      </div>

      <!-- Package count footer -->
      <div v-if="Object.keys(packages).length > 0" class="p-3 border-t border-border bg-bg-subtle">
        <p class="text-xs text-fg-muted font-mono">
          {{
            $t(
              'org.team_access.package_count',
              { count: Object.keys(packages).length },
              Object.keys(packages).length,
            )
          }}
        </p>
      </div>
    </template>
  </section>
</template>
