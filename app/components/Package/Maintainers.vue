<script setup lang="ts">
import type { NewOperation } from '~/composables/useConnector'

const props = defineProps<{
  packageName: string
  maintainers?: Array<{ name?: string; email?: string }>
}>()

const {
  isConnected,
  lastExecutionTime,
  npmUser,
  addOperation,
  listPackageCollaborators,
  listTeamUsers,
  error: connectorError,
} = useConnector()

const showAddOwner = shallowRef(false)
const newOwnerUsername = shallowRef('')
const isAdding = shallowRef(false)
const showAllMaintainers = shallowRef(false)

// Remove owner confirmation state
const removeDialogRef = useTemplateRef('removeDialogRef')
const removeTarget = shallowRef<{ username: string } | null>(null)
const isRemoving = shallowRef(false)
const removeError = shallowRef<string | null>(null)

const DEFAULT_VISIBLE_MAINTAINERS = 5

// Show admin controls when connected (let npm CLI handle permission errors)
const canManageOwners = computed(() => isConnected.value)

// Computed for visible maintainers with show more/fewer support
const visibleMaintainers = computed(() => {
  if (canManageOwners.value || showAllMaintainers.value) {
    return maintainerAccess.value
  }
  return maintainerAccess.value.slice(0, DEFAULT_VISIBLE_MAINTAINERS)
})

const hiddenMaintainersCount = computed(() =>
  Math.max(0, maintainerAccess.value.length - DEFAULT_VISIBLE_MAINTAINERS),
)

// Extract org name from scoped package
const orgName = computed(() => {
  if (!props.packageName.startsWith('@')) return null
  const match = props.packageName.match(/^@([^/]+)\//)
  return match ? match[1] : null
})

// Access data: who has access and via what
const collaborators = shallowRef<Record<string, 'read-only' | 'read-write'>>({})
const teamMembers = ref<Record<string, string[]>>({}) // team -> members
const isLoadingAccess = shallowRef(false)

// Compute access source for each maintainer
const maintainerAccess = computed(() => {
  if (!props.maintainers) return []

  return props.maintainers.map(maintainer => {
    const name = maintainer.name
    if (!name) return { ...maintainer, accessVia: [] as string[] }

    const accessVia: string[] = []

    // Check if they're a direct owner (in collaborators as a user, not team)
    if (collaborators.value[name]) {
      accessVia.push('owner')
    }

    // Check which teams they're in that have access
    for (const [collab, _perm] of Object.entries(collaborators.value)) {
      // Teams are in format "org:team"
      if (collab.includes(':')) {
        const teamName = collab.split(':')[1]
        const members = teamMembers.value[collab]
        if (members?.includes(name)) {
          accessVia.push(teamName || collab)
        }
      }
    }

    // If no specific access found, they're likely an owner
    if (accessVia.length === 0) {
      accessVia.push('owner')
    }

    return { ...maintainer, accessVia }
  })
})

// Load access information
async function loadAccessInfo() {
  if (!isConnected.value) return

  isLoadingAccess.value = true

  try {
    // Get collaborators (teams and users with access)
    const collabResult = await listPackageCollaborators(props.packageName)
    if (collabResult) {
      collaborators.value = collabResult

      // For each team collaborator, load its members
      const teamPromises: Promise<void>[] = []
      for (const collab of Object.keys(collabResult)) {
        if (collab.includes(':')) {
          teamPromises.push(
            listTeamUsers(collab).then((members: string[] | null) => {
              if (members) {
                teamMembers.value[collab] = members
              }
            }),
          )
        }
      }
      await Promise.all(teamPromises)
    }
  } finally {
    isLoadingAccess.value = false
  }
}

async function handleAddOwner() {
  if (!newOwnerUsername.value.trim()) return

  isAdding.value = true
  try {
    const username = newOwnerUsername.value.trim().replace(/^@/, '')
    const operation: NewOperation = {
      type: 'owner:add',
      params: {
        user: username,
        pkg: props.packageName,
      },
      description: `Add @${username} as owner of ${props.packageName}`,
      command: `npm owner add ${username} ${props.packageName}`,
    }

    await addOperation(operation)
    newOwnerUsername.value = ''
    showAddOwner.value = false
  } finally {
    isAdding.value = false
  }
}

// Open remove owner confirmation dialog
function openRemoveDialog(username: string) {
  removeTarget.value = { username }
  removeError.value = null
  removeDialogRef.value?.showModal()
}

// Close remove owner confirmation dialog
function closeRemoveDialog() {
  removeDialogRef.value?.close()
  removeTarget.value = null
  removeError.value = null
}

// Remove owner (after confirmation)
async function handleRemoveOwner() {
  if (!removeTarget.value) return

  isRemoving.value = true
  removeError.value = null

  try {
    const operation: NewOperation = {
      type: 'owner:rm',
      params: {
        user: removeTarget.value.username,
        pkg: props.packageName,
      },
      description: `Remove @${removeTarget.value.username} from ${props.packageName}`,
      command: `npm owner rm ${removeTarget.value.username} ${props.packageName}`,
    }

    const result = await addOperation(operation)
    if (result) {
      closeRemoveDialog()
    } else {
      removeError.value = connectorError.value || 'Failed to queue remove operation'
    }
  } catch (err) {
    removeError.value = err instanceof Error ? err.message : 'Failed to remove owner'
  } finally {
    isRemoving.value = false
  }
}

// Load access info when connected and for scoped packages
watch(
  [isConnected, () => props.packageName, lastExecutionTime],
  ([connected]) => {
    if (connected && orgName.value) {
      loadAccessInfo()
    }
  },
  { immediate: true },
)
</script>

<template>
  <CollapsibleSection
    v-if="maintainers?.length"
    id="maintainers"
    :title="$t('package.maintainers.title')"
  >
    <ul
      class="space-y-2 list-none m-0 p-0 my-1 px-1"
      :aria-label="$t('package.maintainers.list_label')"
    >
      <li
        v-for="maintainer in visibleMaintainers"
        :key="maintainer.name ?? maintainer.email"
        class="flex items-center justify-between gap-2"
      >
        <div class="flex items-center gap-2 min-w-0">
          <LinkBase
            v-if="maintainer.name"
            :to="{
              name: '~username',
              params: { username: maintainer.name },
            }"
            class="link-subtle text-sm shrink-0"
            dir="ltr"
          >
            ~{{ maintainer.name }}
          </LinkBase>
          <span v-else class="font-mono text-sm text-fg-muted" dir="ltr">{{
            maintainer.email
          }}</span>

          <!-- Access source badges -->
          <span
            v-if="isConnected && maintainer.accessVia?.length && !isLoadingAccess"
            class="text-xs text-fg-subtle truncate"
          >
            {{
              $t('package.maintainers.via', {
                teams: maintainer.accessVia.join(', '),
              })
            }}
          </span>
          <span
            v-if="canManageOwners && maintainer.name === npmUser"
            class="text-xs text-fg-subtle shrink-0"
            >{{ $t('package.maintainers.you') }}</span
          >
        </div>

        <!-- Remove button (only when can manage and not self) -->
        <ButtonBase
          v-if="canManageOwners && maintainer.name && maintainer.name !== npmUser"
          type="button"
          class="hover:text-red-400"
          :aria-label="
            $t('package.maintainers.remove_owner', {
              name: maintainer.name,
            })
          "
          @click="openRemoveDialog(maintainer.name)"
        >
          <span class="i-lucide:x w-3.5 h-3.5" aria-hidden="true" />
        </ButtonBase>
      </li>
    </ul>

    <!-- Show more/less toggle (only when not managing and there are hidden maintainers) -->
    <ButtonBase
      v-if="!canManageOwners && hiddenMaintainersCount > 0"
      @click="showAllMaintainers = !showAllMaintainers"
    >
      {{
        showAllMaintainers
          ? $t('package.maintainers.show_less')
          : $t('package.maintainers.show_more', {
              count: hiddenMaintainersCount,
            })
      }}
    </ButtonBase>

    <!-- Add owner form (only when can manage) -->
    <div v-if="canManageOwners" class="mt-3">
      <div v-if="showAddOwner">
        <form class="flex items-center gap-2" @submit.prevent="handleAddOwner">
          <label for="add-owner-username" class="sr-only">{{
            $t('package.maintainers.username_to_add')
          }}</label>
          <InputBase
            id="add-owner-username"
            v-model="newOwnerUsername"
            type="text"
            name="add-owner-username"
            :placeholder="$t('package.maintainers.username_placeholder')"
            no-correct
            class="flex-1 min-w-25 m-1"
            size="small"
          />
          <ButtonBase type="submit" :disabled="!newOwnerUsername.trim() || isAdding">
            {{ isAdding ? '…' : $t('package.maintainers.add_button') }}
          </ButtonBase>
          <ButtonBase
            :aria-label="$t('package.maintainers.cancel_add')"
            @click="showAddOwner = false"
            classicon="i-lucide:x"
          />
        </form>
      </div>
      <ButtonBase v-else type="button" @click="showAddOwner = true">
        {{ $t('package.maintainers.add_owner') }}
      </ButtonBase>
    </div>
  </CollapsibleSection>

  <!-- Remove Owner Confirmation Modal -->
  <ClientOnly>
    <Modal
      ref="removeDialogRef"
      :modal-title="$t('package.maintainers.remove.title')"
      id="remove-owner-modal"
      class="max-w-sm"
    >
      <div class="space-y-4">
        <!-- Warning message -->
        <div
          class="p-3 text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-md"
        >
          <p class="font-medium mb-1">{{ $t('package.maintainers.remove.warning') }}</p>
          <p class="text-xs text-yellow-400/80">
            {{
              $t('package.maintainers.remove.impact', {
                user: removeTarget?.username,
                package: packageName,
              })
            }}
          </p>
        </div>

        <!-- User being removed -->
        <div class="flex items-center gap-2 p-3 bg-bg-subtle border border-border rounded-md">
          <span class="i-lucide:user w-4 h-4 text-fg-subtle shrink-0" aria-hidden="true" />
          <span class="font-mono text-sm text-fg">@{{ removeTarget?.username }}</span>
        </div>

        <!-- Error message -->
        <div
          v-if="removeError"
          class="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md"
          role="alert"
        >
          {{ removeError }}
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 px-4 py-2 font-mono text-sm text-fg-muted bg-bg-subtle border border-border rounded-md transition-colors duration-200 hover:text-fg hover:border-border-hover focus-visible:outline-accent/70"
            :disabled="isRemoving"
            @click="closeRemoveDialog"
          >
            {{ $t('common.close') }}
          </button>
          <button
            type="button"
            class="flex-1 px-4 py-2 font-mono text-sm text-white bg-red-600 rounded-md transition-colors duration-200 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-accent/70"
            :disabled="isRemoving"
            @click="handleRemoveOwner"
          >
            <span v-if="isRemoving" class="flex items-center justify-center gap-2">
              <span class="i-svg-spinners:ring-resize w-4 h-4 animate-spin" aria-hidden="true" />
              {{ $t('package.maintainers.remove.removing') }}
            </span>
            <span v-else>{{ $t('package.maintainers.remove.confirm') }}</span>
          </button>
        </div>
      </div>
    </Modal>
  </ClientOnly>
</template>
