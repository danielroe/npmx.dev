import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { ref, computed, readonly, nextTick } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import type { PendingOperation } from '../../../../cli/src/types'
import { PackageMaintainers } from '#components'

// Mock state that will be controlled by tests
const mockState = ref({
  connected: false,
  connecting: false,
  npmUser: null as string | null,
  avatar: null as string | null,
  operations: [] as PendingOperation[],
  error: null as string | null,
  lastExecutionTime: null as number | null,
})

// Mock connector methods
const mockAddOperation = vi.fn()
const mockListPackageCollaborators = vi.fn()
const mockListTeamUsers = vi.fn()

// Create the mock composable function
function createMockUseConnector() {
  return {
    state: readonly(mockState),
    isConnected: computed(() => mockState.value.connected),
    isConnecting: computed(() => mockState.value.connecting),
    npmUser: computed(() => mockState.value.npmUser),
    avatar: computed(() => mockState.value.avatar),
    error: computed(() => mockState.value.error),
    lastExecutionTime: computed(() => mockState.value.lastExecutionTime),
    operations: computed(() => mockState.value.operations),
    connect: vi.fn().mockResolvedValue(true),
    reconnect: vi.fn().mockResolvedValue(true),
    disconnect: vi.fn(),
    refreshState: vi.fn().mockResolvedValue(undefined),
    addOperation: mockAddOperation,
    addOperations: vi.fn().mockResolvedValue([]),
    removeOperation: vi.fn().mockResolvedValue(true),
    clearOperations: vi.fn().mockResolvedValue(0),
    approveOperation: vi.fn().mockResolvedValue(true),
    retryOperation: vi.fn().mockResolvedValue(true),
    approveAll: vi.fn().mockResolvedValue(0),
    executeOperations: vi.fn().mockResolvedValue({ success: true }),
    listOrgUsers: vi.fn().mockResolvedValue(null),
    listOrgTeams: vi.fn().mockResolvedValue(null),
    listTeamUsers: mockListTeamUsers,
    listTeamPackages: vi.fn().mockResolvedValue(null),
    listPackageCollaborators: mockListPackageCollaborators,
    listUserPackages: vi.fn().mockResolvedValue(null),
    listUserOrgs: vi.fn().mockResolvedValue(null),
  }
}

function resetMockState() {
  mockState.value = {
    connected: false,
    connecting: false,
    npmUser: null,
    avatar: null,
    operations: [],
    error: null,
    lastExecutionTime: null,
  }
  mockAddOperation.mockReset()
  mockListPackageCollaborators.mockReset()
  mockListTeamUsers.mockReset()
}

function simulateConnect(npmUser = 'testuser') {
  mockState.value.connected = true
  mockState.value.npmUser = npmUser
}

mockNuxtImport('useConnector', () => {
  return createMockUseConnector
})

// Track current wrapper for cleanup
let currentWrapper: VueWrapper | null = null

/**
 * Get the remove owner confirmation modal dialog element from the document body.
 */
function getRemoveDialog(): HTMLDialogElement | null {
  return document.body.querySelector('dialog#remove-owner-modal')
}

/**
 * Mount the component with maintainers.
 */
async function mountWithMaintainers(
  maintainers: Array<{ name?: string; email?: string }>,
  packageName = '@myorg/my-package',
  connected = true,
) {
  if (connected) {
    simulateConnect()
    mockListPackageCollaborators.mockResolvedValue({})
  }

  currentWrapper = await mountSuspended(PackageMaintainers, {
    props: {
      packageName,
      maintainers,
    },
    attachTo: document.body,
  })

  // Wait for async data loading
  await nextTick()
  await nextTick()

  return currentWrapper
}

// Reset state before each test
beforeEach(() => {
  resetMockState()
})

afterEach(() => {
  vi.clearAllMocks()
  if (currentWrapper) {
    currentWrapper.unmount()
    currentWrapper = null
  }
})

describe('PackageMaintainers', () => {
  describe('Remove owner confirmation dialog', () => {
    it('does not show remove dialog initially', async () => {
      await mountWithMaintainers([{ name: 'developer1' }, { name: 'developer2' }])

      const dialog = getRemoveDialog()
      expect(dialog?.open).toBeFalsy()
    })

    it('opens remove dialog when clicking remove button on a maintainer', async () => {
      await mountWithMaintainers([{ name: 'developer1' }, { name: 'developer2' }])

      // Find and click the remove button (first one, for developer1)
      const removeBtn = document.querySelector('button[aria-label*="Remove"]') as HTMLButtonElement
      expect(removeBtn).toBeTruthy()

      removeBtn?.click()
      await nextTick()

      const dialog = getRemoveDialog()
      expect(dialog?.open).toBe(true)
    })

    it('shows username in the confirmation dialog', async () => {
      await mountWithMaintainers([{ name: 'developer1' }, { name: 'developer2' }])

      // Open the dialog for developer1
      const removeBtn = document.querySelector('button[aria-label*="Remove"]') as HTMLButtonElement
      removeBtn?.click()
      await nextTick()

      const dialog = getRemoveDialog()
      expect(dialog?.textContent).toContain('developer1')
    })

    it('shows warning message in the confirmation dialog', async () => {
      await mountWithMaintainers([{ name: 'developer1' }, { name: 'developer2' }])

      // Open the dialog
      const removeBtn = document.querySelector('button[aria-label*="Remove"]') as HTMLButtonElement
      removeBtn?.click()
      await nextTick()

      const dialog = getRemoveDialog()
      // Should contain the warning about revoking ownership
      expect(dialog?.textContent).toContain('revoke ownership')
    })

    it('closes dialog when clicking close button', async () => {
      await mountWithMaintainers([{ name: 'developer1' }, { name: 'developer2' }])

      // Open the dialog
      const removeBtn = document.querySelector('button[aria-label*="Remove"]') as HTMLButtonElement
      removeBtn?.click()
      await nextTick()

      const dialog = getRemoveDialog()
      expect(dialog?.open).toBe(true)

      // Find and click close button
      const buttons = dialog?.querySelectorAll('button')
      const closeBtn = Array.from(buttons || []).find(b =>
        b.textContent?.toLowerCase().includes('close'),
      ) as HTMLButtonElement
      closeBtn?.click()
      await nextTick()

      expect(dialog?.open).toBe(false)
    })

    it('calls addOperation when confirming remove', async () => {
      mockAddOperation.mockResolvedValue({
        id: '0000000000000001',
        type: 'owner:rm',
        params: { user: 'developer1', pkg: '@myorg/my-package' },
        description: 'Remove @developer1 from @myorg/my-package',
        command: 'npm owner rm developer1 @myorg/my-package',
        status: 'pending',
        createdAt: Date.now(),
      })

      await mountWithMaintainers([{ name: 'developer1' }, { name: 'developer2' }])

      // Open the dialog
      const removeBtn = document.querySelector('button[aria-label*="Remove"]') as HTMLButtonElement
      removeBtn?.click()
      await nextTick()

      const dialog = getRemoveDialog()

      // Find and click confirm button
      const buttons = dialog?.querySelectorAll('button')
      const confirmBtn = Array.from(buttons || []).find(b =>
        b.textContent?.toLowerCase().includes('remove owner'),
      ) as HTMLButtonElement
      confirmBtn?.click()
      await nextTick()

      expect(mockAddOperation).toHaveBeenCalledWith({
        type: 'owner:rm',
        params: {
          user: 'developer1',
          pkg: '@myorg/my-package',
        },
        description: 'Remove @developer1 from @myorg/my-package',
        command: 'npm owner rm developer1 @myorg/my-package',
      })
    })

    it('closes dialog after successful remove', async () => {
      mockAddOperation.mockResolvedValue({
        id: '0000000000000001',
        type: 'owner:rm',
        params: { user: 'developer1', pkg: '@myorg/my-package' },
        description: 'Remove @developer1 from @myorg/my-package',
        command: 'npm owner rm developer1 @myorg/my-package',
        status: 'pending',
        createdAt: Date.now(),
      })

      await mountWithMaintainers([{ name: 'developer1' }, { name: 'developer2' }])

      // Open the dialog
      const removeBtn = document.querySelector('button[aria-label*="Remove"]') as HTMLButtonElement
      removeBtn?.click()
      await nextTick()

      const dialog = getRemoveDialog()

      // Find and click confirm button
      const buttons = dialog?.querySelectorAll('button')
      const confirmBtn = Array.from(buttons || []).find(b =>
        b.textContent?.toLowerCase().includes('remove owner'),
      ) as HTMLButtonElement
      confirmBtn?.click()
      await nextTick()
      await nextTick()

      expect(dialog?.open).toBe(false)
    })

    it('shows error message when remove fails', async () => {
      mockAddOperation.mockResolvedValue(null)
      mockState.value.error = 'Connection failed'

      await mountWithMaintainers([{ name: 'developer1' }, { name: 'developer2' }])

      // Open the dialog
      const removeBtn = document.querySelector('button[aria-label*="Remove"]') as HTMLButtonElement
      removeBtn?.click()
      await nextTick()

      const dialog = getRemoveDialog()

      // Find and click confirm button
      const buttons = dialog?.querySelectorAll('button')
      const confirmBtn = Array.from(buttons || []).find(b =>
        b.textContent?.toLowerCase().includes('remove owner'),
      ) as HTMLButtonElement
      confirmBtn?.click()
      await nextTick()
      await nextTick()

      // Dialog should stay open with error
      expect(dialog?.open).toBe(true)
      const alert = dialog?.querySelector('[role="alert"]')
      expect(alert).toBeTruthy()
    })

    it('does not show remove button for self (current user)', async () => {
      // Connected as testuser
      simulateConnect('testuser')

      await mountWithMaintainers([{ name: 'testuser' }, { name: 'developer2' }])

      // Should have only one remove button (for developer2, not testuser)
      const removeButtons = document.querySelectorAll('button[aria-label*="Remove"]')
      expect(removeButtons.length).toBe(1)
    })

    it('does not show remove buttons when not connected', async () => {
      await mountWithMaintainers(
        [{ name: 'developer1' }, { name: 'developer2' }],
        '@myorg/my-package',
        false,
      )

      const removeButtons = document.querySelectorAll('button[aria-label*="Remove"]')
      expect(removeButtons.length).toBe(0)
    })
  })

  describe('Component visibility', () => {
    it('renders when maintainers are provided', async () => {
      await mountWithMaintainers([{ name: 'developer1' }], '@myorg/my-package', false)

      // The section should be rendered
      const section = document.querySelector('[id="maintainers"]')
      expect(section).not.toBeNull()
    })

    it('does not render when no maintainers', async () => {
      currentWrapper = await mountSuspended(PackageMaintainers, {
        props: {
          packageName: '@myorg/my-package',
          maintainers: [],
        },
        attachTo: document.body,
      })
      await nextTick()

      // The section should not be rendered
      const section = document.querySelector('[id="maintainers"]')
      expect(section).toBeNull()
    })

    it('renders maintainer list', async () => {
      await mountWithMaintainers(
        [{ name: 'developer1' }, { name: 'developer2' }],
        '@myorg/my-package',
        false,
      )

      const list = document.querySelector('ul[aria-label*="maintainers"]')
      expect(list).not.toBeNull()
      expect(list?.querySelectorAll('li').length).toBe(2)
    })
  })
})
