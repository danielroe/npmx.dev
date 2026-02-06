import type { PackageVersionInfo, PublishTrustLevel } from '#shared/types'
import { compare } from 'semver'

export interface PublishSecurityDowngrade {
  downgradedVersion: string
  downgradedPublishedAt?: string
  trustedVersion: string
  trustedPublishedAt?: string
}

type VersionWithIndex = PackageVersionInfo & {
  index: number
  timestamp: number
  trustRank: number
}

const TRUST_RANK: Record<PublishTrustLevel, number> = {
  none: 0,
  trustedPublisher: 1,
  provenance: 2,
}

function getTrustRank(version: PackageVersionInfo): number {
  if (version.trustLevel) return TRUST_RANK[version.trustLevel]
  return version.hasProvenance ? TRUST_RANK.provenance : TRUST_RANK.none
}

function toTimestamp(time?: string): number {
  if (!time) return Number.NaN
  return Date.parse(time)
}

function sortByRecency(a: VersionWithIndex, b: VersionWithIndex): number {
  const aValid = !Number.isNaN(a.timestamp)
  const bValid = !Number.isNaN(b.timestamp)

  if (!aValid && !bValid) {
    // Fall back to semver comparison if no valid timestamps
    const semverOrder = compare(b.version, a.version)
    if (semverOrder !== 0) return semverOrder

    // If semver is also equal, maintain original order
    return a.index - b.index
  }

  if (aValid !== bValid) {
    return aValid ? -1 : 1
  }

  return b.timestamp - a.timestamp
}

/**
 * Detects a security downgrade for a specific viewed version.
 * A version is considered downgraded when it has no provenance and
 * there exists an older trusted release.
 */
export function detectPublishSecurityDowngradeForVersion(
  versions: PackageVersionInfo[],
  viewedVersion: string,
): PublishSecurityDowngrade | null {
  if (versions.length < 2 || !viewedVersion) return null

  const sorted = versions
    .map((version, index) => ({
      ...version,
      index,
      timestamp: toTimestamp(version.time),
      trustRank: getTrustRank(version),
    }))
    .sort(sortByRecency)

  const currentIndex = sorted.findIndex(version => version.version === viewedVersion)
  if (currentIndex === -1) return null

  const current = sorted.at(currentIndex)
  if (!current) return null

  let strongestOlder: VersionWithIndex | null = null
  for (const version of sorted.slice(currentIndex + 1)) {
    if (!strongestOlder || version.trustRank > strongestOlder.trustRank) {
      strongestOlder = version
    }
  }

  if (!strongestOlder || strongestOlder.trustRank <= current.trustRank) return null

  return {
    downgradedVersion: current.version,
    downgradedPublishedAt: current.time,
    trustedVersion: strongestOlder.version,
    trustedPublishedAt: strongestOlder.time,
  }
}
