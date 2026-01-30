/**
 * Core state management for the mock connector.
 * This can be used by both the HTTP server (E2E tests) and
 * the composable mock (Vitest browser tests).
 */

import type {
  MockConnectorConfig,
  MockConnectorStateData,
  MockOrgData,
  MockPackageData,
  NewOperationInput,
  ExecuteOptions,
  ExecuteResult,
  OrgRole,
  AccessLevel,
  PendingOperation,
  OperationResult,
} from './mock-connector-types'

/**
 * Creates a new mock connector state with default values.
 */
export function createMockConnectorState(config: MockConnectorConfig): MockConnectorStateData {
  return {
    config: {
      port: 31415,
      avatar: null,
      ...config,
    },
    connected: false,
    connectedAt: null,
    orgs: {},
    packages: {},
    userPackages: {},
    userOrgs: [],
    operations: [],
    operationIdCounter: 0,
  }
}

/**
 * State manipulation class for the mock connector.
 * This is the core logic shared between HTTP server and composable mock.
 */
export class MockConnectorStateManager {
  public state: MockConnectorStateData

  constructor(initialState: MockConnectorStateData) {
    this.state = initialState
  }

  // ============ Configuration ============

  get config(): MockConnectorConfig {
    return this.state.config
  }

  get token(): string {
    return this.state.config.token
  }

  get port(): number {
    return this.state.config.port ?? 31415
  }

  // ============ Connection ============

  connect(token: string): boolean {
    if (token !== this.state.config.token) {
      return false
    }
    this.state.connected = true
    this.state.connectedAt = Date.now()
    return true
  }

  disconnect(): void {
    this.state.connected = false
    this.state.connectedAt = null
    this.state.operations = []
  }

  isConnected(): boolean {
    return this.state.connected
  }

  // ============ Org Data ============

  setOrgData(org: string, data: Partial<MockOrgData>): void {
    const existing = this.state.orgs[org] ?? { users: {}, teams: [], teamMembers: {} }
    this.state.orgs[org] = {
      users: { ...existing.users, ...data.users },
      teams: data.teams ?? existing.teams,
      teamMembers: { ...existing.teamMembers, ...data.teamMembers },
    }
  }

  getOrgUsers(org: string): Record<string, OrgRole> | null {
    // Normalize: handle with or without @ prefix
    const normalizedOrg = org.startsWith('@') ? org : `@${org}`
    return this.state.orgs[normalizedOrg]?.users ?? null
  }

  getOrgTeams(org: string): string[] | null {
    const normalizedOrg = org.startsWith('@') ? org : `@${org}`
    return this.state.orgs[normalizedOrg]?.teams ?? null
  }

  getTeamUsers(scope: string, team: string): string[] | null {
    // scope should be like "@org" or "org"
    const normalizedScope = scope.startsWith('@') ? scope : `@${scope}`
    const org = this.state.orgs[normalizedScope]
    if (!org) return null
    return org.teamMembers[team] ?? null
  }

  // ============ Package Data ============

  setPackageData(pkg: string, data: MockPackageData): void {
    this.state.packages[pkg] = data
  }

  getPackageCollaborators(pkg: string): Record<string, AccessLevel> | null {
    return this.state.packages[pkg]?.collaborators ?? null
  }

  // ============ User Data ============

  setUserPackages(packages: Record<string, AccessLevel>): void {
    this.state.userPackages = packages
  }

  setUserOrgs(orgs: string[]): void {
    this.state.userOrgs = orgs
  }

  getUserPackages(): Record<string, AccessLevel> {
    return this.state.userPackages
  }

  getUserOrgs(): string[] {
    return this.state.userOrgs
  }

  // ============ Operations Queue ============

  addOperation(operation: NewOperationInput): PendingOperation {
    const id = `op-${++this.state.operationIdCounter}`
    const newOp: PendingOperation = {
      id,
      type: operation.type,
      params: operation.params,
      description: operation.description,
      command: operation.command,
      status: 'pending',
      createdAt: Date.now(),
      dependsOn: operation.dependsOn,
    }
    this.state.operations.push(newOp)
    return newOp
  }

  addOperations(operations: NewOperationInput[]): PendingOperation[] {
    return operations.map(op => this.addOperation(op))
  }

  getOperation(id: string): PendingOperation | undefined {
    return this.state.operations.find(op => op.id === id)
  }

  getOperations(): PendingOperation[] {
    return this.state.operations
  }

  removeOperation(id: string): boolean {
    const index = this.state.operations.findIndex(op => op.id === id)
    if (index === -1) return false
    const op = this.state.operations[index]
    // Can't remove running operations
    if (op?.status === 'running') return false
    this.state.operations.splice(index, 1)
    return true
  }

  clearOperations(): number {
    const removable = this.state.operations.filter(op => op.status !== 'running')
    const count = removable.length
    this.state.operations = this.state.operations.filter(op => op.status === 'running')
    return count
  }

  approveOperation(id: string): PendingOperation | null {
    const op = this.state.operations.find(op => op.id === id)
    if (!op || op.status !== 'pending') return null
    op.status = 'approved'
    return op
  }

  approveAll(): number {
    let count = 0
    for (const op of this.state.operations) {
      if (op.status === 'pending') {
        op.status = 'approved'
        count++
      }
    }
    return count
  }

  retryOperation(id: string): PendingOperation | null {
    const op = this.state.operations.find(op => op.id === id)
    if (!op || op.status !== 'failed') return null
    op.status = 'approved'
    op.result = undefined
    return op
  }

  /**
   * Executes all approved operations.
   * In the mock, this transitions them to completed status.
   */
  executeOperations(options?: ExecuteOptions): ExecuteResult {
    const results: OperationResult[] = []
    const approved = this.state.operations.filter(op => op.status === 'approved')

    // Sort by dependencies
    const sorted = this.sortByDependencies(approved)

    for (const op of sorted) {
      // Check if dependent operation completed successfully
      if (op.dependsOn) {
        const dep = this.state.operations.find(d => d.id === op.dependsOn)
        if (!dep || dep.status !== 'completed') {
          // Skip - dependency not met
          continue
        }
      }

      op.status = 'running'

      // Check for configured result
      const configuredResult = options?.results?.[op.id]
      if (configuredResult) {
        const result: OperationResult = {
          stdout: configuredResult.stdout ?? '',
          stderr: configuredResult.stderr ?? '',
          exitCode: configuredResult.exitCode ?? 1,
          requiresOtp: configuredResult.requiresOtp,
          authFailure: configuredResult.authFailure,
        }
        op.result = result
        op.status = result.exitCode === 0 ? 'completed' : 'failed'
        results.push(result)

        if (result.requiresOtp && !options?.otp) {
          return { results, otpRequired: true }
        }
      } else {
        // Default: success
        const result: OperationResult = {
          stdout: `Mock: ${op.command}`,
          stderr: '',
          exitCode: 0,
        }
        op.result = result
        op.status = 'completed'
        results.push(result)

        // Apply the operation's effects to mock state
        this.applyOperationEffect(op)
      }
    }

    return { results }
  }

  /**
   * Applies the side effects of a successful operation to the mock state.
   */
  private applyOperationEffect(op: PendingOperation): void {
    const { type, params } = op

    switch (type) {
      case 'org:add-user': {
        const org = params['org']
        const user = params['user']
        const role = (params['role'] as OrgRole) ?? 'developer'
        if (org && user) {
          const normalizedOrg = org.startsWith('@') ? org : `@${org}`
          if (!this.state.orgs[normalizedOrg]) {
            this.state.orgs[normalizedOrg] = { users: {}, teams: [], teamMembers: {} }
          }
          this.state.orgs[normalizedOrg].users[user] = role
        }
        break
      }
      case 'org:rm-user': {
        const org = params['org']
        const user = params['user']
        if (org && user) {
          const normalizedOrg = org.startsWith('@') ? org : `@${org}`
          if (this.state.orgs[normalizedOrg]) {
            delete this.state.orgs[normalizedOrg].users[user]
          }
        }
        break
      }
      case 'org:set-role': {
        const org = params['org']
        const user = params['user']
        const role = params['role'] as OrgRole
        if (org && user && role) {
          const normalizedOrg = org.startsWith('@') ? org : `@${org}`
          if (this.state.orgs[normalizedOrg]) {
            this.state.orgs[normalizedOrg].users[user] = role
          }
        }
        break
      }
      case 'team:create': {
        const org = params['org']
        const team = params['team']
        if (org && team) {
          const normalizedOrg = org.startsWith('@') ? org : `@${org}`
          if (!this.state.orgs[normalizedOrg]) {
            this.state.orgs[normalizedOrg] = { users: {}, teams: [], teamMembers: {} }
          }
          if (!this.state.orgs[normalizedOrg].teams.includes(team)) {
            this.state.orgs[normalizedOrg].teams.push(team)
          }
          this.state.orgs[normalizedOrg].teamMembers[team] = []
        }
        break
      }
      case 'team:destroy': {
        const org = params['org']
        const team = params['team']
        if (org && team) {
          const normalizedOrg = org.startsWith('@') ? org : `@${org}`
          if (this.state.orgs[normalizedOrg]) {
            this.state.orgs[normalizedOrg].teams = this.state.orgs[normalizedOrg].teams.filter(
              t => t !== team,
            )
            delete this.state.orgs[normalizedOrg].teamMembers[team]
          }
        }
        break
      }
      case 'team:add-user': {
        const scopeTeam = params['scopeTeam']
        const user = params['user']
        if (scopeTeam && user) {
          const [scope, team] = scopeTeam.split(':')
          if (scope && team) {
            const normalizedScope = scope.startsWith('@') ? scope : `@${scope}`
            if (this.state.orgs[normalizedScope]) {
              const members = this.state.orgs[normalizedScope].teamMembers[team] ?? []
              if (!members.includes(user)) {
                members.push(user)
              }
              this.state.orgs[normalizedScope].teamMembers[team] = members
            }
          }
        }
        break
      }
      case 'team:rm-user': {
        const scopeTeam = params['scopeTeam']
        const user = params['user']
        if (scopeTeam && user) {
          const [scope, team] = scopeTeam.split(':')
          if (scope && team) {
            const normalizedScope = scope.startsWith('@') ? scope : `@${scope}`
            if (this.state.orgs[normalizedScope]) {
              const members = this.state.orgs[normalizedScope].teamMembers[team]
              if (members) {
                this.state.orgs[normalizedScope].teamMembers[team] = members.filter(u => u !== user)
              }
            }
          }
        }
        break
      }
      case 'access:grant': {
        const pkg = params['package']
        const user = params['user']
        const level = (params['level'] as AccessLevel) ?? 'read-write'
        if (pkg && user) {
          if (!this.state.packages[pkg]) {
            this.state.packages[pkg] = { collaborators: {} }
          }
          this.state.packages[pkg].collaborators[user] = level
        }
        break
      }
      case 'access:revoke': {
        const pkg = params['package']
        const user = params['user']
        if (pkg && user && this.state.packages[pkg]) {
          delete this.state.packages[pkg].collaborators[user]
        }
        break
      }
      case 'owner:add': {
        const pkg = params['package']
        const user = params['user']
        if (pkg && user) {
          if (!this.state.packages[pkg]) {
            this.state.packages[pkg] = { collaborators: {} }
          }
          this.state.packages[pkg].collaborators[user] = 'read-write'
        }
        break
      }
      case 'owner:rm': {
        const pkg = params['package']
        const user = params['user']
        if (pkg && user && this.state.packages[pkg]) {
          delete this.state.packages[pkg].collaborators[user]
        }
        break
      }
      case 'package:init': {
        const pkg = params['package']
        if (pkg) {
          this.state.packages[pkg] = {
            collaborators: { [this.state.config.npmUser]: 'read-write' },
          }
          this.state.userPackages[pkg] = 'read-write'
        }
        break
      }
    }
  }

  /**
   * Sort operations by dependencies (topological sort).
   */
  private sortByDependencies(operations: PendingOperation[]): PendingOperation[] {
    const result: PendingOperation[] = []
    const visited = new Set<string>()

    const visit = (op: PendingOperation) => {
      if (visited.has(op.id)) return
      visited.add(op.id)

      if (op.dependsOn) {
        const dep = operations.find(d => d.id === op.dependsOn)
        if (dep) visit(dep)
      }

      result.push(op)
    }

    for (const op of operations) {
      visit(op)
    }

    return result
  }

  // ============ Reset ============

  /**
   * Resets the state to initial values while keeping the config.
   */
  reset(): void {
    this.state.connected = false
    this.state.connectedAt = null
    this.state.orgs = {}
    this.state.packages = {}
    this.state.userPackages = {}
    this.state.userOrgs = []
    this.state.operations = []
    this.state.operationIdCounter = 0
  }
}

/** Default test configuration */
export const DEFAULT_MOCK_CONFIG: MockConnectorConfig = {
  token: 'test-token-e2e-12345',
  npmUser: 'testuser',
  avatar: null,
  port: 31415,
}
