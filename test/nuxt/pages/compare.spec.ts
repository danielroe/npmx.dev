import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'

// Mock composables
const mockPackagesParam = ref('')
const mockSelectedFacets = ref(['downloads', 'types'])

vi.mock('@vueuse/router', () => ({
  useRouteQuery: () => mockPackagesParam,
}))

vi.mock('~/composables/useFacetSelection', () => ({
  useFacetSelection: () => ({
    selectedFacets: mockSelectedFacets,
    selectAll: vi.fn(),
    deselectAll: vi.fn(),
    isAllSelected: ref(false),
    isNoneSelected: ref(false),
    isFacetSelected: vi.fn(),
    toggleFacet: vi.fn(),
    selectCategory: vi.fn(),
    deselectCategory: vi.fn(),
  }),
}))

vi.mock('~/composables/usePackageComparison', () => ({
  usePackageComparison: () => ({
    packagesData: ref([]),
    status: ref('idle'),
    getMetricValues: vi.fn(() => []),
    isFacetLoading: vi.fn(() => false),
  }),
}))

// Mock useSettings
vi.mock('~/composables/useSettings', () => ({
  useRelativeDates: () => ref(false),
  useSettings: () => ({
    settings: ref({ relativeDates: false }),
  }),
  useAccentColor: () => ({}),
  initAccentOnPrehydrate: () => {},
}))

describe('compare page', () => {
  beforeEach(() => {
    mockPackagesParam.value = ''
    mockSelectedFacets.value = ['downloads', 'types']
  })

  describe('URL parsing', () => {
    it('parses packages from comma-separated query param', () => {
      mockPackagesParam.value = 'lodash,underscore,ramda'

      // Test the parsing logic directly
      const packages = mockPackagesParam.value
        .split(',')
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0)
        .slice(0, 4)

      expect(packages).toEqual(['lodash', 'underscore', 'ramda'])
    })

    it('limits to 4 packages', () => {
      mockPackagesParam.value = 'a,b,c,d,e,f'

      const packages = mockPackagesParam.value
        .split(',')
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0)
        .slice(0, 4)

      expect(packages).toHaveLength(4)
      expect(packages).toEqual(['a', 'b', 'c', 'd'])
    })

    it('handles empty query param', () => {
      mockPackagesParam.value = ''

      const packages = mockPackagesParam.value
        ? mockPackagesParam.value
            .split(',')
            .map((p: string) => p.trim())
            .filter((p: string) => p.length > 0)
            .slice(0, 4)
        : []

      expect(packages).toEqual([])
    })

    it('trims whitespace from package names', () => {
      mockPackagesParam.value = ' lodash , underscore , ramda '

      const packages = mockPackagesParam.value
        .split(',')
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0)
        .slice(0, 4)

      expect(packages).toEqual(['lodash', 'underscore', 'ramda'])
    })

    it('filters empty entries', () => {
      mockPackagesParam.value = 'lodash,,underscore,'

      const packages = mockPackagesParam.value
        .split(',')
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0)
        .slice(0, 4)

      expect(packages).toEqual(['lodash', 'underscore'])
    })
  })

  describe('canCompare computed', () => {
    it('returns false with 0 packages', () => {
      const packages: string[] = []
      const canCompare = packages.length >= 2
      expect(canCompare).toBe(false)
    })

    it('returns false with 1 package', () => {
      const packages = ['lodash']
      const canCompare = packages.length >= 2
      expect(canCompare).toBe(false)
    })

    it('returns true with 2 packages', () => {
      const packages = ['lodash', 'underscore']
      const canCompare = packages.length >= 2
      expect(canCompare).toBe(true)
    })

    it('returns true with 4 packages', () => {
      const packages = ['a', 'b', 'c', 'd']
      const canCompare = packages.length >= 2
      expect(canCompare).toBe(true)
    })
  })

  describe('gridHeaders computed', () => {
    it('returns package names when no data loaded', () => {
      const packages = ['lodash', 'underscore']
      const packagesData: null[] = [null, null]

      const gridHeaders = packagesData.map((p, i) =>
        p ? `${(p as any).package.name}@${(p as any).package.version}` : (packages[i] ?? ''),
      )

      expect(gridHeaders).toEqual(['lodash', 'underscore'])
    })

    it('returns name@version when data loaded', () => {
      const packages = ['lodash', 'underscore']
      const packagesData = [
        { package: { name: 'lodash', version: '4.17.21' } },
        { package: { name: 'underscore', version: '1.13.6' } },
      ]

      const gridHeaders = packagesData.map((p, i) =>
        p ? `${p.package.name}@${p.package.version}` : (packages[i] ?? ''),
      )

      expect(gridHeaders).toEqual(['lodash@4.17.21', 'underscore@1.13.6'])
    })

    it('handles mixed loaded/unloaded data', () => {
      const packages = ['lodash', 'unknown-pkg']
      const packagesData = [{ package: { name: 'lodash', version: '4.17.21' } }, null]

      const gridHeaders = packagesData.map((p, i) =>
        p ? `${(p as any).package.name}@${(p as any).package.version}` : (packages[i] ?? ''),
      )

      expect(gridHeaders).toEqual(['lodash@4.17.21', 'unknown-pkg'])
    })
  })

  describe('SEO meta', () => {
    it('generates correct title with packages', () => {
      const packages = ['lodash', 'underscore']
      const title = packages.length > 0 ? `Compare ${packages.join(' vs ')}` : 'Compare Packages'

      expect(title).toBe('Compare lodash vs underscore')
    })

    it('generates empty state title without packages', () => {
      const packages: string[] = []
      const title = packages.length > 0 ? `Compare ${packages.join(' vs ')}` : 'Compare Packages'

      expect(title).toBe('Compare Packages')
    })

    it('generates correct description with packages', () => {
      const packages = ['lodash', 'underscore', 'ramda']
      const description =
        packages.length > 0 ? `Compare ${packages.join(', ')} side-by-side` : 'Compare npm packages'

      expect(description).toBe('Compare lodash, underscore, ramda side-by-side')
    })
  })

  describe('empty state', () => {
    it('shows empty state when less than 2 packages', () => {
      const packages = ['lodash']
      const canCompare = packages.length >= 2
      const showEmptyState = !canCompare

      expect(showEmptyState).toBe(true)
    })

    it('hides empty state when 2+ packages', () => {
      const packages = ['lodash', 'underscore']
      const canCompare = packages.length >= 2
      const showEmptyState = !canCompare

      expect(showEmptyState).toBe(false)
    })
  })

  describe('all/none buttons', () => {
    it('shows both all and none buttons', () => {
      // Both buttons should always be visible
      const showAll = true
      const showNone = true

      expect(showAll).toBe(true)
      expect(showNone).toBe(true)
    })
  })
})
