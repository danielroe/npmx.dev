/**
 * This test ensures all Vue components in app/components/ have accessibility tests.
 *
 * When this test fails, it means a new component was added without corresponding
 * accessibility tests in test/nuxt/a11y.spec.ts.
 *
 * To fix:
 * 1. Add the component import to test/nuxt/a11y.spec.ts
 * 2. Add a describe block with at least one axe accessibility test for the component
 */
import fs from 'node:fs'
import path from 'node:path'
import { assert, describe, it } from 'vitest'
import { fileURLToPath } from 'node:url'

/**
 * Components explicitly skipped from a11y testing with reasons.
 * Add components here only with a valid justification.
 *
 * Note: Tests in test/nuxt/a11y.spec.ts run in a real browser environment,
 * so client components can be tested directly. When importing `SomeComponent`
 * from #components, it counts as testing `SomeComponent.client.vue` if it exists.
 */
const SKIPPED_COMPONENTS: Record<string, string> = {
  // OgImage components are server-side rendered images, not interactive UI
  'OgImage/Default.vue': 'OG Image component - server-rendered image, not interactive UI',
  'OgImage/Package.vue': 'OG Image component - server-rendered image, not interactive UI',

  // Client-only components with complex dependencies
  'AuthButton.client.vue':
    'Client component with AuthModal dependency - AuthButton.server.vue tested',
  'AuthModal.client.vue': 'Complex auth modal with navigation - requires full app context',

  // Complex components requiring full app context or specific runtime conditions
  'HeaderOrgsDropdown.vue': 'Requires connector context and API calls',
  'HeaderPackagesDropdown.vue': 'Requires connector context and API calls',
  'MobileMenu.vue': 'Requires Teleport and full navigation context',
  'Modal.client.vue':
    'Base modal component - tested via specific modals like ChartModal, ConnectorModal',
  'PackageSkillsModal.vue': 'Complex modal with tabs - requires modal context and state',
  'ScrollToTop.vue': 'Requires scroll position and CSS scroll-state queries',
  'TranslationHelper.vue': 'i18n helper component - requires specific locale status data',
  'PackageWeeklyDownloadStats.vue':
    'Uses vue-data-ui VueUiSparkline - has DOM measurement issues in test environment',
}

/**
 * Recursively get all Vue component files in a directory.
 */
function getVueFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...getVueFiles(fullPath, baseDir))
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      // Get relative path from base components directory
      files.push(path.relative(baseDir, fullPath))
    }
  }

  return files
}

/**
 * Extract tested component names from the test file.
 * Handles both #components imports and direct ~/components/ imports.
 */
function getTestedComponents(testFileContent: string): Set<string> {
  const tested = new Set<string>()

  // Match direct imports like:
  // import ComponentName from '~/components/ComponentName.vue'
  // import ComponentName from '~/components/subdir/ComponentName.vue'
  const directImportRegex = /import\s+\w+\s+from\s+['"]~\/components\/(.+\.vue)['"]/g
  let match

  while ((match = directImportRegex.exec(testFileContent)) !== null) {
    tested.add(match[1]!)
  }

  // Match #components imports like:
  // import { ComponentName, OtherComponent } from '#components'
  const hashComponentsRegex = /import\s*\{([^}]+)\}\s*from\s*['"]#components['"]/g
  while ((match = hashComponentsRegex.exec(testFileContent)) !== null) {
    const importList = match[1]!
    // Parse the import list, handling multi-line imports
    const componentNames = importList
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0)

    for (const name of componentNames) {
      // Map #components name to file path(s)
      const filePaths = mapComponentNameToFiles(name)
      for (const filePath of filePaths) {
        tested.add(filePath)
      }
    }
  }

  return tested
}

/**
 * Map a #components export name to the actual file path(s).
 * Handles various naming conventions.
 *
 * Returns an array because importing from #components can cover multiple files:
 * - `HeaderAccountMenu` from #components -> tests HeaderAccountMenu.client.vue
 *   (Nuxt auto-resolves to client variant when both .server and .client exist)
 */
function mapComponentNameToFiles(name: string): string[] {
  // Handle Compare* prefix -> compare/ subdirectory
  if (name.startsWith('Compare')) {
    const baseName = name.slice('Compare'.length)
    return [`compare/${baseName}.vue`]
  }

  // Regular component - could be .vue or .client.vue
  // When importing from #components, Nuxt resolves to the client variant if it exists
  return [`${name}.vue`, `${name}.client.vue`]
}

describe('a11y component test coverage', () => {
  const componentsDir = fileURLToPath(new URL('../../app/components', import.meta.url))
  const testFilePath = fileURLToPath(new URL('../nuxt/a11y.spec.ts', import.meta.url))

  it('should have accessibility tests for all components (or be explicitly skipped)', () => {
    // Get all Vue components
    const allComponents = getVueFiles(componentsDir)

    // Get components that are tested
    const testFileContent = fs.readFileSync(testFilePath, 'utf-8')
    const testedComponents = getTestedComponents(testFileContent)

    // Find components that are neither tested nor skipped
    const missingTests = allComponents.filter(
      component => !testedComponents.has(component) && !SKIPPED_COMPONENTS[component],
    )

    // Fail with helpful message if any components are missing tests
    assert.strictEqual(missingTests.length, 0, buildMissingTestsMessage(missingTests))
  })

  it('should not have obsolete entries in SKIPPED_COMPONENTS', () => {
    const allComponents = getVueFiles(componentsDir)
    const componentSet = new Set(allComponents)

    const obsoleteSkips = Object.keys(SKIPPED_COMPONENTS).filter(
      component => !componentSet.has(component),
    )

    assert.strictEqual(obsoleteSkips.length, 0, buildObsoleteSkipsMessage(obsoleteSkips))
  })

  it('should not skip components that are actually tested', () => {
    const testFileContent = fs.readFileSync(testFilePath, 'utf-8')
    const testedComponents = getTestedComponents(testFileContent)

    const unnecessarySkips = Object.keys(SKIPPED_COMPONENTS).filter(component =>
      testedComponents.has(component),
    )

    assert.strictEqual(unnecessarySkips.length, 0, buildUnnecessarySkipsMessage(unnecessarySkips))
  })
})

function buildMissingTestsMessage(missingTests: string[]): string {
  if (missingTests.length === 0) return ''
  return (
    `Missing a11y tests for ${missingTests.length} component(s):\n` +
    missingTests.map(c => `  - ${c}`).join('\n') +
    '\n\nTo fix: Add tests in test/nuxt/a11y.spec.ts or add to SKIPPED_COMPONENTS ' +
    'in test/unit/a11y-component-coverage.spec.ts with justification.'
  )
}

function buildObsoleteSkipsMessage(obsoleteSkips: string[]): string {
  if (obsoleteSkips.length === 0) return ''
  return (
    `Obsolete SKIPPED_COMPONENTS entries:\n` +
    obsoleteSkips.map(c => `  - ${c}`).join('\n') +
    '\n\nThese components no longer exist. Remove them from SKIPPED_COMPONENTS.'
  )
}

function buildUnnecessarySkipsMessage(unnecessarySkips: string[]): string {
  if (unnecessarySkips.length === 0) return ''
  return (
    `Unnecessary SKIPPED_COMPONENTS entries:\n` +
    unnecessarySkips.map(c => `  - ${c}`).join('\n') +
    '\n\nThese components have tests now. Remove them from SKIPPED_COMPONENTS.'
  )
}
