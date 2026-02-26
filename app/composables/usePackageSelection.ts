export function usePackageSelection() {
  const selectedPackages = useState<NpmSearchResult[]>('selected_packages', () => [])

  function findPackageIndex(pkg: NpmSearchResult): number {
    return selectedPackages.value.findIndex(
      selectedPackage => selectedPackage.package.name === pkg.package.name,
    )
  }

  function isPackageSelected(pkg: NpmSearchResult): boolean {
    return findPackageIndex(pkg) !== -1
  }

  function togglePackageSelection(pkg: NpmSearchResult) {
    const itemIndex = findPackageIndex(pkg)

    if (itemIndex !== -1) {
      selectedPackages.value.splice(itemIndex, 1)
    } else {
      selectedPackages.value.push(pkg)
    }
  }

  function clearSelectedPackages() {
    selectedPackages.value = []
  }

  return {
    selectedPackages,
    clearSelectedPackages,
    isPackageSelected,
    togglePackageSelection,
  }
}
