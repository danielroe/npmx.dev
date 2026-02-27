<script setup lang="ts">
import type { NewOperation } from '~/composables/useConnector'
import type { AccessPermission } from '#cli/types'
import { buildScopeTeam } from '~/utils/npm/common'

const props = defineProps<{
  /** List of selected package names */
  selectedPackages: string[]
  /** Organization name */
  orgName: string
}>()

const emit = defineEmits<{
  /** Emitted when operations have been queued */
  operationsQueued: [count: number]
}>()

const { isConnected, listOrgTeams, addOperations, error: connectorError } = useConnector()

// Form state
const selectedTeam = shallowRef<string | null>(null)
const permission = shallowRef<AccessPermission>('read-only')

// Teams loading
const teams = shallowRef<string[]>([])
const isLoadingTeams = shallowRef(false)
const loadError = shallowRef<string | null>(null)

// Submission state
const isSubmitting = shallowRef(false)
const submitSuccess = shallowRef(false)

const dialogRef = useTemplateRef('dialogRef')

// Load teams when modal opens
async function loadTeams() {
  if (!isConnected.value) return

  isLoadingTeams.value = true
  loadError.value = null

  try {
    const result = await listOrgTeams(props.orgName)
    if (result) {
      // Teams come as "org:team" format, extract just the team name
      teams.value = result.map((t: string) => t.replace(`${props.orgName}:`, ''))
    } else {
      loadError.value = connectorError.value || 'Failed to load teams'
    }
  } finally {
    isLoadingTeams.value = false
  }
}

function open() {
  // Reset state
  selectedTeam.value = null
  permission.value = 'read-only'
  submitSuccess.value = false
  loadError.value = null
  loadTeams()
  dialogRef.value?.showModal()
}

function close() {
  dialogRef.value?.close()
}

async function handleSubmit() {
  if (!selectedTeam.value || props.selectedPackages.length === 0) return

  isSubmitting.value = true

  try {
    const scopeTeam = buildScopeTeam(props.orgName, selectedTeam.value)

    const operations: NewOperation[] = props.selectedPackages.map(pkg => ({
      type: 'access:grant',
      params: {
        permission: permission.value,
        scopeTeam,
        pkg,
      },
      description: `Grant ${permission.value} to ${scopeTeam} for ${pkg}`,
      command: `npm access grant ${permission.value} ${scopeTeam} ${pkg}`,
    }))

    const result = await addOperations(operations)
    if (result.length > 0) {
      submitSuccess.value = true
      emit('operationsQueued', result.length)
    } else {
      loadError.value = 'Failed to queue operations'
    }
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Failed to queue operations'
  } finally {
    isSubmitting.value = false
  }
}

defineExpose({ open, close })
</script>

<template>
  <Modal
    ref="dialogRef"
    :modalTitle="$t('package.bulk.grant_access_title')"
    id="bulk-grant-access-modal"
    class="max-w-md"
  >
    <!-- Success state -->
    <div v-if="submitSuccess" class="space-y-4">
      <div
        class="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
      >
        <span class="i-lucide:check text-green-500 w-6 h-6" aria-hidden="true" />
        <div>
          <p class="font-mono text-sm text-fg">{{ $t('package.bulk.operations_queued') }}</p>
          <p class="text-xs text-fg-muted">
            {{
              $t(
                'package.bulk.operations_queued_detail',
                { count: selectedPackages.length },
                selectedPackages.length,
              )
            }}
          </p>
        </div>
      </div>

      <p class="text-sm text-fg-muted">
        {{ $t('package.bulk.review_operations_hint') }}
      </p>

      <button
        type="button"
        class="w-full px-4 py-2 font-mono text-sm text-fg-muted bg-bg-subtle border border-border rounded-md transition-colors duration-200 hover:text-fg hover:border-border-hover focus-visible:outline-accent/70"
        @click="close"
      >
        {{ $t('common.close') }}
      </button>
    </div>

    <!-- Loading state -->
    <div v-else-if="isLoadingTeams" class="py-8 text-center">
      <LoadingSpinner :text="$t('org.teams.loading')" />
    </div>

    <!-- Error state -->
    <div v-else-if="loadError" class="space-y-4">
      <div
        role="alert"
        class="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md"
      >
        {{ loadError }}
      </div>
      <button
        type="button"
        class="w-full px-4 py-2 font-mono text-sm text-fg-muted bg-bg-subtle border border-border rounded-md transition-colors duration-200 hover:text-fg hover:border-border-hover focus-visible:outline-accent/70"
        @click="loadTeams"
      >
        {{ $t('common.retry') }}
      </button>
    </div>

    <!-- Form -->
    <form v-else class="space-y-4" @submit.prevent="handleSubmit">
      <!-- Selected packages summary -->
      <div class="p-3 bg-bg-subtle border border-border rounded-lg">
        <p class="text-sm text-fg-muted mb-2">
          {{
            $t(
              'package.bulk.selected_packages_count',
              { count: selectedPackages.length },
              selectedPackages.length,
            )
          }}
        </p>
        <ul class="max-h-32 overflow-y-auto space-y-1">
          <li
            v-for="pkg in selectedPackages.slice(0, 10)"
            :key="pkg"
            class="font-mono text-xs text-fg truncate"
          >
            {{ pkg }}
          </li>
          <li v-if="selectedPackages.length > 10" class="text-xs text-fg-subtle">
            {{ $t('package.bulk.and_more', { count: selectedPackages.length - 10 }) }}
          </li>
        </ul>
      </div>

      <!-- Team selector -->
      <div>
        <label for="team-select" class="block text-sm font-mono text-fg-muted mb-2">
          {{ $t('package.bulk.select_team') }}
        </label>
        <select
          id="team-select"
          v-model="selectedTeam"
          class="w-full px-3 py-2 font-mono text-sm text-fg bg-bg border border-border rounded-md transition-colors duration-200 hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-accent-fallback/50"
          required
        >
          <option :value="null" disabled>{{ $t('package.bulk.choose_team') }}</option>
          <option v-for="team in teams" :key="team" :value="team">@{{ orgName }}:{{ team }}</option>
        </select>
        <p v-if="teams.length === 0" class="text-xs text-fg-subtle mt-1">
          {{ $t('package.bulk.no_teams_available') }}
        </p>
      </div>

      <!-- Permission selector -->
      <div>
        <label class="block text-sm font-mono text-fg-muted mb-2">
          {{ $t('package.bulk.select_permission') }}
        </label>
        <div class="flex gap-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="permission"
              value="read-only"
              v-model="permission"
              class="peer sr-only"
            />
            <span
              class="w-4 h-4 rounded-full border border-border bg-bg flex items-center justify-center transition-colors duration-200 peer-checked:border-accent-fallback peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-accent-fallback"
            >
              <span
                v-if="permission === 'read-only'"
                class="w-2 h-2 rounded-full bg-accent-fallback"
              />
            </span>
            <span class="font-mono text-sm text-fg">{{ $t('package.bulk.permission_read') }}</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="permission"
              value="read-write"
              v-model="permission"
              class="peer sr-only"
            />
            <span
              class="w-4 h-4 rounded-full border border-border bg-bg flex items-center justify-center transition-colors duration-200 peer-checked:border-accent-fallback peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-accent-fallback"
            >
              <span
                v-if="permission === 'read-write'"
                class="w-2 h-2 rounded-full bg-accent-fallback"
              />
            </span>
            <span class="font-mono text-sm text-fg">{{ $t('package.bulk.permission_write') }}</span>
          </label>
        </div>
      </div>

      <!-- Submit button -->
      <button
        type="submit"
        :disabled="!selectedTeam || isSubmitting || teams.length === 0"
        class="w-full px-4 py-2 font-mono text-sm text-bg bg-accent-fallback rounded-md transition-colors duration-200 hover:bg-accent-fallback/90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-accent/70"
      >
        {{
          isSubmitting
            ? $t('package.bulk.granting')
            : $t('package.bulk.grant_access_button', { count: selectedPackages.length })
        }}
      </button>

      <!-- Cancel button -->
      <button
        type="button"
        class="w-full px-4 py-2 font-mono text-sm text-fg-muted bg-bg-subtle border border-border rounded-md transition-colors duration-200 hover:text-fg hover:border-border-hover focus-visible:outline-accent/70"
        @click="close"
      >
        {{ $t('common.close') }}
      </button>
    </form>
  </Modal>
</template>
