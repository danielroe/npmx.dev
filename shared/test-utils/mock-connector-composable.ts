/**
 * Mock implementation of useConnector for Vitest browser tests.
 *
 * This provides a fully functional mock that can be used with vi.mock()
 * to test components that depend on the connector without needing an HTTP server.
 */

import { ref, computed, readonly, type Ref, type ComputedRef } from 'vue'
import {
  MockConnectorStateManager,
  createMockConnectorState,
  DEFAULT_MOCK_CONFIG,
} from './mock-connector-state'
import type {
  MockConnectorConfig,
  NewOperationInput,
  PendingOperation,
  OrgRole,
  AccessLevel,
} from './mock-connector-types'

export interface MockConnectorComposable {
  // State
  state: Readonly<
    Ref<{
      connected: boolean
      connecting: boolean
      npmUser: string | null
      avatar: string | null
      operations: PendingOperation[]
      error: string | null
      lastExecutionTime: number | null
    }>
  >

  // Computed - connection
  isConnected: ComputedRef<boolean>
  isConnecting: ComputedRef<boolean>
  npmUser: ComputedRef<string | null>
  avatar: ComputedRef<string | null>
  error: ComputedRef<string | null>
  lastExecutionTime: ComputedRef<number | null>

  // Computed - operations
  operations: ComputedRef<PendingOperation[]>
  pendingOperations: ComputedRef<PendingOperation[]>
  approvedOperations: ComputedRef<PendingOperation[]>
  completedOperations: ComputedRef<PendingOperation[]>
  activeOperations: ComputedRef<PendingOperation[]>
  hasOperations: ComputedRef<boolean>
  hasPendingOperations: ComputedRef<boolean>
  hasApprovedOperations: ComputedRef<boolean>
  hasActiveOperations: ComputedRef<boolean>
  hasCompletedOperations: ComputedRef<boolean>

  // Actions - connection
  connect: (token: string, port?: number) => Promise<boolean>
  reconnect: () => Promise<boolean>
  disconnect: () => void
  refreshState: () => Promise<void>

  // Actions - operations
  addOperation: (operation: NewOperationInput) => Promise<PendingOperation | null>
  addOperations: (operations: NewOperationInput[]) => Promise<PendingOperation[]>
  removeOperation: (id: string) => Promise<boolean>
  clearOperations: () => Promise<number>
  approveOperation: (id: string) => Promise<boolean>
  retryOperation: (id: string) => Promise<boolean>
  approveAll: () => Promise<number>
  executeOperations: (otp?: string) => Promise<{ success: boolean; otpRequired?: boolean }>

  // Actions - data fetching
  listOrgUsers: (org: string) => Promise<Record<string, OrgRole> | null>
  listOrgTeams: (org: string) => Promise<string[] | null>
  listTeamUsers: (scopeTeam: string) => Promise<string[] | null>
  listPackageCollaborators: (pkg: string) => Promise<Record<string, AccessLevel> | null>
  listUserPackages: () => Promise<Record<string, AccessLevel> | null>
  listUserOrgs: () => Promise<string[] | null>
}

export interface MockConnectorTestControls {
  /** The underlying state manager for direct manipulation */
  stateManager: MockConnectorStateManager

  /** Set org data directly */
  setOrgData: (
    org: string,
    data: {
      users?: Record<string, OrgRole>
      teams?: string[]
      teamMembers?: Record<string, string[]>
    },
  ) => void

  /** Set user orgs directly */
  setUserOrgs: (orgs: string[]) => void

  /** Set user packages directly */
  setUserPackages: (packages: Record<string, AccessLevel>) => void

  /** Set package data directly */
  setPackageData: (pkg: string, data: { collaborators?: Record<string, AccessLevel> }) => void

  /** Reset all state */
  reset: () => void

  /** Simulate a connection (for testing connected state) */
  simulateConnect: () => void

  /** Simulate a disconnection */
  simulateDisconnect: () => void

  /** Simulate an error */
  simulateError: (message: string) => void

  /** Clear error */
  clearError: () => void
}

/**
 * Creates a mock useConnector composable for testing.
 *
 * Returns both the composable (to be used by components) and
 * test controls (for setting up test scenarios).
 */
export function createMockConnectorComposable(config: MockConnectorConfig = DEFAULT_MOCK_CONFIG): {
  composable: () => MockConnectorComposable
  controls: MockConnectorTestControls
} {
  const stateManager = new MockConnectorStateManager(createMockConnectorState(config))

  // Reactive state that mirrors the real composable
  const state = ref({
    connected: false,
    connecting: false,
    npmUser: null as string | null,
    avatar: null as string | null,
    operations: [] as PendingOperation[],
    error: null as string | null,
    lastExecutionTime: null as number | null,
  })

  // Helper to sync state from the state manager
  const syncState = () => {
    state.value = {
      ...state.value,
      connected: stateManager.isConnected(),
      npmUser: stateManager.isConnected() ? stateManager.config.npmUser : null,
      avatar: stateManager.isConnected() ? (stateManager.config.avatar ?? null) : null,
      operations: [...stateManager.getOperations()],
    }
  }

  // The composable function that components will use
  const composable = (): MockConnectorComposable => {
    // Computed helpers for operations
    const pendingOperations = computed(() =>
      state.value.operations.filter(op => op.status === 'pending'),
    )
    const approvedOperations = computed(() =>
      state.value.operations.filter(op => op.status === 'approved'),
    )
    const completedOperations = computed(() =>
      state.value.operations.filter(
        op => op.status === 'completed' || (op.status === 'failed' && !op.result?.requiresOtp),
      ),
    )
    const activeOperations = computed(() =>
      state.value.operations.filter(
        op =>
          op.status === 'pending' ||
          op.status === 'approved' ||
          op.status === 'running' ||
          (op.status === 'failed' && op.result?.requiresOtp),
      ),
    )

    return {
      // State - cast to satisfy the interface while keeping the readonly wrapper
      state: readonly(state) as unknown as MockConnectorComposable['state'],

      // Computed - connection
      isConnected: computed(() => state.value.connected),
      isConnecting: computed(() => state.value.connecting),
      npmUser: computed(() => state.value.npmUser),
      avatar: computed(() => state.value.avatar),
      error: computed(() => state.value.error),
      lastExecutionTime: computed(() => state.value.lastExecutionTime),

      // Computed - operations
      operations: computed(() => state.value.operations),
      pendingOperations,
      approvedOperations,
      completedOperations,
      activeOperations,
      hasOperations: computed(() => state.value.operations.length > 0),
      hasPendingOperations: computed(() => pendingOperations.value.length > 0),
      hasApprovedOperations: computed(() => approvedOperations.value.length > 0),
      hasActiveOperations: computed(() => activeOperations.value.length > 0),
      hasCompletedOperations: computed(() => completedOperations.value.length > 0),

      // Actions - connection
      async connect(token: string, _port?: number): Promise<boolean> {
        state.value.connecting = true
        state.value.error = null

        // Simulate async delay
        await new Promise(resolve => setTimeout(resolve, 10))

        const success = stateManager.connect(token)
        if (success) {
          syncState()
        } else {
          state.value.error = 'Invalid token'
        }

        state.value.connecting = false
        return success
      },

      async reconnect(): Promise<boolean> {
        if (!stateManager.isConnected()) return false
        return true
      },

      disconnect(): void {
        stateManager.disconnect()
        syncState()
        state.value.error = null
      },

      async refreshState(): Promise<void> {
        syncState()
      },

      // Actions - operations
      async addOperation(operation: NewOperationInput): Promise<PendingOperation | null> {
        if (!stateManager.isConnected()) return null
        const op = stateManager.addOperation(operation)
        syncState()
        return op
      },

      async addOperations(operations: NewOperationInput[]): Promise<PendingOperation[]> {
        if (!stateManager.isConnected()) return []
        const ops = stateManager.addOperations(operations)
        syncState()
        return ops
      },

      async removeOperation(id: string): Promise<boolean> {
        if (!stateManager.isConnected()) return false
        const success = stateManager.removeOperation(id)
        syncState()
        return success
      },

      async clearOperations(): Promise<number> {
        if (!stateManager.isConnected()) return 0
        const count = stateManager.clearOperations()
        syncState()
        return count
      },

      async approveOperation(id: string): Promise<boolean> {
        if (!stateManager.isConnected()) return false
        const op = stateManager.approveOperation(id)
        syncState()
        return op !== null
      },

      async retryOperation(id: string): Promise<boolean> {
        if (!stateManager.isConnected()) return false
        const op = stateManager.retryOperation(id)
        syncState()
        return op !== null
      },

      async approveAll(): Promise<number> {
        if (!stateManager.isConnected()) return 0
        const count = stateManager.approveAll()
        syncState()
        return count
      },

      async executeOperations(otp?: string): Promise<{ success: boolean; otpRequired?: boolean }> {
        if (!stateManager.isConnected()) return { success: false }
        const result = stateManager.executeOperations({ otp })
        syncState()
        state.value.lastExecutionTime = Date.now()
        return {
          success: true,
          otpRequired: result.otpRequired,
        }
      },

      // Actions - data fetching
      async listOrgUsers(org: string): Promise<Record<string, OrgRole> | null> {
        if (!stateManager.isConnected()) return null
        return stateManager.getOrgUsers(org)
      },

      async listOrgTeams(org: string): Promise<string[] | null> {
        if (!stateManager.isConnected()) return null
        return stateManager.getOrgTeams(org)
      },

      async listTeamUsers(scopeTeam: string): Promise<string[] | null> {
        if (!stateManager.isConnected()) return null
        const [scope, team] = scopeTeam.split(':')
        if (!scope || !team) return null
        return stateManager.getTeamUsers(scope, team)
      },

      async listPackageCollaborators(pkg: string): Promise<Record<string, AccessLevel> | null> {
        if (!stateManager.isConnected()) return null
        return stateManager.getPackageCollaborators(pkg)
      },

      async listUserPackages(): Promise<Record<string, AccessLevel> | null> {
        if (!stateManager.isConnected()) return null
        return stateManager.getUserPackages()
      },

      async listUserOrgs(): Promise<string[] | null> {
        if (!stateManager.isConnected()) return null
        return stateManager.getUserOrgs()
      },
    }
  }

  // Test controls for setting up scenarios
  const controls: MockConnectorTestControls = {
    stateManager,

    setOrgData(org, data) {
      stateManager.setOrgData(org, data)
    },

    setUserOrgs(orgs) {
      stateManager.setUserOrgs(orgs)
    },

    setUserPackages(packages) {
      stateManager.setUserPackages(packages)
    },

    setPackageData(pkg, data) {
      stateManager.setPackageData(pkg, { collaborators: data.collaborators ?? {} })
    },

    reset() {
      stateManager.reset()
      state.value = {
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
      stateManager.connect(config.token)
      syncState()
    },

    simulateDisconnect() {
      stateManager.disconnect()
      syncState()
    },

    simulateError(message: string) {
      state.value.error = message
    },

    clearError() {
      state.value.error = null
    },
  }

  return { composable, controls }
}

// Export types
export type { MockConnectorConfig, PendingOperation, OrgRole, AccessLevel }
