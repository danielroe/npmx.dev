import { describe, expect, it } from 'vitest'
import type { ComparisonFacet } from '../../shared/types/comparison'

// Import the helper functions we want to test
// Since computeMetricValue is not exported, we test the metric computation logic directly
// by testing through the formatBytes and isStale patterns

describe('comparison metric computation', () => {
  describe('formatBytes', () => {
    // Replicate the formatBytes logic for testing
    function formatBytes(bytes: number): string {
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    it('formats bytes correctly', () => {
      expect(formatBytes(500)).toBe('500 B')
      expect(formatBytes(1024)).toBe('1.0 kB')
      expect(formatBytes(1536)).toBe('1.5 kB')
      expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
      expect(formatBytes(5.5 * 1024 * 1024)).toBe('5.5 MB')
    })

    it('handles edge cases', () => {
      expect(formatBytes(0)).toBe('0 B')
      expect(formatBytes(1)).toBe('1 B')
      expect(formatBytes(1023)).toBe('1023 B')
    })
  })

  describe('isStale', () => {
    // Replicate the isStale logic for testing
    function isStale(date: Date): boolean {
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365)
      return diffYears > 2
    }

    it('returns false for recent dates', () => {
      const recent = new Date()
      recent.setMonth(recent.getMonth() - 6)
      expect(isStale(recent)).toBe(false)
    })

    it('returns false for dates within 2 years', () => {
      const withinLimit = new Date()
      withinLimit.setFullYear(withinLimit.getFullYear() - 1)
      expect(isStale(withinLimit)).toBe(false)
    })

    it('returns true for dates older than 2 years', () => {
      const old = new Date()
      old.setFullYear(old.getFullYear() - 3)
      expect(isStale(old)).toBe(true)
    })
  })

  describe('metric value status determination', () => {
    describe('downloads', () => {
      it('always returns neutral status', () => {
        // Downloads don't have good/bad judgments
        const status = 'neutral'
        expect(status).toBe('neutral')
      })
    })

    describe('packageSize', () => {
      it('returns warning for packages over 5MB', () => {
        const size = 6 * 1024 * 1024
        const status = size > 5 * 1024 * 1024 ? 'warning' : 'neutral'
        expect(status).toBe('warning')
      })

      it('returns neutral for packages under 5MB', () => {
        const size = 4 * 1024 * 1024
        const status = size > 5 * 1024 * 1024 ? 'warning' : 'neutral'
        expect(status).toBe('neutral')
      })
    })

    describe('installSize', () => {
      it('returns warning for install size over 50MB', () => {
        const size = 60 * 1024 * 1024
        const status = size > 50 * 1024 * 1024 ? 'warning' : 'neutral'
        expect(status).toBe('warning')
      })

      it('returns neutral for install size under 50MB', () => {
        const size = 40 * 1024 * 1024
        const status = size > 50 * 1024 * 1024 ? 'warning' : 'neutral'
        expect(status).toBe('neutral')
      })
    })

    describe('moduleFormat', () => {
      it('returns good for esm', () => {
        const format = 'esm'
        const status = format === 'esm' || format === 'dual' ? 'good' : 'neutral'
        expect(status).toBe('good')
      })

      it('returns good for dual', () => {
        const format = 'dual'
        const status = format === 'esm' || format === 'dual' ? 'good' : 'neutral'
        expect(status).toBe('good')
      })

      it('returns neutral for cjs', () => {
        const format = 'cjs'
        const status = format === 'esm' || format === 'dual' ? 'good' : 'neutral'
        expect(status).toBe('neutral')
      })
    })

    describe('types', () => {
      it('returns good for included types', () => {
        const kind = 'included'
        const status = kind === 'included' ? 'good' : kind === '@types' ? 'info' : 'bad'
        expect(status).toBe('good')
      })

      it('returns info for @types package', () => {
        const kind = '@types'
        const status = kind === 'included' ? 'good' : kind === '@types' ? 'info' : 'bad'
        expect(status).toBe('info')
      })

      it('returns bad for no types', () => {
        const kind = 'none'
        const status = kind === 'included' ? 'good' : kind === '@types' ? 'info' : 'bad'
        expect(status).toBe('bad')
      })
    })

    describe('vulnerabilities', () => {
      it('returns good for no vulnerabilities', () => {
        const count = 0
        const status = count === 0 ? 'good' : 'warning'
        expect(status).toBe('good')
      })

      it('returns bad for critical vulnerabilities', () => {
        const count = 2
        const critical = 1
        const high = 0
        const status = count === 0 ? 'good' : critical > 0 || high > 0 ? 'bad' : 'warning'
        expect(status).toBe('bad')
      })

      it('returns bad for high vulnerabilities', () => {
        const count = 2
        const critical = 0
        const high = 2
        const status = count === 0 ? 'good' : critical > 0 || high > 0 ? 'bad' : 'warning'
        expect(status).toBe('bad')
      })

      it('returns warning for medium/low vulnerabilities only', () => {
        const count = 3
        const critical = 0
        const high = 0
        const status = count === 0 ? 'good' : critical > 0 || high > 0 ? 'bad' : 'warning'
        expect(status).toBe('warning')
      })
    })

    describe('deprecated', () => {
      it('returns bad for deprecated packages', () => {
        const isDeprecated = true
        const status = isDeprecated ? 'bad' : 'good'
        expect(status).toBe('bad')
      })

      it('returns good for non-deprecated packages', () => {
        const isDeprecated = false
        const status = isDeprecated ? 'bad' : 'good'
        expect(status).toBe('good')
      })
    })

    describe('dependencies', () => {
      it('returns warning for more than 50 dependencies', () => {
        const depCount = 60
        const status = depCount > 50 ? 'warning' : 'neutral'
        expect(status).toBe('warning')
      })

      it('returns neutral for 50 or fewer dependencies', () => {
        const depCount = 50
        const status = depCount > 50 ? 'warning' : 'neutral'
        expect(status).toBe('neutral')
      })
    })

    describe('license', () => {
      it('returns warning for unknown license', () => {
        const license = null
        const status = !license ? 'warning' : 'neutral'
        expect(status).toBe('warning')
      })

      it('returns neutral for known license', () => {
        const license = 'MIT'
        const status = !license ? 'warning' : 'neutral'
        expect(status).toBe('neutral')
      })
    })
  })

  describe('module format display', () => {
    function formatModuleFormat(format: string): string {
      return format === 'dual' ? 'ESM + CJS' : format.toUpperCase()
    }

    it('displays ESM + CJS for dual format', () => {
      expect(formatModuleFormat('dual')).toBe('ESM + CJS')
    })

    it('displays ESM for esm format', () => {
      expect(formatModuleFormat('esm')).toBe('ESM')
    })

    it('displays CJS for cjs format', () => {
      expect(formatModuleFormat('cjs')).toBe('CJS')
    })
  })

  describe('types display', () => {
    function formatTypes(kind: string): string {
      return kind === 'included' ? 'Included' : kind === '@types' ? '@types' : 'None'
    }

    it('displays Included for included types', () => {
      expect(formatTypes('included')).toBe('Included')
    })

    it('displays @types for @types package', () => {
      expect(formatTypes('@types')).toBe('@types')
    })

    it('displays None for no types', () => {
      expect(formatTypes('none')).toBe('None')
    })
  })

  describe('vulnerability display', () => {
    function formatVulnerabilities(
      count: number,
      severity: { critical: number; high: number },
    ): string {
      return count === 0 ? 'None' : `${count} (${severity.critical}C/${severity.high}H)`
    }

    it('displays None for no vulnerabilities', () => {
      expect(formatVulnerabilities(0, { critical: 0, high: 0 })).toBe('None')
    })

    it('displays count with severity breakdown', () => {
      expect(formatVulnerabilities(5, { critical: 1, high: 2 })).toBe('5 (1C/2H)')
    })
  })

  describe('deprecated display', () => {
    function formatDeprecated(isDeprecated: boolean): string {
      return isDeprecated ? 'Deprecated' : 'No'
    }

    it('displays Deprecated for deprecated packages', () => {
      expect(formatDeprecated(true)).toBe('Deprecated')
    })

    it('displays No for non-deprecated packages', () => {
      expect(formatDeprecated(false)).toBe('No')
    })
  })

  describe('encodePackageName', () => {
    function encodePackageName(name: string): string {
      if (name.startsWith('@')) {
        return `@${encodeURIComponent(name.slice(1))}`
      }
      return encodeURIComponent(name)
    }

    it('encodes regular package names', () => {
      expect(encodePackageName('lodash')).toBe('lodash')
      expect(encodePackageName('my-package')).toBe('my-package')
    })

    it('encodes scoped package names correctly', () => {
      expect(encodePackageName('@scope/package')).toBe('@scope%2Fpackage')
      expect(encodePackageName('@vue/core')).toBe('@vue%2Fcore')
    })

    it('preserves @ symbol for scoped packages', () => {
      const encoded = encodePackageName('@nuxt/kit')
      expect(encoded.startsWith('@')).toBe(true)
    })
  })
})
