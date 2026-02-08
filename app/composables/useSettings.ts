import type { RemovableRef } from '@vueuse/core'
import { useLocalStorage } from '@vueuse/core'
import { ACCENT_COLORS } from '#shared/utils/constants'
import { BACKGROUND_THEMES } from '#shared/utils/constants'
import {
  DEFAULT_USER_PREFERENCES,
  type AccentColorId,
  type BackgroundThemeId,
  type UserPreferences,
} from '#shared/schemas/userPreferences'

const STORAGE_KEY = 'npmx-settings'

let settingsRef: RemovableRef<UserPreferences> | null = null
let syncInitialized = false

// TODO: After discussion with the team, this will be replaced with a proper persistent solution (LS + server sync)
export function useSettings() {
  if (!settingsRef) {
    settingsRef = useLocalStorage<UserPreferences>(STORAGE_KEY, DEFAULT_USER_PREFERENCES, {
      mergeDefaults: true,
    })
  }

  return {
    settings: settingsRef,
  }
}

// TODO: Name to be changed
export function useSettingsSync() {
  const { settings } = useSettings()
  const {
    isAuthenticated,
    status,
    lastSyncedAt,
    error,
    loadFromServer,
    scheduleSync,
    setupRouteGuard,
    setupBeforeUnload,
  } = useUserPreferencesSync()

  const isSyncing = computed(() => status.value === 'syncing')
  const isSynced = computed(() => status.value === 'synced')
  const hasError = computed(() => status.value === 'error')

  async function initializeSync(): Promise<void> {
    if (syncInitialized || import.meta.server) return

    setupRouteGuard(() => settings.value)
    setupBeforeUnload(() => settings.value)

    if (isAuthenticated.value) {
      const serverPrefs = await loadFromServer()
      Object.assign(settings.value, serverPrefs)
    }

    watch(
      settings,
      newSettings => {
        if (isAuthenticated.value) {
          scheduleSync(newSettings)
        }
      },
      { deep: true },
    )

    watch(isAuthenticated, async newIsAuth => {
      if (newIsAuth) {
        const serverPrefs = await loadFromServer()
        Object.assign(settings.value, serverPrefs)
      }
    })

    syncInitialized = true
  }

  return {
    settings,
    isAuthenticated,
    isSyncing,
    isSynced,
    hasError,
    syncError: error,
    lastSyncedAt,
    initializeSync,
  }
}

export function useRelativeDates() {
  const { settings } = useSettings()
  return computed(() => settings.value.relativeDates)
}

export function useAccentColor() {
  const { settings } = useSettings()
  const colorMode = useColorMode()

  const accentColors = computed(() => {
    const isDark = colorMode.value === 'dark'
    const colors = isDark ? ACCENT_COLORS.dark : ACCENT_COLORS.light

    return Object.entries(colors).map(([id, value]) => ({
      id: id as AccentColorId,
      name: id,
      value,
    }))
  })

  function setAccentColor(id: AccentColorId | null) {
    if (id) {
      document.documentElement.style.setProperty('--accent-color', `var(--swatch-${id})`)
    } else {
      document.documentElement.style.removeProperty('--accent-color')
    }
    settings.value.accentColorId = id
  }

  return {
    accentColors,
    selectedAccentColor: computed(() => settings.value.accentColorId),
    setAccentColor,
  }
}

export function useBackgroundTheme() {
  const backgroundThemes = Object.entries(BACKGROUND_THEMES).map(([id, value]) => ({
    id: id as BackgroundThemeId,
    name: id,
    value,
  }))

  const { settings } = useSettings()

  function setBackgroundTheme(id: BackgroundThemeId | null) {
    if (id) {
      document.documentElement.dataset.bgTheme = id
    } else {
      document.documentElement.removeAttribute('data-bg-theme')
    }
    settings.value.preferredBackgroundTheme = id
  }

  return {
    backgroundThemes,
    selectedBackgroundTheme: computed(() => settings.value.preferredBackgroundTheme),
    setBackgroundTheme,
  }
}
