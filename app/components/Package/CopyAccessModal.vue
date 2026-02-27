<script setup lang="ts">
import type { NewOperation } from '~/composables/useConnector'
import type { AccessPermission } from '#cli/types'

const props = defineProps<{
  /** List of target package names to copy access to */
  targetPackages: string[]
  /** Organization name (packages must be in this org) */
  orgName: string
  /** Available packages to choose from as source */
  availablePackages: string[]
}>()

const emit = defineEmits<{
  /** Emitted when operations have been queued */
  operationsQueued: [count: number]
}>()

const {
  isConnected,
  listPackageCollaborators,
  addOperations,
  error: connectorError,
} = useConnector()

// Form state
const sourcePackage = shallowRef<string | null>(null)
const searchQuery = shallowRef('')

// Collaborators loading
const collaborators = shallowRef<Record<string, AccessPermission>>({})
const isLoadingCollaborators = shallowRef(false)
const loadError = shallowRef<string | null>(null)

// Submission state
const isSubmitting = shallowRef(false)
const submitSuccess = shallowRef(false)

const dialogRef = useTemplateRef('dialogRef')

// Filter available packages by search
const filteredPackages = computed(() => {
  // Exclude target packages from source selection
  const available = props.availablePackages.filter(pkg => !props.targetPackages.includes(pkg))

  if (!searchQuery.value.trim()) {
    return available.slice(0, 20) // Limit initial display
  }

  const query = searchQuery.value.toLowerCase()
  return available.filter(pkg => pkg.toLowerCase().includes(query)).slice(0, 20)
})

// Filter to teams only (collaborators with ":" in their name)
const teamCollaborators = computed(() => {
  return Object.entries(collaborators.value).filter(([name]) => name.includes(':'))
})

// Load collaborators when source package changes
async function loadCollaborators() {
  if (!isConnected.value || !sourcePackage.value) return

  isLoadingCollaborators.value = true
  loadError.value = null

  try {
    const result = await listPackageCollaborators(sourcePackage.value)
    if (result) {
      collaborators.value = result
    } else {
      loadError.value = connectorError.value || 'Failed to load collaborators'
    }
  } finally {
    isLoadingCollaborators.value = false
  }
}

watch(sourcePackage, () => {
  collaborators.value = {}
  if (sourcePackage.value) {
    loadCollaborators()
  }
})

function open() {
  // Reset state
  sourcePackage.value = null
  searchQuery.value = ''
  collaborators.value = {}
  submitSuccess.value = false
  loadError.value = null
  dialogRef.value?.showModal()
}

function close() {
  dialogRef.value?.close()
}

async function handleSubmit() {
  if (teamCollaborators.value.length === 0 || props.targetPackages.length === 0) return

  isSubmitting.value = true

  try {
    // Generate operations for each target package and each team
    const operations: NewOperation[] = props.targetPackages.flatMap(pkg =>
      teamCollaborators.value.map(([scopeTeam, permission]) => ({
        type: 'access:grant' as const,
        params: {
          permission,
          scopeTeam,
          pkg,
        },
        description: `Grant ${permission} to ${scopeTeam} for ${pkg}`,
        command: `npm access grant ${permission} ${scopeTeam} ${pkg}`,
      })),
    )

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

// Get permission badge class
function getPermissionClass(permission: AccessPermission) {
  return permission === 'read-write'
    ? 'bg-green-500/10 text-green-400 border-green-500/20'
    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
}

defineExpose({ open, close })
</script>

<template>
  <Modal
    ref="dialogRef"
    :modalTitle="$t('package.bulk.copy_access_title')"
    id="copy-access-modal"
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
              $t('package.bulk.copy_operations_queued_detail', {
                teamCount: teamCollaborators.length,
                packageCount: targetPackages.length,
              })
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

    <!-- Form -->
    <div v-else class="space-y-4">
      <!-- Target packages summary -->
      <div class="p-3 bg-bg-subtle border border-border rounded-lg">
        <p class="text-sm text-fg-muted mb-2">
          {{
            $t(
              'package.bulk.copy_to_packages',
              { count: targetPackages.length },
              targetPackages.length,
            )
          }}
        </p>
        <ul class="max-h-24 overflow-y-auto space-y-1">
          <li
            v-for="pkg in targetPackages.slice(0, 5)"
            :key="pkg"
            class="font-mono text-xs text-fg truncate"
          >
            {{ pkg }}
          </li>
          <li v-if="targetPackages.length > 5" class="text-xs text-fg-subtle">
            {{ $t('package.bulk.and_more', { count: targetPackages.length - 5 }) }}
          </li>
        </ul>
      </div>

      <!-- Source package selector -->
      <div>
        <label for="source-package-search" class="block text-sm font-mono text-fg-muted mb-2">
          {{ $t('package.bulk.source_package') }}
        </label>
        <div class="relative">
          <span
            class="absolute inset-is-2 top-1/2 -translate-y-1/2 i-lucide:search w-3.5 h-3.5 text-fg-subtle"
            aria-hidden="true"
          />
          <InputBase
            id="source-package-search"
            v-model="searchQuery"
            type="search"
            name="source-package-search"
            :placeholder="$t('package.bulk.search_source_package')"
            no-correct
            class="w-full ps-7"
            size="medium"
          />
        </div>

        <!-- Package suggestions -->
        <ul
          v-if="filteredPackages.length > 0"
          class="mt-2 max-h-32 overflow-y-auto border border-border rounded-md divide-y divide-border"
        >
          <li v-for="pkg in filteredPackages" :key="pkg">
            <button
              type="button"
              class="w-full px-3 py-2 text-start font-mono text-sm transition-colors duration-200 hover:bg-bg-muted focus-visible:outline-accent/70"
              :class="
                sourcePackage === pkg ? 'bg-accent-fallback/10 text-accent-fallback' : 'text-fg'
              "
              @click="sourcePackage = pkg"
            >
              {{ pkg }}
            </button>
          </li>
        </ul>

        <!-- Selected package display -->
        <div
          v-if="sourcePackage"
          class="mt-2 p-2 bg-accent-fallback/10 border border-accent-fallback/20 rounded-md"
        >
          <div class="flex items-center justify-between">
            <span class="font-mono text-sm text-fg">{{ sourcePackage }}</span>
            <button
              type="button"
              class="text-fg-muted hover:text-fg transition-colors"
              :aria-label="$t('package.bulk.clear_source')"
              @click="sourcePackage = null"
            >
              <span class="i-lucide:x w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <!-- Loading collaborators -->
      <div v-if="isLoadingCollaborators" class="py-4 text-center">
        <span class="i-svg-spinners:ring-resize w-5 h-5 text-fg-muted mx-auto" aria-hidden="true" />
        <p class="font-mono text-xs text-fg-muted mt-2">{{ $t('package.bulk.loading_access') }}</p>
      </div>

      <!-- Error state -->
      <div
        v-else-if="loadError"
        role="alert"
        class="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md"
      >
        {{ loadError }}
      </div>

      <!-- Team access preview -->
      <div v-else-if="sourcePackage && Object.keys(collaborators).length > 0">
        <p class="text-sm font-mono text-fg-muted mb-2">
          {{ $t('package.bulk.teams_to_copy') }}
        </p>

        <div
          v-if="teamCollaborators.length === 0"
          class="p-3 bg-bg-subtle border border-border rounded-lg"
        >
          <p class="text-sm text-fg-muted">{{ $t('package.bulk.no_teams_found') }}</p>
        </div>

        <ul v-else class="space-y-1 max-h-32 overflow-y-auto">
          <li
            v-for="[team, permission] in teamCollaborators"
            :key="team"
            class="flex items-center justify-between p-2 bg-bg-subtle border border-border rounded-md"
          >
            <span class="font-mono text-sm text-fg truncate">{{ team }}</span>
            <span
              class="ms-2 px-2 py-0.5 text-xs font-mono rounded border shrink-0"
              :class="getPermissionClass(permission)"
            >
              {{ permission }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Submit button -->
      <button
        type="button"
        :disabled="!sourcePackage || teamCollaborators.length === 0 || isSubmitting"
        class="w-full px-4 py-2 font-mono text-sm text-bg bg-accent-fallback rounded-md transition-colors duration-200 hover:bg-accent-fallback/90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-accent/70"
        @click="handleSubmit"
      >
        {{
          isSubmitting
            ? $t('package.bulk.copying')
            : $t('package.bulk.copy_access_button', { count: teamCollaborators.length })
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
    </div>
  </Modal>
</template>
