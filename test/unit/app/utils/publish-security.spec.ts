import { describe, expect, it } from 'vitest'
import {
  detectPublishSecurityDowngrade,
  detectPublishSecurityDowngradeForVersion,
} from '../../../../app/utils/publish-security'

describe('detectPublishSecurityDowngrade', () => {
  it('detects downgrade when latest publish is untrusted and older publish is trusted', () => {
    const result = detectPublishSecurityDowngrade([
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
    ])

    expect(result).toEqual({
      downgradedVersion: '1.0.1',
      downgradedPublishedAt: '2026-01-02T00:00:00.000Z',
      trustedVersion: '1.0.0',
      trustedPublishedAt: '2026-01-01T00:00:00.000Z',
    })
  })

  it('returns null when latest publish is trusted', () => {
    const result = detectPublishSecurityDowngrade([
      {
        version: '1.0.0',
        time: '2026-01-01T00:00:00.000Z',
        hasProvenance: false,
      },
      {
        version: '1.0.1',
        time: '2026-01-02T00:00:00.000Z',
        hasProvenance: true,
      },
    ])

    expect(result).toBeNull()
  })

  it('returns null when there is no trusted historical release', () => {
    const result = detectPublishSecurityDowngrade([
      {
        version: '1.0.0',
        time: '2026-01-01T00:00:00.000Z',
        hasProvenance: false,
      },
      {
        version: '1.0.1',
        time: '2026-01-02T00:00:00.000Z',
        hasProvenance: false,
      },
    ])

    expect(result).toBeNull()
  })
})

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
})
