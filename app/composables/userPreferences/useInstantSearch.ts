export const useInstantSearch = createSharedComposable(function useInstantSearch() {
  const { preferences } = useUserPreferencesState()

  return computed({
    get: () => preferences.value.instantSearch ?? true,
    set: (value: boolean) => {
      preferences.value.instantSearch = value
    },
  })
})
