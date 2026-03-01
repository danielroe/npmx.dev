/**
 * Composable for managing package selection state.
 * Used for bulk operations on multiple packages.
 */
export function usePackageSelection() {
  // Selection state
  const selected = ref<Set<string>>(new Set())
  const isSelectionMode = shallowRef(false)

  // Computed helpers
  const selectedCount = computed(() => selected.value.size)
  const selectedPackages = computed(() => Array.from(selected.value))
  const hasSelection = computed(() => selected.value.size > 0)

  /**
   * Check if a package is selected
   */
  function isSelected(packageName: string): boolean {
    return selected.value.has(packageName)
  }

  /**
   * Toggle selection for a single package
   */
  function toggle(packageName: string): void {
    const newSet = new Set(selected.value)
    if (newSet.has(packageName)) {
      newSet.delete(packageName)
    } else {
      newSet.add(packageName)
    }
    selected.value = newSet
  }

  /**
   * Select a single package
   */
  function select(packageName: string): void {
    if (!selected.value.has(packageName)) {
      const newSet = new Set(selected.value)
      newSet.add(packageName)
      selected.value = newSet
    }
  }

  /**
   * Deselect a single package
   */
  function deselect(packageName: string): void {
    if (selected.value.has(packageName)) {
      const newSet = new Set(selected.value)
      newSet.delete(packageName)
      selected.value = newSet
    }
  }

  /**
   * Select all packages from a list
   */
  function selectAll(packages: string[]): void {
    const newSet = new Set(selected.value)
    for (const pkg of packages) {
      newSet.add(pkg)
    }
    selected.value = newSet
  }

  /**
   * Deselect all packages
   */
  function deselectAll(): void {
    selected.value = new Set()
  }

  /**
   * Enter selection mode
   */
  function enterSelectionMode(): void {
    isSelectionMode.value = true
  }

  /**
   * Exit selection mode and clear selection
   */
  function exitSelectionMode(): void {
    isSelectionMode.value = false
    deselectAll()
  }

  /**
   * Toggle selection mode
   */
  function toggleSelectionMode(): void {
    if (isSelectionMode.value) {
      exitSelectionMode()
    } else {
      enterSelectionMode()
    }
  }

  /**
   * Check if all packages from a list are selected
   */
  function areAllSelected(packages: string[]): boolean {
    if (packages.length === 0) return false
    return packages.every(pkg => selected.value.has(pkg))
  }

  /**
   * Check if some (but not all) packages from a list are selected
   */
  function areSomeSelected(packages: string[]): boolean {
    if (packages.length === 0) return false
    const selectedCount = packages.filter(pkg => selected.value.has(pkg)).length
    return selectedCount > 0 && selectedCount < packages.length
  }

  /**
   * Toggle all packages from a list (select all if not all selected, deselect all if all selected)
   */
  function toggleAll(packages: string[]): void {
    if (areAllSelected(packages)) {
      // Deselect all from the list
      const newSet = new Set(selected.value)
      for (const pkg of packages) {
        newSet.delete(pkg)
      }
      selected.value = newSet
    } else {
      // Select all from the list
      selectAll(packages)
    }
  }

  return {
    // State
    selected: readonly(selected),
    selectedPackages,
    selectedCount,
    hasSelection,
    isSelectionMode: readonly(isSelectionMode),

    // Selection actions
    isSelected,
    toggle,
    select,
    deselect,
    selectAll,
    deselectAll,
    areAllSelected,
    areSomeSelected,
    toggleAll,

    // Mode actions
    enterSelectionMode,
    exitSelectionMode,
    toggleSelectionMode,
  }
}

// Create a shared instance for the org page
export const useOrgPackageSelection = createSharedComposable(usePackageSelection)
