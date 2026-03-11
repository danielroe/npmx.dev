import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { DEFAULT_USER_PREFERENCES } from '#shared/schemas/userPreferences'

describe('useKeyboardShortcutsPreference', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset preferences to defaults
    const { preferences } = useUserPreferencesState()
    preferences.value = { ...DEFAULT_USER_PREFERENCES }
  })

  afterEach(() => {
    delete document.documentElement.dataset.kbdShortcuts
  })

  it('should return true by default', () => {
    const enabled = useKeyboardShortcutsPreference()
    expect(enabled.value).toBe(true)
  })

  it('should return false when preference is disabled', () => {
    const { preferences } = useUserPreferencesState()
    preferences.value = { ...preferences.value, keyboardShortcuts: false }

    const enabled = useKeyboardShortcutsPreference()
    expect(enabled.value).toBe(false)
  })

  it('should reactively update when preferences change', () => {
    const enabled = useKeyboardShortcutsPreference()
    const { preferences } = useUserPreferencesState()

    expect(enabled.value).toBe(true)

    preferences.value = { ...preferences.value, keyboardShortcuts: false }
    expect(enabled.value).toBe(false)

    preferences.value = { ...preferences.value, keyboardShortcuts: true }
    expect(enabled.value).toBe(true)
  })

  it('should set data-kbd-shortcuts attribute when disabled', async () => {
    const { preferences } = useUserPreferencesState()

    useKeyboardShortcutsPreference()

    preferences.value = { ...preferences.value, keyboardShortcuts: false }
    await nextTick()
    expect(document.documentElement.dataset.kbdShortcuts).toBe('false')

    preferences.value = { ...preferences.value, keyboardShortcuts: true }
    await nextTick()
    expect(document.documentElement.dataset.kbdShortcuts).toBeUndefined()
  })
})
