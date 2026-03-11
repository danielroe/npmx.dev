export function useRelativeDatesPreference() {
  const { preferences } = useUserPreferencesState()
  return computed(() => preferences.value.relativeDates)
}
