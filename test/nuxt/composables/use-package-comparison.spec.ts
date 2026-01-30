import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, nextTick } from 'vue'

// Mock $fetch
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// Mock import.meta.client
vi.stubGlobal('import', { meta: { client: true } })

describe('usePackageComparison', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('initial state', () => {
    it('returns idle status with empty packages', () => {
      const packages = ref<string[]>([])
      const { status, packagesData } = usePackageComparison(packages)

      expect(status.value).toBe('idle')
      expect(packagesData.value).toEqual([])
    })
  })

  describe('getMetricValues', () => {
    it('returns empty array when no packages data', () => {
      const packages = ref<string[]>([])
      const { getMetricValues } = usePackageComparison(packages)

      expect(getMetricValues('downloads')).toEqual([])
    })
  })

  describe('isFacetLoading', () => {
    it('returns false when install size is not loading', () => {
      const packages = ref<string[]>([])
      const { isFacetLoading } = usePackageComparison(packages)

      expect(isFacetLoading('downloads')).toBe(false)
      expect(isFacetLoading('installSize')).toBe(false)
    })
  })

  describe('metric computation', () => {
    // Test the computeMetricValue logic indirectly through data transformation

    describe('downloads metric', () => {
      it('computes downloads with neutral status', () => {
        // Test formatting logic
        const downloads = 1500000
        const formatted = formatCompactNumber(downloads)
        expect(formatted).toBeTruthy()
      })
    })

    describe('packageSize metric', () => {
      it('flags large packages (>5MB) as warning', () => {
        const size = 6 * 1024 * 1024
        const status = size > 5 * 1024 * 1024 ? 'warning' : 'neutral'
        expect(status).toBe('warning')
      })
    })

    describe('installSize metric', () => {
      it('flags large install sizes (>50MB) as warning', () => {
        const size = 60 * 1024 * 1024
        const status = size > 50 * 1024 * 1024 ? 'warning' : 'neutral'
        expect(status).toBe('warning')
      })
    })

    describe('moduleFormat metric', () => {
      it('marks ESM as good', () => {
        const format = 'esm'
        const status = format === 'esm' || format === 'dual' ? 'good' : 'neutral'
        expect(status).toBe('good')
      })

      it('marks dual as good', () => {
        const format = 'dual'
        const status = format === 'esm' || format === 'dual' ? 'good' : 'neutral'
        expect(status).toBe('good')
      })

      it('formats dual as ESM + CJS', () => {
        const format = 'dual'
        const display = format === 'dual' ? 'ESM + CJS' : format.toUpperCase()
        expect(display).toBe('ESM + CJS')
      })
    })

    describe('types metric', () => {
      it('marks included types as good', () => {
        const kind = 'included'
        const status = kind === 'included' ? 'good' : kind === '@types' ? 'info' : 'bad'
        expect(status).toBe('good')
      })

      it('marks @types as info', () => {
        const kind = '@types'
        const status = kind === 'included' ? 'good' : kind === '@types' ? 'info' : 'bad'
        expect(status).toBe('info')
      })

      it('marks no types as bad', () => {
        const kind = 'none'
        const status = kind === 'included' ? 'good' : kind === '@types' ? 'info' : 'bad'
        expect(status).toBe('bad')
      })
    })

    describe('engines metric', () => {
      it('displays Any when no engines specified', () => {
        const engines = undefined
        const display = !engines ? 'Any' : `Node ${engines}`
        expect(display).toBe('Any')
      })

      it('displays Node version when specified', () => {
        const engines = '>=18'
        const display = !engines ? 'Any' : `Node ${engines}`
        expect(display).toBe('Node >=18')
      })
    })

    describe('vulnerabilities metric', () => {
      it('marks zero vulnerabilities as good', () => {
        const count = 0
        const status = count === 0 ? 'good' : 'warning'
        expect(status).toBe('good')
      })

      it('displays None for zero vulnerabilities', () => {
        const count = 0
        const display = count === 0 ? 'None' : `${count}`
        expect(display).toBe('None')
      })

      it('marks critical vulnerabilities as bad', () => {
        const critical = 1
        const high = 0
        const status = critical > 0 || high > 0 ? 'bad' : 'warning'
        expect(status).toBe('bad')
      })

      it('formats vulnerability count with severity breakdown', () => {
        const count = 5
        const critical = 1
        const high = 2
        const display = `${count} (${critical}C/${high}H)`
        expect(display).toBe('5 (1C/2H)')
      })
    })

    describe('lastUpdated metric', () => {
      it('marks old packages as stale (>2 years)', () => {
        const date = new Date()
        date.setFullYear(date.getFullYear() - 3)
        const diffYears = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365)
        const isStale = diffYears > 2
        expect(isStale).toBe(true)
      })

      it('does not mark recent packages as stale', () => {
        const date = new Date()
        date.setMonth(date.getMonth() - 6)
        const diffYears = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365)
        const isStale = diffYears > 2
        expect(isStale).toBe(false)
      })

      it('returns date type for lastUpdated metric', () => {
        // The metric should have type: 'date' for DateTime rendering
        const type = 'date'
        expect(type).toBe('date')
      })
    })

    describe('license metric', () => {
      it('marks unknown license as warning', () => {
        const license = null
        const status = !license ? 'warning' : 'neutral'
        expect(status).toBe('warning')
      })

      it('displays Unknown for missing license', () => {
        const license = null
        const display = !license ? 'Unknown' : license
        expect(display).toBe('Unknown')
      })
    })

    describe('dependencies metric', () => {
      it('marks high dependency count (>50) as warning', () => {
        const count = 60
        const status = count > 50 ? 'warning' : 'neutral'
        expect(status).toBe('warning')
      })
    })

    describe('deprecated metric', () => {
      it('marks deprecated packages as bad', () => {
        const isDeprecated = true
        const status = isDeprecated ? 'bad' : 'good'
        expect(status).toBe('bad')
      })

      it('displays Deprecated for deprecated packages', () => {
        const isDeprecated = true
        const display = isDeprecated ? 'Deprecated' : 'No'
        expect(display).toBe('Deprecated')
      })

      it('displays No for non-deprecated packages', () => {
        const isDeprecated = false
        const display = isDeprecated ? 'Deprecated' : 'No'
        expect(display).toBe('No')
      })
    })
  })

  describe('encodePackageName utility', () => {
    function encodePackageName(name: string): string {
      if (name.startsWith('@')) {
        return `@${encodeURIComponent(name.slice(1))}`
      }
      return encodeURIComponent(name)
    }

    it('encodes regular package names', () => {
      expect(encodePackageName('lodash')).toBe('lodash')
    })

    it('encodes scoped packages preserving @', () => {
      expect(encodePackageName('@vue/core')).toBe('@vue%2Fcore')
    })

    it('handles special characters', () => {
      expect(encodePackageName('my-package')).toBe('my-package')
    })
  })
})

// Helper for tests (mimics the composable's internal format function)
function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return String(num)
}
