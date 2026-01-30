/**
 * Shared types for the mock connector used in both E2E and unit tests.
 */

import type { PendingOperation, OperationType, OperationResult } from '../../cli/src/types'

export type OrgRole = 'developer' | 'admin' | 'owner'
export type AccessLevel = 'read-only' | 'read-write'

export interface MockConnectorConfig {
  /** The token required for authentication */
  token: string
  /** The simulated npm username */
  npmUser: string
  /** Optional avatar (base64 data URL) */
  avatar?: string | null
  /** Port to run the mock server on (default: 31415) */
  port?: number
}

export interface MockOrgData {
  /** Members and their roles */
  users: Record<string, OrgRole>
  /** Team names */
  teams: string[]
  /** Team memberships: team name -> list of usernames */
  teamMembers: Record<string, string[]>
}

export interface MockPackageData {
  /** Collaborators and their access levels */
  collaborators: Record<string, AccessLevel>
}

export interface MockConnectorStateData {
  // Configuration
  config: MockConnectorConfig

  // Session state
  connected: boolean
  connectedAt: number | null

  // Mock data
  orgs: Record<string, MockOrgData>
  packages: Record<string, MockPackageData>
  userPackages: Record<string, AccessLevel>
  userOrgs: string[]

  // Operations queue
  operations: PendingOperation[]
  operationIdCounter: number
}

export interface NewOperationInput {
  type: OperationType
  params: Record<string, string>
  description: string
  command: string
  dependsOn?: string
}

export interface ExecuteOptions {
  otp?: string
  /** Map of operation IDs to their results (for testing failures) */
  results?: Record<string, Partial<OperationResult>>
}

export interface ExecuteResult {
  results: OperationResult[]
  otpRequired?: boolean
}

/** Re-export types for convenience */
export type { PendingOperation, OperationType, OperationResult }
