import { beforeEach, describe, expect, it } from 'vitest'

// Direct import since this composable doesn't use other Nuxt-specific features
import { usePackageSelection } from '~/composables/usePackageSelection'

describe('usePackageSelection', () => {
  let selection: ReturnType<typeof usePackageSelection>

  beforeEach(() => {
    selection = usePackageSelection()
  })

  describe('initial state', () => {
    it('starts with empty selection', () => {
      expect(selection.selectedCount.value).toBe(0)
      expect(selection.hasSelection.value).toBe(false)
      expect(selection.selectedPackages.value).toEqual([])
    })

    it('starts in non-selection mode', () => {
      expect(selection.isSelectionMode.value).toBe(false)
    })
  })

  describe('toggle', () => {
    it('adds package when not selected', () => {
      selection.toggle('@nuxt/kit')

      expect(selection.isSelected('@nuxt/kit')).toBe(true)
      expect(selection.selectedCount.value).toBe(1)
    })

    it('removes package when already selected', () => {
      selection.toggle('@nuxt/kit')
      selection.toggle('@nuxt/kit')

      expect(selection.isSelected('@nuxt/kit')).toBe(false)
      expect(selection.selectedCount.value).toBe(0)
    })

    it('handles multiple packages', () => {
      selection.toggle('@nuxt/kit')
      selection.toggle('@nuxt/ui')
      selection.toggle('@nuxt/content')

      expect(selection.selectedCount.value).toBe(3)
      expect(selection.isSelected('@nuxt/kit')).toBe(true)
      expect(selection.isSelected('@nuxt/ui')).toBe(true)
      expect(selection.isSelected('@nuxt/content')).toBe(true)
    })
  })

  describe('select/deselect', () => {
    it('select adds package', () => {
      selection.select('@nuxt/kit')

      expect(selection.isSelected('@nuxt/kit')).toBe(true)
    })

    it('select is idempotent', () => {
      selection.select('@nuxt/kit')
      selection.select('@nuxt/kit')

      expect(selection.selectedCount.value).toBe(1)
    })

    it('deselect removes package', () => {
      selection.select('@nuxt/kit')
      selection.deselect('@nuxt/kit')

      expect(selection.isSelected('@nuxt/kit')).toBe(false)
    })

    it('deselect is idempotent', () => {
      selection.select('@nuxt/kit')
      selection.deselect('@nuxt/kit')
      selection.deselect('@nuxt/kit')

      expect(selection.selectedCount.value).toBe(0)
    })
  })

  describe('selectAll', () => {
    it('selects all packages from array', () => {
      const packages = ['@nuxt/kit', '@nuxt/ui', '@nuxt/content']
      selection.selectAll(packages)

      expect(selection.selectedCount.value).toBe(3)
      for (const pkg of packages) {
        expect(selection.isSelected(pkg)).toBe(true)
      }
    })

    it('adds to existing selection', () => {
      selection.select('@nuxt/devtools')
      selection.selectAll(['@nuxt/kit', '@nuxt/ui'])

      expect(selection.selectedCount.value).toBe(3)
      expect(selection.isSelected('@nuxt/devtools')).toBe(true)
    })

    it('deduplicates when adding already selected packages', () => {
      selection.select('@nuxt/kit')
      selection.selectAll(['@nuxt/kit', '@nuxt/ui'])

      expect(selection.selectedCount.value).toBe(2)
    })
  })

  describe('deselectAll', () => {
    it('clears all selections', () => {
      selection.selectAll(['@nuxt/kit', '@nuxt/ui', '@nuxt/content'])
      selection.deselectAll()

      expect(selection.selectedCount.value).toBe(0)
      expect(selection.hasSelection.value).toBe(false)
    })
  })

  describe('areAllSelected', () => {
    it('returns true when all packages are selected', () => {
      const packages = ['@nuxt/kit', '@nuxt/ui']
      selection.selectAll(packages)

      expect(selection.areAllSelected(packages)).toBe(true)
    })

    it('returns false when some packages are not selected', () => {
      selection.select('@nuxt/kit')

      expect(selection.areAllSelected(['@nuxt/kit', '@nuxt/ui'])).toBe(false)
    })

    it('returns false for empty array', () => {
      expect(selection.areAllSelected([])).toBe(false)
    })
  })

  describe('areSomeSelected', () => {
    it('returns true when some but not all are selected', () => {
      selection.select('@nuxt/kit')

      expect(selection.areSomeSelected(['@nuxt/kit', '@nuxt/ui'])).toBe(true)
    })

    it('returns false when all are selected', () => {
      selection.selectAll(['@nuxt/kit', '@nuxt/ui'])

      expect(selection.areSomeSelected(['@nuxt/kit', '@nuxt/ui'])).toBe(false)
    })

    it('returns false when none are selected', () => {
      expect(selection.areSomeSelected(['@nuxt/kit', '@nuxt/ui'])).toBe(false)
    })

    it('returns false for empty array', () => {
      expect(selection.areSomeSelected([])).toBe(false)
    })
  })

  describe('toggleAll', () => {
    it('selects all when none selected', () => {
      const packages = ['@nuxt/kit', '@nuxt/ui']
      selection.toggleAll(packages)

      expect(selection.areAllSelected(packages)).toBe(true)
    })

    it('deselects all when all selected', () => {
      const packages = ['@nuxt/kit', '@nuxt/ui']
      selection.selectAll(packages)
      selection.toggleAll(packages)

      expect(selection.selectedCount.value).toBe(0)
    })

    it('selects all when some selected', () => {
      const packages = ['@nuxt/kit', '@nuxt/ui']
      selection.select('@nuxt/kit')
      selection.toggleAll(packages)

      expect(selection.areAllSelected(packages)).toBe(true)
    })
  })

  describe('selection mode', () => {
    it('enterSelectionMode enables selection mode', () => {
      selection.enterSelectionMode()

      expect(selection.isSelectionMode.value).toBe(true)
    })

    it('exitSelectionMode disables selection mode and clears selection', () => {
      selection.enterSelectionMode()
      selection.selectAll(['@nuxt/kit', '@nuxt/ui'])
      selection.exitSelectionMode()

      expect(selection.isSelectionMode.value).toBe(false)
      expect(selection.selectedCount.value).toBe(0)
    })

    it('toggleSelectionMode toggles mode on and off', () => {
      selection.toggleSelectionMode()
      expect(selection.isSelectionMode.value).toBe(true)

      selection.toggleSelectionMode()
      expect(selection.isSelectionMode.value).toBe(false)
    })

    it('toggleSelectionMode clears selection when exiting', () => {
      selection.enterSelectionMode()
      selection.selectAll(['@nuxt/kit', '@nuxt/ui'])
      selection.toggleSelectionMode()

      expect(selection.selectedCount.value).toBe(0)
    })
  })

  describe('computed values', () => {
    it('selectedPackages returns array of selected package names', () => {
      selection.selectAll(['@nuxt/kit', '@nuxt/ui'])

      const packages = selection.selectedPackages.value
      expect(packages).toContain('@nuxt/kit')
      expect(packages).toContain('@nuxt/ui')
      expect(packages.length).toBe(2)
    })

    it('hasSelection reflects whether any packages are selected', () => {
      expect(selection.hasSelection.value).toBe(false)

      selection.select('@nuxt/kit')
      expect(selection.hasSelection.value).toBe(true)

      selection.deselectAll()
      expect(selection.hasSelection.value).toBe(false)
    })
  })
})
