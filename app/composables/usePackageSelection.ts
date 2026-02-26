export function usePackageSelection() {
  const selectedPackagesParam = useRouteQuery<string>('selection', '', {
    mode: 'replace',
  })

  const selectedPackages = computed<string[]>({
    get() {
      if (!selectedPackagesParam) {
        return []
      }

      return selectedPackagesParam.value.split(',').map(p => p.trim())
    },
    set(value) {
      selectedPackagesParam.value = value.length > 0 ? value.join(',') : ''
    },
  })

  function findPackageIndex(name: string): number {
    return selectedPackages.value.findIndex(selectedPackage => selectedPackage === name)
  }

  function isPackageSelected(name: string): boolean {
    return findPackageIndex(name) !== -1
  }

  function togglePackageSelection(name: string) {
    const itemIndex = findPackageIndex(name)

    if (itemIndex !== -1) {
      selectedPackages.value = selectedPackages.value.filter((_, i) => i !== itemIndex)
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
