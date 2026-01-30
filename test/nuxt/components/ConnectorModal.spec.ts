/**
 * Tests for ConnectorModal component.
 *
 * Uses the mock connector composable to test various states
 * without needing an actual HTTP server.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref, computed, readonly, nextTick } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import type { MockConnectorTestControls } from '../../../shared/test-utils'

/** Subset of MockConnectorTestControls for unit tests that don't need stateManager */
type UnitTestConnectorControls = Omit<MockConnectorTestControls, 'stateManager'>
import type { PendingOperation } from '../../../cli/src/types'
import { ConnectorModal } from '#components'

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
    pendingOperations: computed(() =>
      mockState.value.operations.filter(op => op.status === 'pending'),
    ),
    approvedOperations: computed(() =>
      mockState.value.operations.filter(op => op.status === 'approved'),
    ),
    completedOperations: computed(() =>
      mockState.value.operations.filter(op => op.status === 'completed'),
    ),
    activeOperations: computed(() =>
      mockState.value.operations.filter(op => op.status !== 'completed'),
    ),
    hasOperations: computed(() => mockState.value.operations.length > 0),
    hasPendingOperations: computed(() =>
      mockState.value.operations.some(op => op.status === 'pending'),
    ),
    hasApprovedOperations: computed(() =>
      mockState.value.operations.some(op => op.status === 'approved'),
    ),
    hasActiveOperations: computed(() =>
      mockState.value.operations.some(op => op.status !== 'completed'),
    ),
    hasCompletedOperations: computed(() =>
      mockState.value.operations.some(op => op.status === 'completed'),
    ),
    connect: vi.fn().mockResolvedValue(true),
    reconnect: vi.fn().mockResolvedValue(true),
    disconnect: vi.fn(),
    refreshState: vi.fn().mockResolvedValue(undefined),
    addOperation: vi.fn().mockResolvedValue(null),
    addOperations: vi.fn().mockResolvedValue([]),
    removeOperation: vi.fn().mockResolvedValue(true),
    clearOperations: vi.fn().mockResolvedValue(0),
    approveOperation: vi.fn().mockResolvedValue(true),
    retryOperation: vi.fn().mockResolvedValue(true),
    approveAll: vi.fn().mockResolvedValue(0),
    executeOperations: vi.fn().mockResolvedValue({ success: true }),
    listOrgUsers: vi.fn().mockResolvedValue(null),
    listOrgTeams: vi.fn().mockResolvedValue(null),
    listTeamUsers: vi.fn().mockResolvedValue(null),
    listPackageCollaborators: vi.fn().mockResolvedValue(null),
    listUserPackages: vi.fn().mockResolvedValue(null),
    listUserOrgs: vi.fn().mockResolvedValue(null),
  }
}

// Test controls for manipulating mock state
const mockControls: UnitTestConnectorControls = {
  setOrgData: vi.fn(),
  setUserOrgs: vi.fn(),
  setUserPackages: vi.fn(),
  setPackageData: vi.fn(),
  reset() {
    mockState.value = {
      connected: false,
      connecting: false,
      npmUser: null,
      avatar: null,
      operations: [],
      error: null,
      lastExecutionTime: null,
    }
  },
  simulateConnect() {
    mockState.value.connected = true
    mockState.value.npmUser = 'testuser'
    mockState.value.avatar = 'https://example.com/avatar.png'
  },
  simulateDisconnect() {
    mockState.value.connected = false
    mockState.value.npmUser = null
    mockState.value.avatar = null
  },
  simulateError(message: string) {
    mockState.value.error = message
  },
  clearError() {
    mockState.value.error = null
  },
}

// Mock the composables at module level (vi.mock is hoisted)
vi.mock('~/composables/useConnector', () => ({
  useConnector: createMockUseConnector,
}))

vi.mock('~/composables/useSelectedPackageManager', () => ({
  useSelectedPackageManager: () => ref('npm'),
}))

vi.mock('~/utils/npm', () => ({
  getExecuteCommand: () => 'npx npmx-connector',
}))

// Mock clipboard
const mockWriteText = vi.fn().mockResolvedValue(undefined)
vi.stubGlobal('navigator', {
  ...navigator,
  clipboard: {
    writeText: mockWriteText,
    readText: vi.fn().mockResolvedValue(''),
  },
})

// Track current wrapper for cleanup
let currentWrapper: VueWrapper | null = null

/**
 * Get the modal dialog element from the document body (where Teleport sends it)
 */
function getModalDialog(): HTMLElement | null {
  return document.body.querySelector('[role="dialog"]')
}

// Reset state before each test
beforeEach(() => {
  mockControls.reset()
  mockWriteText.mockClear()
})

afterEach(() => {
  vi.clearAllMocks()
  // Clean up Vue wrapper to remove teleported content
  if (currentWrapper) {
    currentWrapper.unmount()
    currentWrapper = null
  }
})

describe('ConnectorModal', () => {
  describe('Disconnected state', () => {
    it('shows connection form when not connected', async () => {
      currentWrapper = await mountSuspended(ConnectorModal, {
        props: { open: true },
        attachTo: document.body,
      })
      await nextTick()

      const dialog = getModalDialog()
      expect(dialog).not.toBeNull()

      // Should show the form (disconnected state)
      const form = dialog?.querySelector('form')
      expect(form).not.toBeNull()

      // Should show token input
      const tokenInput = dialog?.querySelector('input[name="connector-token"]')
      expect(tokenInput).not.toBeNull()

      // Should show connect button
      const connectButton = dialog?.querySelector('button[type="submit"]')
      expect(connectButton).not.toBeNull()
    })

    it('shows the CLI command to run', async () => {
      currentWrapper = await mountSuspended(ConnectorModal, {
        props: { open: true },
        attachTo: document.body,
      })
      await nextTick()

      const dialog = getModalDialog()
      expect(dialog?.textContent).toContain('npx npmx-connector')
    })

    it('can copy command to clipboard', async () => {
      currentWrapper = await mountSuspended(ConnectorModal, {
        props: { open: true },
        attachTo: document.body,
      })
      await nextTick()

      const dialog = getModalDialog()
      const copyButton = dialog?.querySelector(
        'button[aria-label="Copy command"]',
      ) as HTMLButtonElement
      expect(copyButton).not.toBeNull()

      copyButton?.click()
      await nextTick()

      expect(mockWriteText).toHaveBeenCalled()
    })

    it('disables connect button when token is empty', async () => {
      currentWrapper = await mountSuspended(ConnectorModal, {
        props: { open: true },
        attachTo: document.body,
      })
      await nextTick()

      const dialog = getModalDialog()
      const connectButton = dialog?.querySelector('button[type="submit"]') as HTMLButtonElement
      expect(connectButton?.disabled).toBe(true)
    })

    it('enables connect button when token is entered', async () => {
      currentWrapper = await mountSuspended(ConnectorModal, {
        props: { open: true },
        attachTo: document.body,
      })
      await nextTick()

      const dialog = getModalDialog()
      const tokenInput = dialog?.querySelector('input[name="connector-token"]') as HTMLInputElement
      expect(tokenInput).not.toBeNull()

      // Set value and dispatch input event to trigger v-model
      tokenInput.value = 'my-test-token'
      tokenInput.dispatchEvent(new Event('input', { bubbles: true }))
      await nextTick()

      const connectButton = dialog?.querySelector('button[type="submit"]') as HTMLButtonElement
      expect(connectButton?.disabled).toBe(false)
    })

    it('shows error message when connection fails', async () => {
      // Simulate an error before mounting
      mockControls.simulateError('Could not reach connector. Is it running?')

      currentWrapper = await mountSuspended(ConnectorModal, {
        props: { open: true },
        attachTo: document.body,
      })
      await nextTick()

      const dialog = getModalDialog()
      const alerts = dialog?.querySelectorAll('[role="alert"]')
      // Find the alert containing our error message
      const errorAlert = Array.from(alerts || []).find(el =>
        el.textContent?.includes('Could not reach connector'),
      )
      expect(errorAlert).not.toBeUndefined()
    })
  })

  describe('Connected state', () => {
    beforeEach(() => {
      // Start in connected state
      mockControls.simulateConnect()
    })

    it('shows connected status', async () => {
      currentWrapper = await mountSuspended(ConnectorModal, {
        props: { open: true },
        attachTo: document.body,
      })
      await nextTick()

      const dialog = getModalDialog()
      expect(dialog?.textContent).toContain('Connected')
    })

    it('shows logged in username', async () => {
      currentWrapper = await mountSuspended(ConnectorModal, {
        props: { open: true },
        attachTo: document.body,
      })
      await nextTick()

      const dialog = getModalDialog()
      expect(dialog?.textContent).toContain('testuser')
    })

    it('shows disconnect button', async () => {
      currentWrapper = await mountSuspended(ConnectorModal, {
        props: { open: true },
        attachTo: document.body,
      })
      await nextTick()

      const dialog = getModalDialog()
      const buttons = dialog?.querySelectorAll('button')
      const disconnectBtn = Array.from(buttons || []).find(b =>
        b.textContent?.toLowerCase().includes('disconnect'),
      )
      expect(disconnectBtn).not.toBeUndefined()
    })

    it('hides connection form when connected', async () => {
      currentWrapper = await mountSuspended(ConnectorModal, {
        props: { open: true },
        attachTo: document.body,
      })
      await nextTick()

      const dialog = getModalDialog()
      // Form and token input should not exist when connected
      const form = dialog?.querySelector('form')
      expect(form).toBeNull()
    })
  })

  describe('Modal behavior', () => {
    it('closes modal when close button is clicked', async () => {
      currentWrapper = await mountSuspended(ConnectorModal, {
        props: { open: true },
        attachTo: document.body,
      })
      await nextTick()

      const dialog = getModalDialog()
      // Find the close button (X icon) within the dialog header
      const closeBtn = dialog?.querySelector('button[aria-label="Close"]') as HTMLButtonElement
      expect(closeBtn).not.toBeNull()

      closeBtn?.click()
      await nextTick()

      // Check that open was set to false (v-model)
      const emitted = currentWrapper.emitted('update:open')
      expect(emitted).toBeTruthy()
      expect(emitted![0]).toEqual([false])
    })

    it('closes modal when backdrop is clicked', async () => {
      currentWrapper = await mountSuspended(ConnectorModal, {
        props: { open: true },
        attachTo: document.body,
      })
      await nextTick()

      // Find the backdrop button by aria-label
      const backdrop = document.body.querySelector(
        'button[aria-label="Close modal"]',
      ) as HTMLButtonElement
      expect(backdrop).not.toBeNull()

      backdrop?.click()
      await nextTick()

      // Check that open was set to false (v-model)
      const emitted = currentWrapper.emitted('update:open')
      expect(emitted).toBeTruthy()
      expect(emitted![0]).toEqual([false])
    })

    it('does not render dialog when open is false', async () => {
      currentWrapper = await mountSuspended(ConnectorModal, {
        props: { open: false },
        attachTo: document.body,
      })
      await nextTick()

      const dialog = getModalDialog()
      expect(dialog).toBeNull()
    })
  })
})
