export const useInstantSearchPreference = createSharedComposable(
  function useInstantSearchPreference() {
    const { preferences } = useUserPreferencesState()

    return computed({
      get: () => preferences.value.instantSearch ?? true,
      set: (value: boolean) => {
        preferences.value.instantSearch = value
      },
    })
  },
)
