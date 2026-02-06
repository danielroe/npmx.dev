import { describe, expect, it } from 'vitest'
import { detectPublishSecurityDowngradeForVersion } from '../../../../app/utils/publish-security'

describe('detectPublishSecurityDowngradeForVersion', () => {
  const versions = [
    {
      version: '1.0.0',
      time: '2026-01-01T00:00:00.000Z',
      hasProvenance: true,
    },
    {
      version: '1.0.1',
      time: '2026-01-02T00:00:00.000Z',
      hasProvenance: false,
    },
    {
      version: '1.0.2',
      time: '2026-01-03T00:00:00.000Z',
      hasProvenance: true,
    },
  ]

  it('does not flag trusted viewed version (1.0.2)', () => {
    const result = detectPublishSecurityDowngradeForVersion(versions, '1.0.2')
    expect(result).toBeNull()
  })

  it('flags downgraded viewed version (1.0.1)', () => {
    const result = detectPublishSecurityDowngradeForVersion(versions, '1.0.1')
    expect(result).toEqual({
      downgradedVersion: '1.0.1',
      downgradedPublishedAt: '2026-01-02T00:00:00.000Z',
      trustedVersion: '1.0.0',
      trustedPublishedAt: '2026-01-01T00:00:00.000Z',
    })
  })

  it('flags trust downgrade from provenance to trustedPublisher', () => {
    const result = detectPublishSecurityDowngradeForVersion(
      [
        {
          version: '1.0.0',
          time: '2026-01-01T00:00:00.000Z',
          hasProvenance: true,
          trustLevel: 'provenance',
        },
        {
          version: '1.0.1',
          time: '2026-01-02T00:00:00.000Z',
          hasProvenance: true,
          trustLevel: 'trustedPublisher',
        },
      ],
      '1.0.1',
    )

    expect(result).toEqual({
      downgradedVersion: '1.0.1',
      downgradedPublishedAt: '2026-01-02T00:00:00.000Z',
      trustedVersion: '1.0.0',
      trustedPublishedAt: '2026-01-01T00:00:00.000Z',
    })
  })

  it('flags ongoing downgraded versions until an upgrade happens', () => {
    const versions = [
      {
        version: '2.1.0',
        time: '2026-01-01T00:00:00.000Z',
        hasProvenance: true,
        trustLevel: 'provenance' as const,
      },
      {
        version: '2.1.1',
        time: '2026-01-02T00:00:00.000Z',
        hasProvenance: false,
        trustLevel: 'none' as const,
      },
      {
        version: '2.2.0',
        time: '2026-01-03T00:00:00.000Z',
        hasProvenance: false,
        trustLevel: 'none' as const,
      },
      {
        version: '2.3.0',
        time: '2026-01-04T00:00:00.000Z',
        hasProvenance: false,
        trustLevel: 'none' as const,
      },
      {
        version: '2.4.0',
        time: '2026-01-05T00:00:00.000Z',
        hasProvenance: true,
        trustLevel: 'provenance' as const,
      },
    ]

    expect(detectPublishSecurityDowngradeForVersion(versions, '2.1.1')?.trustedVersion).toBe(
      '2.1.0',
    )
    expect(detectPublishSecurityDowngradeForVersion(versions, '2.2.0')?.trustedVersion).toBe(
      '2.1.0',
    )
    expect(detectPublishSecurityDowngradeForVersion(versions, '2.3.0')?.trustedVersion).toBe(
      '2.1.0',
    )
    expect(detectPublishSecurityDowngradeForVersion(versions, '2.4.0')).toBeNull()
  })
})
