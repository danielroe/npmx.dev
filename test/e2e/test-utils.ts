import { test as base } from '@nuxt/test-utils/playwright'
import type { Page, Route } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const FIXTURES_DIR = join(process.cwd(), 'test/fixtures')

/**
 * Read a fixture file from disk
 */
function readFixture(relativePath: string): unknown | null {
  const fullPath = join(FIXTURES_DIR, relativePath)
  if (!existsSync(fullPath)) {
    return null
  }
  try {
    return JSON.parse(readFileSync(fullPath, 'utf-8'))
  } catch {
    return null
  }
}

/**
 * Convert a package name to a fixture file path
 */
function packageToFixturePath(packageName: string): string {
  // Scoped packages: @scope/name -> @scope/name.json (in subdirectory)
  if (packageName.startsWith('@')) {
    const [scope, name] = packageName.slice(1).split('/')
    return `npm-registry/packuments/@${scope}/${name}.json`
  }
  return `npm-registry/packuments/${packageName}.json`
}

/**
 * Handle npm registry requests (registry.npmjs.org)
 */
async function handleNpmRegistry(route: Route): Promise<boolean> {
  const url = new URL(route.request().url())
  const pathname = decodeURIComponent(url.pathname)

  // Search endpoint: /-/v1/search?text=query
  if (pathname === '/-/v1/search') {
    const query = url.searchParams.get('text')
    if (query) {
      // Check for maintainer search (user lookup)
      const maintainerMatch = query.match(/^maintainer:(.+)$/)
      if (maintainerMatch?.[1]) {
        const fixture = readFixture(`users/${maintainerMatch[1]}.json`)
        if (fixture) {
          await route.fulfill({ json: fixture })
          return true
        }
        // Return empty results for unknown users
        await route.fulfill({
          json: { objects: [], total: 0, time: new Date().toISOString() },
        })
        return true
      }

      // Regular search
      const searchName = query.replace(/:/g, '-')
      const fixture = readFixture(`npm-registry/search/${searchName}.json`)
      if (fixture) {
        await route.fulfill({ json: fixture })
        return true
      }

      // Return empty results for searches without fixtures
      await route.fulfill({
        json: { objects: [], total: 0, time: new Date().toISOString() },
      })
      return true
    }
  }

  // Org packages: /-/org/{orgname}/package
  const orgMatch = pathname.match(/^\/-\/org\/([^/]+)\/package$/)
  if (orgMatch?.[1]) {
    const fixture = readFixture(`npm-registry/orgs/${orgMatch[1]}.json`)
    if (fixture) {
      await route.fulfill({ json: fixture })
      return true
    }
  }

  // Packument: /{package} or /{package}/{version}
  if (!pathname.startsWith('/-/')) {
    let packageName = pathname.slice(1)

    // Strip version if present
    if (packageName.startsWith('@')) {
      const parts = packageName.split('/')
      if (parts.length > 2) {
        packageName = `${parts[0]}/${parts[1]}`
      }
    } else {
      const slashIndex = packageName.indexOf('/')
      if (slashIndex !== -1) {
        packageName = packageName.slice(0, slashIndex)
      }
    }

    const fixturePath = packageToFixturePath(packageName)
    const fixture = readFixture(fixturePath)
    if (fixture) {
      await route.fulfill({ json: fixture })
      return true
    }

    // Return 404 for unknown packages
    await route.fulfill({
      status: 404,
      json: { error: 'Not found' },
    })
    return true
  }

  return false
}

/**
 * Handle npm API requests (api.npmjs.org)
 */
async function handleNpmApi(route: Route): Promise<boolean> {
  const url = new URL(route.request().url())
  const pathname = decodeURIComponent(url.pathname)

  // Downloads point: /downloads/point/{period}/{package}
  const pointMatch = pathname.match(/^\/downloads\/point\/[^/]+\/(.+)$/)
  if (pointMatch?.[1]) {
    const packageName = pointMatch[1]
    const fixturePath = `npm-api/downloads/${packageName}.json`
    const fixture = readFixture(fixturePath)
    if (fixture) {
      await route.fulfill({ json: fixture })
      return true
    }
    // Return zero downloads for unknown packages
    await route.fulfill({
      json: { downloads: 0, start: '2025-01-01', end: '2025-01-31', package: packageName },
    })
    return true
  }

  // Downloads range: /downloads/range/{period}/{package}
  // This is used for download charts - return empty data
  const rangeMatch = pathname.match(/^\/downloads\/range\/[^/]+\/(.+)$/)
  if (rangeMatch?.[1]) {
    const packageName = rangeMatch[1]
    // Return empty downloads array for range requests
    await route.fulfill({
      json: { downloads: [], start: '2025-01-01', end: '2025-01-31', package: packageName },
    })
    return true
  }

  return false
}

/**
 * Handle OSV API requests (api.osv.dev)
 */
async function handleOsvApi(route: Route): Promise<boolean> {
  const url = new URL(route.request().url())

  if (url.pathname === '/v1/querybatch') {
    await route.fulfill({ json: { results: [] } })
    return true
  }

  if (url.pathname.startsWith('/v1/query')) {
    await route.fulfill({ json: { vulns: [] } })
    return true
  }

  return false
}

/**
 * Handle fast-npm-meta requests (npm.antfu.dev)
 */
async function handleFastNpmMeta(route: Route): Promise<boolean> {
  const url = new URL(route.request().url())
  let packageName = decodeURIComponent(url.pathname.slice(1))

  if (!packageName) return false

  // Handle @version syntax (vue@3.4.0, @nuxt/kit@3.0.0)
  let specifier = 'latest'
  if (packageName.startsWith('@')) {
    const atIndex = packageName.indexOf('@', 1)
    if (atIndex !== -1) {
      specifier = packageName.slice(atIndex + 1)
      packageName = packageName.slice(0, atIndex)
    }
  } else {
    const atIndex = packageName.indexOf('@')
    if (atIndex !== -1) {
      specifier = packageName.slice(atIndex + 1)
      packageName = packageName.slice(0, atIndex)
    }
  }

  const fixturePath = packageToFixturePath(packageName)
  const packument = readFixture(fixturePath) as Record<string, unknown> | null

  if (!packument) return false

  const distTags = packument['dist-tags'] as Record<string, string> | undefined
  const versions = packument.versions as Record<string, unknown> | undefined
  const time = packument.time as Record<string, string> | undefined

  let version: string | undefined
  if (specifier === 'latest' || !specifier) {
    version = distTags?.latest
  } else if (distTags?.[specifier]) {
    version = distTags[specifier]
  } else if (versions?.[specifier]) {
    version = specifier
  } else {
    version = distTags?.latest
  }

  if (!version) return false

  await route.fulfill({
    json: {
      name: packageName,
      specifier,
      version,
      publishedAt: time?.[version] || new Date().toISOString(),
      lastSynced: Date.now(),
    },
  })
  return true
}

/**
 * Handle JSR registry requests (jsr.io)
 */
async function handleJsrRegistry(route: Route): Promise<boolean> {
  const url = new URL(route.request().url())

  if (url.pathname.endsWith('/meta.json')) {
    // Most npm packages aren't on JSR, return null
    await route.fulfill({ json: null })
    return true
  }

  return false
}

/**
 * Setup route mocking for a page
 */
async function setupRouteMocking(page: Page): Promise<void> {
  // Mock npm registry (registry.npmjs.org)
  await page.route('https://registry.npmjs.org/**', async route => {
    const handled = await handleNpmRegistry(route)
    if (!handled) {
      // Log unhandled requests for debugging
      console.warn(`[mock] Unhandled npm registry request: ${route.request().url()}`)
      await route.continue()
    }
  })

  // Mock npm API (api.npmjs.org)
  await page.route('https://api.npmjs.org/**', async route => {
    const handled = await handleNpmApi(route)
    if (!handled) {
      console.warn(`[mock] Unhandled npm API request: ${route.request().url()}`)
      await route.continue()
    }
  })

  // Mock OSV API (api.osv.dev)
  await page.route('https://api.osv.dev/**', async route => {
    const handled = await handleOsvApi(route)
    if (!handled) {
      await route.continue()
    }
  })

  // Mock fast-npm-meta (npm.antfu.dev)
  await page.route('https://npm.antfu.dev/**', async route => {
    const handled = await handleFastNpmMeta(route)
    if (!handled) {
      console.warn(`[mock] Unhandled fast-npm-meta request: ${route.request().url()}`)
      await route.continue()
    }
  })

  // Mock JSR registry (jsr.io)
  await page.route('https://jsr.io/**', async route => {
    const handled = await handleJsrRegistry(route)
    if (!handled) {
      await route.continue()
    }
  })
}

/**
 * Extended test fixture with external API mocking
 */
export const test = base.extend<{ mockExternalApis: void }>({
  mockExternalApis: [
    async ({ page }, use) => {
      await setupRouteMocking(page)
      await use()
    },
    { auto: true }, // Automatically use this fixture for all tests
  ],
})

export { expect } from '@nuxt/test-utils/playwright'
