import type { Page } from '@playwright/test'
import { expect, test } from './test-utils'

const LS_USER_PREFERENCES = 'npmx-user-preferences'
const LS_LOCAL_SETTINGS = 'npmx-settings'
const LS_MIGRATION_FLAG = 'npmx-prefs-migrated'

const MIGRATABLE_KEYS = [
  'accentColorId',
  'preferredBackgroundTheme',
  'selectedLocale',
  'relativeDates',
] as const

async function injectLocalStorage(page: Page, entries: Record<string, string>) {
  await page.addInitScript((e: Record<string, string>) => {
    for (const [key, value] of Object.entries(e)) {
      localStorage.setItem(key, value)
    }
  }, entries)
}

function readLs(page: Page, key: string) {
  return page.evaluate((k: string) => localStorage.getItem(k), key)
}

function readLsJson(page: Page, key: string) {
  return page.evaluate((k: string) => {
    const raw = localStorage.getItem(k)
    return raw ? JSON.parse(raw) : null
  }, key)
}

async function verifyDefaults(page: Page) {
  const prefs = await readLsJson(page, LS_USER_PREFERENCES)
  expect(prefs.accentColorId).toBeNull()
  expect(prefs.preferredBackgroundTheme).toBeNull()
  expect(prefs.selectedLocale).toBeNull()
  expect(prefs.relativeDates).toBe(false)
}

async function verifyLegacyCleaned(page: Page) {
  const remaining = await readLsJson(page, LS_LOCAL_SETTINGS)
  for (const key of MIGRATABLE_KEYS) {
    expect(remaining).not.toHaveProperty(key)
  }
}

test.describe('Legacy settings migration', () => {
  test('migrates all legacy keys to user preferences', async ({ page, goto }) => {
    const legacy = {
      accentColorId: 'violet',
      preferredBackgroundTheme: 'slate',
      selectedLocale: 'de',
      relativeDates: true,
      // non-migratable key should remain untouched
      sidebar: { collapsed: ['deps'] },
    }

    await injectLocalStorage(page, {
      [LS_LOCAL_SETTINGS]: JSON.stringify(legacy),
    })

    await goto('/', { waitUntil: 'hydration' })

    const prefs = await readLsJson(page, LS_USER_PREFERENCES)
    expect(prefs).toMatchObject({
      accentColorId: 'violet',
      preferredBackgroundTheme: 'slate',
      selectedLocale: 'de',
      relativeDates: true,
    })

    await verifyLegacyCleaned(page)
    const localSettings = await readLsJson(page, LS_LOCAL_SETTINGS)
    expect(localSettings).toMatchObject({
      sidebar: { collapsed: ['deps'] },
    })
  })

  test('does not overwrite existing user preferences', async ({ page, goto }) => {
    await injectLocalStorage(page, {
      [LS_LOCAL_SETTINGS]: JSON.stringify({ accentColorId: 'coral', relativeDates: false }),
      [LS_USER_PREFERENCES]: JSON.stringify({ accentColorId: 'violet' }),
    })

    await goto('/', { waitUntil: 'hydration' })

    const prefs = await readLsJson(page, LS_USER_PREFERENCES)
    // accentColorId should remain 'violet' (not overwritten by legacy 'coral')
    expect(prefs.accentColorId).toBe('violet')
    // relativeDates was not in user prefs, so it should be migrated from legacy
    expect(prefs.relativeDates).toBe(false)

    await verifyLegacyCleaned(page)
  })

  test('cleans migrated keys from legacy storage', async ({ page, goto }) => {
    const legacy = {
      accentColorId: 'violet',
      preferredBackgroundTheme: 'slate',
      sidebar: { collapsed: ['deps'] },
    }

    await injectLocalStorage(page, {
      [LS_LOCAL_SETTINGS]: JSON.stringify(legacy),
    })

    await goto('/', { waitUntil: 'hydration' })

    await verifyLegacyCleaned(page)
    const remaining = await readLsJson(page, LS_LOCAL_SETTINGS)
    expect(remaining).toHaveProperty('sidebar')
  })

  test('sets migration flag after completion', async ({ page, goto }) => {
    await injectLocalStorage(page, {
      [LS_LOCAL_SETTINGS]: JSON.stringify({ accentColorId: 'violet' }),
    })

    await goto('/', { waitUntil: 'hydration' })

    const flag = await readLs(page, LS_MIGRATION_FLAG)
    expect(flag).toBe('1')
  })

  test('skips migration if flag is already set', async ({ page, goto }) => {
    await injectLocalStorage(page, {
      [LS_LOCAL_SETTINGS]: JSON.stringify({ accentColorId: 'coral' }),
      [LS_MIGRATION_FLAG]: '1',
    })

    await goto('/', { waitUntil: 'hydration' })

    // Legacy accentColorId should NOT have been migrated since flag was already set
    const prefs = await readLsJson(page, LS_USER_PREFERENCES)
    expect(prefs?.accentColorId).not.toBe('coral')
  })

  test('applies migrated accent color to DOM', async ({ page, goto }) => {
    await injectLocalStorage(page, {
      [LS_LOCAL_SETTINGS]: JSON.stringify({ accentColorId: 'violet' }),
    })

    await goto('/', { waitUntil: 'hydration' })

    const accentColor = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--accent-color'),
    )
    expect(accentColor).toBe('var(--swatch-violet)')
    const prefs = await readLsJson(page, LS_USER_PREFERENCES)
    expect(prefs?.accentColorId).toBe('violet')

    await verifyLegacyCleaned(page)
  })

  test('applies migrated background theme to DOM', async ({ page, goto }) => {
    await injectLocalStorage(page, {
      [LS_LOCAL_SETTINGS]: JSON.stringify({ preferredBackgroundTheme: 'slate' }),
    })

    await goto('/', { waitUntil: 'hydration' })

    const bgTheme = await page.evaluate(() => document.documentElement.dataset.bgTheme)
    expect(bgTheme).toBe('slate')
    const prefs = await readLsJson(page, LS_USER_PREFERENCES)
    expect(prefs?.preferredBackgroundTheme).toBe('slate')

    await verifyLegacyCleaned(page)
  })

  test('handles empty legacy storage gracefully', async ({ page, goto }) => {
    await injectLocalStorage(page, {
      [LS_LOCAL_SETTINGS]: JSON.stringify({}),
    })

    await goto('/', { waitUntil: 'hydration' })

    const flag = await readLs(page, LS_MIGRATION_FLAG)
    expect(flag).toBe('1')

    await verifyDefaults(page)
  })

  test('handles missing legacy storage gracefully', async ({ page, goto }) => {
    // No npmx-settings at all — migration should still set the flag
    await goto('/', { waitUntil: 'hydration' })

    const flag = await readLs(page, LS_MIGRATION_FLAG)
    expect(flag).toBe('1')
    await verifyDefaults(page)
  })

  test('handles missing legacy storage and applies current', async ({ page, goto }) => {
    await injectLocalStorage(page, {
      [LS_USER_PREFERENCES]: JSON.stringify({ accentColorId: 'violet' }),
    })
    await goto('/', { waitUntil: 'hydration' })

    const flag = await readLs(page, LS_MIGRATION_FLAG)
    expect(flag).toBe('1')
    const prefs = await readLsJson(page, LS_USER_PREFERENCES)
    expect(prefs?.accentColorId).toBe('violet')
  })
})
