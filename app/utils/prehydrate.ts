import type { UserPreferences } from '#shared/schemas/userPreferences'
import type { UserLocalSettings } from '~/composables/useUserLocalSettings'

/**
 * Initialize user preferences before hydration to prevent flash/layout shift.
 * This sets CSS custom properties and data attributes that CSS can use
 * to show the correct content before Vue hydration occurs.
 *
 * Call this in app.vue or any page that needs early access to user preferences.
 */
export function initPreferencesOnPrehydrate() {
  // Callback is stringified by Nuxt - external variables won't be available.
  // All constants must be hardcoded inside the callback.
  onPrehydrate(() => {
    // See comment above for oxlint-disable reason
    // oxlint-disable-next-line eslint-plugin-unicorn(consistent-function-scoping)
    function getValueFromLs<T>(lsKey: string): T | undefined {
      try {
        const value = localStorage.getItem(lsKey)
        if (value) {
          const parsed = JSON.parse(value)
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed
          }
        }
      } catch {
        return undefined
      }
    }
    // oxlint-disable-next-line eslint-plugin-unicorn(consistent-function-scoping)
    function migrateLegacySettings() {
      const migrationFlag = 'npmx-prefs-migrated'
      if (localStorage.getItem(migrationFlag)) return

      const legacySettings = getValueFromLs<UserPreferences>('npmx-settings') || {}
      let userPreferences = getValueFromLs<UserPreferences>('npmx-user-preferences') || {}

      const migratableKeys = [
        'accentColorId',
        'preferredBackgroundTheme',
        'selectedLocale',
        'relativeDates',
      ] as const

      const keysToMigrate = migratableKeys.filter(
        key => key in legacySettings && !(key in userPreferences),
      )

      if (keysToMigrate.length > 0) {
        const migrated = Object.fromEntries(keysToMigrate.map(key => [key, legacySettings[key]]))
        userPreferences = { ...userPreferences, ...migrated }
        localStorage.setItem('npmx-user-preferences', JSON.stringify(userPreferences))
      }

      // Clean migrated fields from legacy storage
      const keysToRemove = migratableKeys.filter(key => key in legacySettings)
      if (keysToRemove.length > 0) {
        const cleaned = { ...legacySettings }
        for (const key of keysToRemove) {
          delete cleaned[key]
        }
        localStorage.setItem('npmx-settings', JSON.stringify(cleaned))
      }

      localStorage.setItem(migrationFlag, '1')
    }

    migrateLegacySettings()

    // Valid accent color IDs (must match --swatch-* variables defined in main.css)
    const accentColorIds = new Set([
      'sky',
      'coral',
      'amber',
      'emerald',
      'violet',
      'magenta',
      'neutral',
    ])

    // Valid package manager IDs
    const validPMs = new Set(['npm', 'pnpm', 'yarn', 'bun', 'deno', 'vlt'])

    // Read user preferences from localStorage
    const preferences = getValueFromLs<UserPreferences>('npmx-user-preferences') || {}

    const accentColorId = preferences.accentColorId
    if (accentColorId && accentColorIds.has(accentColorId)) {
      document.documentElement.style.setProperty('--accent-color', `var(--swatch-${accentColorId})`)
    }

    // Apply background accent
    const preferredBackgroundTheme = preferences.preferredBackgroundTheme
    if (preferredBackgroundTheme) {
      document.documentElement.dataset.bgTheme = preferredBackgroundTheme
    }

    // Read and apply package manager preference
    const storedPM = localStorage.getItem('npmx-pm')
    // Parse the stored value (it's stored as a JSON string by useLocalStorage)
    let pm = 'npm'
    if (storedPM) {
      try {
        const parsed = JSON.parse(storedPM)
        if (validPMs.has(parsed)) {
          pm = parsed
        }
      } catch {
        // If parsing fails, check if it's a plain string (legacy format)
        if (validPMs.has(storedPM)) {
          pm = storedPM
        }
      }
    }

    // Set data attribute for CSS-based visibility
    document.documentElement.dataset.pm = pm

    const localSettings = getValueFromLs<Partial<UserLocalSettings>>('npmx-settings') || {}
    document.documentElement.dataset.collapsed = localSettings.sidebar?.collapsed?.join(' ') ?? ''
  })
}
