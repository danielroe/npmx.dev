import { describe, expect, it } from 'vitest'
import type { Packument, PackageVersionInfo } from '#shared/types'
import { transformPackument } from '~/composables/npm/usePackage'
import { detectPublishSecurityDowngradeForVersion } from '~/utils/publish-security'

function createVersion(version: string, hasAttestations = false) {
  return {
    name: 'foo',
    version,
    dist: {
      shasum: version,
      tarball: `https://registry.npmjs.org/foo/-/foo-${version}.tgz`,
      ...(hasAttestations
        ? {
            attestations: {
              url: `https://example.test/${version}`,
              provenance: { predicateType: 'https://slsa.dev/provenance/v1' },
            },
          }
        : {}),
    },
  }
}

function toVersionInfos(packument: ReturnType<typeof transformPackument>): PackageVersionInfo[] {
  return Object.entries(packument.versions).map(([version, metadata]) => ({
    version,
    time: packument.time[version],
    hasProvenance: !!metadata.hasProvenance,
    deprecated: metadata.deprecated,
  }))
}

describe('transformPackument', () => {
  it('includes requested old version and preserves provenance on it', () => {
    const packument = {
      '_id': 'foo',
      'name': 'foo',
      'dist-tags': { latest: '1.0.7' },
      'time': {
        'created': '2026-01-01T00:00:00.000Z',
        'modified': '2026-01-08T00:00:00.000Z',
        '1.0.0': '2026-01-01T00:00:00.000Z',
        '1.0.1': '2026-01-02T00:00:00.000Z',
        '1.0.2': '2026-01-03T00:00:00.000Z',
        '1.0.3': '2026-01-04T00:00:00.000Z',
        '1.0.4': '2026-01-05T00:00:00.000Z',
        '1.0.5': '2026-01-06T00:00:00.000Z',
        '1.0.6': '2026-01-07T00:00:00.000Z',
        '1.0.7': '2026-01-08T00:00:00.000Z',
      },
      'versions': {
        '1.0.0': createVersion('1.0.0', true),
        '1.0.1': createVersion('1.0.1'),
        '1.0.2': createVersion('1.0.2'),
        '1.0.3': createVersion('1.0.3'),
        '1.0.4': createVersion('1.0.4'),
        '1.0.5': createVersion('1.0.5'),
        '1.0.6': createVersion('1.0.6'),
        '1.0.7': createVersion('1.0.7'),
      },
    } as unknown as Packument

    const transformed = transformPackument(packument, '1.0.0')

    expect(transformed.versions['1.0.0']?.hasProvenance).toBe(true)
    expect(transformed.versions['1.0.1']).toBeUndefined()
    expect(transformed.versions['1.0.2']).toBeUndefined()
  })

  it('works with downgrade detection for viewed version', () => {
    const packument = {
      '_id': 'foo',
      'name': 'foo',
      'dist-tags': { latest: '1.0.2' },
      'time': {
        'created': '2026-01-01T00:00:00.000Z',
        'modified': '2026-01-03T00:00:00.000Z',
        '1.0.0': '2026-01-01T00:00:00.000Z',
        '1.0.1': '2026-01-02T00:00:00.000Z',
        '1.0.2': '2026-01-03T00:00:00.000Z',
      },
      'versions': {
        '1.0.0': createVersion('1.0.0', true),
        '1.0.1': createVersion('1.0.1'),
        '1.0.2': createVersion('1.0.2', true),
      },
    } as unknown as Packument

    const transformed = transformPackument(packument, '1.0.1')
    const infos = toVersionInfos(transformed)

    expect(detectPublishSecurityDowngradeForVersion(infos, '1.0.2')).toBeNull()
    expect(detectPublishSecurityDowngradeForVersion(infos, '1.0.1')).toEqual({
      downgradedVersion: '1.0.1',
      downgradedPublishedAt: '2026-01-02T00:00:00.000Z',
      trustedVersion: '1.0.0',
      trustedPublishedAt: '2026-01-01T00:00:00.000Z',
    })
  })
})
