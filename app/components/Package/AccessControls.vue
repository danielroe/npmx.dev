<script setup lang="ts">
import type { NewOperation } from '~/composables/useConnector'
import { buildScopeTeam } from '~/utils/npm/common'

const props = defineProps<{
  packageName: string
}>()

const {
  isConnected,
  lastExecutionTime,
  listOrgTeams,
  listPackageCollaborators,
  addOperation,
  error: connectorError,
} = useConnector()

// Extract org name from scoped package (e.g., "@nuxt/kit" -> "nuxt")
const orgName = computed(() => {
  if (!props.packageName.startsWith('@')) return null
  const match = props.packageName.match(/^@([^/]+)\//)
  return match ? match[1] : null
})

// Data
const collaborators = shallowRef<Record<string, 'read-only' | 'read-write'>>({})
const teams = shallowRef<string[]>([])
const isLoadingCollaborators = shallowRef(false)
const isLoadingTeams = shallowRef(false)
const error = shallowRef<string | null>(null)

// Grant access form
const showGrantAccess = shallowRef(false)
const selectedTeam = shallowRef('')
const permission = shallowRef<'read-only' | 'read-write'>('read-only')
const isGranting = shallowRef(false)

// Revoke confirmation state
const revokeDialogRef = useTemplateRef('revokeDialogRef')
const revokeTarget = shallowRef<{ name: string; displayName: string } | null>(null)
const isRevoking = shallowRef(false)
const revokeError = shallowRef<string | null>(null)

// Computed collaborator list with type detection
const collaboratorList = computed(() => {
  return Object.entries(collaborators.value)
    .map(([name, perm]) => {
      // Check if this looks like a team (org:team format) or user
      const isTeam = name.includes(':')
      return {
        name,
        permission: perm,
        isTeam,
        displayName: isTeam ? name.split(':')[1] : name,
      }
    })
    .sort((a, b) => {
      // Teams first, then users
      if (a.isTeam !== b.isTeam) return a.isTeam ? -1 : 1
      return a.name.localeCompare(b.name)
    })
})

// Load collaborators
async function loadCollaborators() {
  if (!isConnected.value) return

  isLoadingCollaborators.value = true
  error.value = null

  try {
    const result = await listPackageCollaborators(props.packageName)
    if (result) {
      collaborators.value = result
    } else {
      error.value = connectorError.value || 'Failed to load collaborators'
    }
  } finally {
    isLoadingCollaborators.value = false
  }
}

// Load teams for dropdown
async function loadTeams() {
  if (!isConnected.value || !orgName.value) return

  isLoadingTeams.value = true

  try {
    const result = await listOrgTeams(orgName.value)
    if (result) {
      // Teams come as "org:team" format, extract just the team name
      teams.value = result.map((t: string) => t.replace(`${orgName.value}:`, ''))
    }
  } finally {
    isLoadingTeams.value = false
  }
}

// Grant access
async function handleGrantAccess() {
  if (!selectedTeam.value || !orgName.value) return

  isGranting.value = true
  try {
    const scopeTeam = buildScopeTeam(orgName.value, selectedTeam.value)
    const operation: NewOperation = {
      type: 'access:grant',
      params: {
        permission: permission.value,
        scopeTeam,
        pkg: props.packageName,
      },
      description: `Grant ${permission.value} access to ${scopeTeam} for ${props.packageName}`,
      command: `npm access grant ${permission.value} ${scopeTeam} ${props.packageName}`,
    }

    await addOperation(operation)
    selectedTeam.value = ''
    showGrantAccess.value = false
  } finally {
    isGranting.value = false
  }
}

// Open revoke confirmation dialog
function openRevokeDialog(collaboratorName: string, displayName: string) {
  revokeTarget.value = { name: collaboratorName, displayName }
  revokeError.value = null
  revokeDialogRef.value?.showModal()
}

// Close revoke confirmation dialog
function closeRevokeDialog() {
  revokeDialogRef.value?.close()
  revokeTarget.value = null
  revokeError.value = null
}

// Revoke access (after confirmation)
async function handleRevokeAccess() {
  if (!revokeTarget.value) return

  isRevoking.value = true
  revokeError.value = null

  try {
    const operation: NewOperation = {
      type: 'access:revoke',
      params: {
        scopeTeam: revokeTarget.value.name,
        pkg: props.packageName,
      },
      description: `Revoke ${revokeTarget.value.name} access to ${props.packageName}`,
      command: `npm access revoke ${revokeTarget.value.name} ${props.packageName}`,
    }

    const result = await addOperation(operation)
    if (result) {
      closeRevokeDialog()
    } else {
      revokeError.value = connectorError.value || 'Failed to queue revoke operation'
    }
  } catch (err) {
    revokeError.value = err instanceof Error ? err.message : 'Failed to revoke access'
  } finally {
    isRevoking.value = false
  }
}

// Reload when package changes
watch(
  () => [isConnected.value, props.packageName, lastExecutionTime.value],
  ([connected]) => {
    if (connected && orgName.value) {
      loadCollaborators()
      loadTeams()
    }
  },
  { immediate: true },
)
</script>

<template>
  <section v-if="isConnected && orgName">
    <div class="flex items-center justify-between mb-3">
      <h2 id="access-heading" class="text-xs text-fg-subtle uppercase tracking-wider">
        {{ $t('package.access.title') }}
      </h2>
      <button
        type="button"
        class="p-1 text-fg-muted hover:text-fg transition-colors duration-200 rounded focus-visible:outline-accent/70"
        :aria-label="$t('package.access.refresh')"
        :disabled="isLoadingCollaborators"
        @click="loadCollaborators"
      >
        <span
          class="i-lucide:refresh-ccw w-3.5 h-3.5"
          :class="{ 'motion-safe:animate-spin': isLoadingCollaborators }"
          aria-hidden="true"
        />
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoadingCollaborators && collaboratorList.length === 0" class="py-4 text-center">
      <span
        class="i-svg-spinners:ring-resize w-4 h-4 text-fg-muted animate-spin mx-auto"
        aria-hidden="true"
      />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-xs text-red-400 mb-2" role="alert">
      {{ error }}
    </div>

    <!-- Collaborators list -->
    <ul
      v-if="collaboratorList.length > 0"
      class="space-y-1 mb-3"
      :aria-label="$t('package.access.list_label')"
    >
      <li
        v-for="collab in collaboratorList"
        :key="collab.name"
        class="flex items-center justify-between py-1"
      >
        <div class="flex items-center gap-2 min-w-0">
          <span
            v-if="collab.isTeam"
            class="i-lucide:users w-3.5 h-3.5 text-fg-subtle shrink-0"
            aria-hidden="true"
          />
          <span
            v-else
            class="i-lucide:user w-3.5 h-3.5 text-fg-subtle shrink-0"
            aria-hidden="true"
          />
          <span class="font-mono text-sm text-fg-muted truncate">
            {{ collab.isTeam ? collab.displayName : `@${collab.name}` }}
          </span>
          <span
            class="px-1 py-0.5 font-mono text-xs rounded shrink-0"
            :class="
              collab.permission === 'read-write'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-fg-subtle/20 text-fg-muted'
            "
          >
            {{
              collab.permission === 'read-write' ? $t('package.access.rw') : $t('package.access.ro')
            }}
          </span>
        </div>
        <!-- Only show revoke for teams (users are managed via owners) -->
        <button
          v-if="collab.isTeam"
          type="button"
          class="p-1 text-fg-subtle hover:text-red-400 transition-colors duration-200 shrink-0 rounded focus-visible:outline-accent/70"
          :aria-label="$t('package.access.revoke_access', { name: collab.displayName })"
          @click="openRevokeDialog(collab.name, collab.displayName ?? collab.name)"
        >
          <span class="i-lucide:x w-3.5 h-3.5" aria-hidden="true" />
        </button>
        <span v-else class="text-xs text-fg-subtle"> {{ $t('package.access.owner') }} </span>
      </li>
    </ul>

    <p v-else-if="!isLoadingCollaborators && !error" class="text-xs text-fg-subtle mb-3">
      {{ $t('package.access.no_access') }}
    </p>

    <!-- Grant access form -->
    <div v-if="showGrantAccess">
      <form class="space-y-2" @submit.prevent="handleGrantAccess">
        <div class="flex items-center gap-2">
          <SelectField
            :label="$t('package.access.select_team_label')"
            hidden-label
            id="grant-team-select"
            v-model="selectedTeam"
            name="grant-team"
            block
            size="sm"
            :disabled="isLoadingTeams"
            :items="[
              {
                label: isLoadingTeams
                  ? $t('package.access.loading_teams')
                  : $t('package.access.select_team'),
                value: '',
                disabled: true,
              },
              ...teams.map(team => ({ label: `${orgName}:${team}`, value: team })),
            ]"
          />
          <SelectField
            :label="$t('package.access.permission_label')"
            hidden-label
            id="grant-permission-select"
            v-model="permission"
            name="grant-permission"
            block
            size="sm"
            :items="[
              { label: $t('package.access.permission.read_only'), value: 'read-only' },
              { label: $t('package.access.permission.read_write'), value: 'read-write' },
            ]"
          />
          <button
            type="submit"
            :disabled="!selectedTeam || isGranting"
            class="px-3 py-2 font-mono text-xs text-bg bg-fg rounded transition-all duration-200 hover:bg-fg/90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-accent/70"
          >
            {{ isGranting ? '…' : $t('package.access.grant_button') }}
          </button>
          <button
            type="button"
            class="p-1.5 text-fg-subtle hover:text-fg transition-colors duration-200 rounded focus-visible:outline-accent/70"
            :aria-label="$t('package.access.cancel_grant')"
            @click="showGrantAccess = false"
          >
            <span class="i-lucide:x w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
    <button
      v-else
      type="button"
      class="w-full px-3 py-1.5 font-mono text-xs text-fg-muted bg-bg-subtle border border-border rounded transition-colors duration-200 hover:text-fg hover:border-border-hover focus-visible:outline-accent/70"
      @click="showGrantAccess = true"
    >
      {{ $t('package.access.grant_access') }}
    </button>
  </section>

  <!-- Revoke Confirmation Modal -->
  <ClientOnly>
    <Modal
      ref="revokeDialogRef"
      :modal-title="$t('package.access.revoke.title')"
      id="revoke-access-modal"
      class="max-w-sm"
    >
      <div class="space-y-4">
        <!-- Warning message -->
        <div
          class="p-3 text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-md"
        >
          <p class="font-medium mb-1">{{ $t('package.access.revoke.warning') }}</p>
          <p class="text-xs text-yellow-400/80">
            {{
              $t('package.access.revoke.impact', {
                team: revokeTarget?.displayName,
                package: packageName,
              })
            }}
          </p>
        </div>

        <!-- Team being revoked -->
        <div class="flex items-center gap-2 p-3 bg-bg-subtle border border-border rounded-md">
          <span class="i-lucide:users w-4 h-4 text-fg-subtle shrink-0" aria-hidden="true" />
          <span class="font-mono text-sm text-fg">{{ revokeTarget?.name }}</span>
        </div>

        <!-- Error message -->
        <div
          v-if="revokeError"
          class="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md"
          role="alert"
        >
          {{ revokeError }}
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 px-4 py-2 font-mono text-sm text-fg-muted bg-bg-subtle border border-border rounded-md transition-colors duration-200 hover:text-fg hover:border-border-hover focus-visible:outline-accent/70"
            :disabled="isRevoking"
            @click="closeRevokeDialog"
          >
            {{ $t('common.close') }}
          </button>
          <button
            type="button"
            class="flex-1 px-4 py-2 font-mono text-sm text-white bg-red-600 rounded-md transition-colors duration-200 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-accent/70"
            :disabled="isRevoking"
            @click="handleRevokeAccess"
          >
            <span v-if="isRevoking" class="flex items-center justify-center gap-2">
              <span class="i-svg-spinners:ring-resize w-4 h-4 animate-spin" aria-hidden="true" />
              {{ $t('package.access.revoke.revoking') }}
            </span>
            <span v-else>{{ $t('package.access.revoke.confirm') }}</span>
          </button>
        </div>
      </div>
    </Modal>
  </ClientOnly>
</template>
