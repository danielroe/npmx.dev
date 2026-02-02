import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePackageComparison } from '~/composables/usePackageComparison'

describe('usePackageComparison', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('lastUpdated facet', () => {
    it('uses version-specific publish date, not time.modified', async () => {
      vi.stubGlobal(
        '$fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('registry.npmjs.org')) {
            return Promise.resolve({
              'name': 'test-package',
              'dist-tags': { latest: '2.0.0' },
              'time': {
                // This is the WRONG value - updated by metadata changes
                'modified': '2024-12-01T00:00:00.000Z',
                // This is the CORRECT value - actual publish date
                '2.0.0': '2024-06-15T00:00:00.000Z',
              },
              'license': 'MIT',
              'versions': {
                '2.0.0': { dist: { unpackedSize: 15000 } },
              },
            })
          }
          return Promise.resolve(null)
        }),
      )

      const { packagesData, status, getFacetValues } = usePackageComparison(['test-package'])

      await vi.waitFor(() => {
        expect(status.value).toBe('success')
      })

      expect(packagesData.value[0]).not.toBeNull()

      const values = getFacetValues('lastUpdated')
      expect(values).toHaveLength(1)
      expect(values[0]).not.toBeNull()

      // Should use version-specific timestamp, NOT time.modified
      expect(values[0]!.display).toBe('2024-06-15T00:00:00.000Z')
      expect(values[0]!.raw).toBe(new Date('2024-06-15T00:00:00.000Z').getTime())
    })

    it('stores version-specific time in metadata', async () => {
      vi.stubGlobal(
        '$fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('registry.npmjs.org')) {
            return Promise.resolve({
              'name': 'test-package',
              'dist-tags': { latest: '1.0.0' },
              'time': {
                'modified': '2025-01-01T00:00:00.000Z',
                '1.0.0': '2023-03-20T00:00:00.000Z',
              },
              'license': 'MIT',
              'versions': {
                '1.0.0': { dist: { unpackedSize: 10000 } },
              },
            })
          }
          return Promise.resolve(null)
        }),
      )

      const { packagesData, status } = usePackageComparison(['test-package'])

      await vi.waitFor(() => {
        expect(status.value).toBe('success')
      })

      const metadata = packagesData.value[0]?.metadata
      expect(metadata?.lastUpdated).toBe('2023-03-20T00:00:00.000Z')
      expect(metadata?.lastUpdated).not.toBe('2025-01-01T00:00:00.000Z')
    })
  })

  describe('staleness detection', () => {
    it('marks packages not published in 2+ years as stale', async () => {
      vi.stubGlobal(
        '$fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('registry.npmjs.org')) {
            return Promise.resolve({
              'name': 'old-package',
              'dist-tags': { latest: '1.0.0' },
              'time': {
                '1.0.0': '2020-01-01T00:00:00.000Z', // More than 2 years ago
              },
              'license': 'MIT',
              'versions': {
                '1.0.0': { dist: { unpackedSize: 5000 } },
              },
            })
          }
          return Promise.resolve(null)
        }),
      )

      const { status, getFacetValues } = usePackageComparison(['old-package'])

      await vi.waitFor(() => {
        expect(status.value).toBe('success')
      })

      const values = getFacetValues('lastUpdated')
      expect(values[0]?.status).toBe('warning')
    })

    it('marks recently published packages as neutral', async () => {
      vi.stubGlobal(
        '$fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('registry.npmjs.org')) {
            return Promise.resolve({
              'name': 'fresh-package',
              'dist-tags': { latest: '1.0.0' },
              'time': {
                '1.0.0': new Date().toISOString(), // Today
              },
              'license': 'MIT',
              'versions': {
                '1.0.0': { dist: { unpackedSize: 5000 } },
              },
            })
          }
          return Promise.resolve(null)
        }),
      )

      const { status, getFacetValues } = usePackageComparison(['fresh-package'])

      await vi.waitFor(() => {
        expect(status.value).toBe('success')
      })

      const values = getFacetValues('lastUpdated')
      expect(values[0]?.status).toBe('neutral')
    })
  })
})
