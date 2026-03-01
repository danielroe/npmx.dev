export const MAX_PACKAGE_SELECTION = 4

export function usePackageSelection() {
  // Use 'push' mode and let router handle scroll behavior naturally
  const selectedPackagesParam = useRouteQuery<string>('selection', '', { mode: 'push' })
  const showSelectionViewParam = useRouteQuery<string>('view', '', { mode: 'push' })

  // Parse URL param into array of package names
  const selectedPackages = computed<string[]>({
    get() {
      const raw = selectedPackagesParam.value
      if (!raw) return []
      return raw
        .split(',')
        .map(p => String(p).trim())
        .filter(Boolean)
        .slice(0, MAX_PACKAGE_SELECTION)
    },
    set(pkgs: string[]) {
      // Ensure all items are strings before joining
      const validPkgs = (Array.isArray(pkgs) ? pkgs : []).map(p => String(p).trim()).filter(Boolean)
      selectedPackagesParam.value = validPkgs.length > 0 ? validPkgs.join(',') : ''
    },
  })

  // Check if max selection is reached
  const isMaxSelected = computed(() => selectedPackages.value.length >= MAX_PACKAGE_SELECTION)

  // Track whether the SelectionView is open/visible
  const showSelectionView = computed<boolean>({
    get() {
      return showSelectionViewParam.value === 'selection'
    },
    set(isOpen: boolean) {
      showSelectionViewParam.value = isOpen ? 'selection' : ''
    },
  })

  /** Check if a package name is selected */
  function isPackageSelected(packageName: string): boolean {
    return selectedPackages.value.includes(String(packageName).trim())
  }

  /** Toggle selection for a package by name */
  function togglePackageSelection(packageName: string) {
    const safeName = String(packageName).trim()
    if (!safeName) return

    const pkgs = [...selectedPackages.value]
    const idx = pkgs.indexOf(safeName)
    if (idx !== -1) {
      pkgs.splice(idx, 1)
    } else {
      if (pkgs.length < MAX_PACKAGE_SELECTION) pkgs.push(safeName)
    }
    selectedPackages.value = pkgs
  }

  /** Clear all selected packages */
  function clearSelectedPackages() {
    selectedPackages.value = []
  }

  /** Close the selection view */
  function closeSelectionView() {
    showSelectionView.value = false
  }

  /** Open the selection view */
  function openSelectionView() {
    showSelectionView.value = true
  }

  return {
    selectedPackages,
    selectedPackagesParam,
    showSelectionView,
    isMaxSelected,
    clearSelectedPackages,
    isPackageSelected,
    togglePackageSelection,
    closeSelectionView,
    openSelectionView,
  }
}
