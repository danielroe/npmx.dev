export const useKeyboardShortcutsPreference = createSharedComposable(
  function useKeyboardShortcutsPreference() {
    const { preferences } = useUserPreferencesState()
    const enabled = computed(() => preferences.value.keyboardShortcuts ?? true)

    if (import.meta.client) {
      watch(
        enabled,
        value => {
          if (value) {
            delete document.documentElement.dataset.kbdShortcuts
          } else {
            document.documentElement.dataset.kbdShortcuts = 'false'
          }
        },
        { immediate: true },
      )
    }

    return enabled
  },
)
