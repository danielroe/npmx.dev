export function usePackageSelection() {
  const selectedPackages = useState<NpmSearchResult[]>('package_selection', () => [])
  const selectedPackagesParam = computed<string>(() =>
    selectedPackages.value.map(p => p.package.name).join(','),
  )

  function isPackageSelected(pkg: NpmSearchResult): boolean {
    return selectedPackages.value.some(p => p.package.name === pkg.package.name)
  }

  function togglePackageSelection(pkg: NpmSearchResult) {
    if (isPackageSelected(pkg)) {
      selectedPackages.value = selectedPackages.value.filter(
        selected => selected.package.name !== pkg.package.name,
      )
    } else {
      selectedPackages.value = [...selectedPackages.value, pkg]
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
