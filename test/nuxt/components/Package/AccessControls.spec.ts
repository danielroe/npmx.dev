import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { ref, computed, readonly, nextTick } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import type { PendingOperation } from '../../../../cli/src/types'
import { PackageAccessControls } from '#components'

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
const mockListOrgTeams = vi.fn()

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
    listOrgTeams: mockListOrgTeams,
    listTeamUsers: vi.fn().mockResolvedValue(null),
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
  mockListOrgTeams.mockReset()
}

function simulateConnect() {
  mockState.value.connected = true
  mockState.value.npmUser = 'testuser'
}

mockNuxtImport('useConnector', () => {
  return createMockUseConnector
})

// Track current wrapper for cleanup
let currentWrapper: VueWrapper | null = null

/**
 * Get the revoke confirmation modal dialog element from the document body.
 */
function getRevokeDialog(): HTMLDialogElement | null {
  return document.body.querySelector('dialog#revoke-access-modal')
}

/**
 * Mount the component connected state with collaborators.
 */
async function mountConnectedWithCollaborators(
  collaborators: Record<string, 'read-only' | 'read-write'> = {},
  teams: string[] = [],
) {
  simulateConnect()
  mockListPackageCollaborators.mockResolvedValue(collaborators)
  mockListOrgTeams.mockResolvedValue(teams)

  currentWrapper = await mountSuspended(PackageAccessControls, {
    props: {
      packageName: '@myorg/my-package',
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

describe('PackageAccessControls', () => {
  describe('Revoke confirmation dialog', () => {
    it('does not show revoke dialog initially', async () => {
      await mountConnectedWithCollaborators({
        'myorg:developers': 'read-write',
      })

      const dialog = getRevokeDialog()
      expect(dialog?.open).toBeFalsy()
    })

    it('opens revoke dialog when clicking revoke button on a team', async () => {
      await mountConnectedWithCollaborators({
        'myorg:developers': 'read-write',
      })

      // Find and click the revoke button
      const revokeBtn = document.querySelector('button[aria-label*="Revoke"]') as HTMLButtonElement
      expect(revokeBtn).toBeTruthy()

      revokeBtn?.click()
      await nextTick()

      const dialog = getRevokeDialog()
      expect(dialog?.open).toBe(true)
    })

    it('shows team name in the confirmation dialog', async () => {
      await mountConnectedWithCollaborators({
        'myorg:developers': 'read-write',
      })

      // Open the dialog
      const revokeBtn = document.querySelector('button[aria-label*="Revoke"]') as HTMLButtonElement
      revokeBtn?.click()
      await nextTick()

      const dialog = getRevokeDialog()
      expect(dialog?.textContent).toContain('myorg:developers')
    })

    it('shows warning message in the confirmation dialog', async () => {
      await mountConnectedWithCollaborators({
        'myorg:developers': 'read-write',
      })

      // Open the dialog
      const revokeBtn = document.querySelector('button[aria-label*="Revoke"]') as HTMLButtonElement
      revokeBtn?.click()
      await nextTick()

      const dialog = getRevokeDialog()
      // Should contain the warning about the action being irreversible
      expect(dialog?.textContent).toContain('cannot be undone')
    })

    it('closes dialog when clicking close button', async () => {
      await mountConnectedWithCollaborators({
        'myorg:developers': 'read-write',
      })

      // Open the dialog
      const revokeBtn = document.querySelector('button[aria-label*="Revoke"]') as HTMLButtonElement
      revokeBtn?.click()
      await nextTick()

      const dialog = getRevokeDialog()
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

    it('calls addOperation when confirming revoke', async () => {
      mockAddOperation.mockResolvedValue({
        id: '0000000000000001',
        type: 'access:revoke',
        params: { scopeTeam: 'myorg:developers', pkg: '@myorg/my-package' },
        description: 'Revoke myorg:developers access to @myorg/my-package',
        command: 'npm access revoke myorg:developers @myorg/my-package',
        status: 'pending',
        createdAt: Date.now(),
      })

      await mountConnectedWithCollaborators({
        'myorg:developers': 'read-write',
      })

      // Open the dialog
      const revokeBtn = document.querySelector('button[aria-label*="Revoke"]') as HTMLButtonElement
      revokeBtn?.click()
      await nextTick()

      const dialog = getRevokeDialog()

      // Find and click confirm button
      const buttons = dialog?.querySelectorAll('button')
      const confirmBtn = Array.from(buttons || []).find(b =>
        b.textContent?.toLowerCase().includes('revoke'),
      ) as HTMLButtonElement
      confirmBtn?.click()
      await nextTick()

      expect(mockAddOperation).toHaveBeenCalledWith({
        type: 'access:revoke',
        params: {
          scopeTeam: 'myorg:developers',
          pkg: '@myorg/my-package',
        },
        description: 'Revoke myorg:developers access to @myorg/my-package',
        command: 'npm access revoke myorg:developers @myorg/my-package',
      })
    })

    it('closes dialog after successful revoke', async () => {
      mockAddOperation.mockResolvedValue({
        id: '0000000000000001',
        type: 'access:revoke',
        params: { scopeTeam: 'myorg:developers', pkg: '@myorg/my-package' },
        description: 'Revoke myorg:developers access to @myorg/my-package',
        command: 'npm access revoke myorg:developers @myorg/my-package',
        status: 'pending',
        createdAt: Date.now(),
      })

      await mountConnectedWithCollaborators({
        'myorg:developers': 'read-write',
      })

      // Open the dialog
      const revokeBtn = document.querySelector('button[aria-label*="Revoke"]') as HTMLButtonElement
      revokeBtn?.click()
      await nextTick()

      const dialog = getRevokeDialog()

      // Find and click confirm button
      const buttons = dialog?.querySelectorAll('button')
      const confirmBtn = Array.from(buttons || []).find(b =>
        b.textContent?.toLowerCase().includes('revoke'),
      ) as HTMLButtonElement
      confirmBtn?.click()
      await nextTick()
      await nextTick()

      expect(dialog?.open).toBe(false)
    })

    it('shows error message when revoke fails', async () => {
      mockAddOperation.mockResolvedValue(null)
      mockState.value.error = 'Connection failed'

      await mountConnectedWithCollaborators({
        'myorg:developers': 'read-write',
      })

      // Open the dialog
      const revokeBtn = document.querySelector('button[aria-label*="Revoke"]') as HTMLButtonElement
      revokeBtn?.click()
      await nextTick()

      const dialog = getRevokeDialog()

      // Find and click confirm button
      const buttons = dialog?.querySelectorAll('button')
      const confirmBtn = Array.from(buttons || []).find(b =>
        b.textContent?.toLowerCase().includes('revoke'),
      ) as HTMLButtonElement
      confirmBtn?.click()
      await nextTick()
      await nextTick()

      // Dialog should stay open with error
      expect(dialog?.open).toBe(true)
      const alert = dialog?.querySelector('[role="alert"]')
      expect(alert).toBeTruthy()
    })

    it('does not show revoke button for users (only teams)', async () => {
      await mountConnectedWithCollaborators({
        'myorg:developers': 'read-write',
        'testuser': 'read-write',
      })

      // Should have only one revoke button (for the team)
      const revokeButtons = document.querySelectorAll('button[aria-label*="Revoke"]')
      expect(revokeButtons.length).toBe(1)
    })
  })

  describe('Component visibility', () => {
    it('does not render when not connected', async () => {
      currentWrapper = await mountSuspended(PackageAccessControls, {
        props: {
          packageName: '@myorg/my-package',
        },
        attachTo: document.body,
      })
      await nextTick()

      // The section should not be rendered
      const section = document.querySelector('section')
      expect(section).toBeNull()
    })

    it('does not render for non-scoped packages', async () => {
      simulateConnect()
      mockListPackageCollaborators.mockResolvedValue({})
      mockListOrgTeams.mockResolvedValue([])

      currentWrapper = await mountSuspended(PackageAccessControls, {
        props: {
          packageName: 'my-package', // Not scoped
        },
        attachTo: document.body,
      })
      await nextTick()

      // The section should not be rendered
      const section = document.querySelector('section')
      expect(section).toBeNull()
    })

    it('renders section when connected with scoped package', async () => {
      await mountConnectedWithCollaborators({})

      const section = document.querySelector('section')
      expect(section).not.toBeNull()
    })
  })
})
