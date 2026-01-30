/**
 * Shared test utilities for mock connector testing.
 *
 * These utilities can be used by both:
 * - Playwright E2E tests (via HTTP server)
 * - Vitest browser tests (via composable mock)
 */

// Types
export * from './mock-connector-types'

// State management (used by both HTTP server and composable mock)
export {
  MockConnectorStateManager,
  createMockConnectorState,
  DEFAULT_MOCK_CONFIG,
} from './mock-connector-state'

// Composable mock (for Vitest browser tests)
export {
  createMockConnectorComposable,
  type MockConnectorComposable,
  type MockConnectorTestControls,
} from './mock-connector-composable'
