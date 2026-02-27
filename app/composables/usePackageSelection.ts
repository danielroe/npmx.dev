export function usePackageSelection() {
  const selectedPackagesParam = useRouteQuery<string>('selection', '', {
    mode: 'replace',
  })

  const selectedPackages = computed<string[]>({
    get() {
      if (!selectedPackagesParam) {
        return []
      }

      return selectedPackagesParam.value
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0)
        .slice(0, 4)
    },
    set(value) {
      selectedPackagesParam.value = value.length > 0 ? value.join(',') : ''
    },
  })

  function isPackageSelected(name: string): boolean {
    return selectedPackages.value.includes(name)
  }

  function togglePackageSelection(name: string) {
    if (isPackageSelected(name)) {
      selectedPackages.value = selectedPackages.value.filter(selected => selected !== name)
    } else {
      selectedPackages.value = [...selectedPackages.value, name]
    }
  }

  function clearSelectedPackages() {
    selectedPackages.value = []
  }

  return {
    selectedPackages,
    selectedPackagesParam,
    clearSelectedPackages,
    isPackageSelected,
    togglePackageSelection,
  }
}
