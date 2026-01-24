import type { Packument, PackumentVersion } from '#shared/types'
import { maxSatisfying } from 'semver'

/**
 * Result of install size calculation
 */
export interface InstallSizeResult {
  /** Package name */
  package: string
  /** Package version */
  version: string
  /** Unpacked size of the package itself (bytes) */
  selfSize: number
  /** Total unpacked size including all dependencies (bytes) */
  totalSize: number
  /** Number of dependencies (including transitive) */
  dependencyCount: number
  /** Breakdown of dependency sizes */
  dependencies: DependencySize[]
}

export interface DependencySize {
  name: string
  version: string
  size: number
  /** True if this is an optional dependency */
  optional?: boolean
}

/**
 * We resolve for linux-x64 with glibc
 */
const TARGET_PLATFORM = {
  os: 'linux',
  cpu: 'x64',
  libc: 'glibc',
}

const fetchPackument = defineCachedFunction(
  async (name: string): Promise<Packument | null> => {
    try {
      const encodedName = name.startsWith('@')
        ? `@${encodeURIComponent(name.slice(1))}`
        : encodeURIComponent(name)

      return await $fetch<Packument>(`https://registry.npmjs.org/${encodedName}`)
    } catch {
      return null
    }
  },
  {
    maxAge: 60 * 60, // 1 hour
    swr: true,
    name: 'packument',
    getKey: (name: string) => name,
  },
)

/**
 * Check if a package version matches the target platform.
 * Returns false if the package explicitly excludes our target platform.
 */
function matchesPlatform(version: PackumentVersion): boolean {
  // Check OS compatibility
  if (version.os && Array.isArray(version.os) && version.os.length > 0) {
    const osMatch = version.os.some(os => {
      if (os.startsWith('!')) {
        return os.slice(1) !== TARGET_PLATFORM.os
      }
      return os === TARGET_PLATFORM.os
    })
    if (!osMatch) return false
  }

  // Check CPU compatibility
  if (version.cpu && Array.isArray(version.cpu) && version.cpu.length > 0) {
    const cpuMatch = version.cpu.some(cpu => {
      if (cpu.startsWith('!')) {
        return cpu.slice(1) !== TARGET_PLATFORM.cpu
      }
      return cpu === TARGET_PLATFORM.cpu
    })
    if (!cpuMatch) return false
  }

  // Check libc compatibility (if specified)
  const libc = (version as { libc?: string[] }).libc
  if (libc && Array.isArray(libc) && libc.length > 0) {
    const libcMatch = libc.some(l => {
      if (l.startsWith('!')) {
        return l.slice(1) !== TARGET_PLATFORM.libc
      }
      return l === TARGET_PLATFORM.libc
    })
    if (!libcMatch) return false
  }

  return true
}

/**
 * Resolve a semver range to a specific version from available versions.
 */
function resolveVersion(range: string, versions: string[]): string | null {
  // Handle exact versions, tags, URLs, etc.
  if (versions.includes(range)) {
    return range
  }

  // Handle npm: protocol (aliases)
  if (range.startsWith('npm:')) {
    // npm:package@version - extract the version part
    const atIndex = range.lastIndexOf('@')
    if (atIndex > 4) {
      // After 'npm:'
      const aliasedRange = range.slice(atIndex + 1)
      return resolveVersion(aliasedRange, versions)
    }
    return null
  }

  // Handle URLs, git refs, etc. - we can't resolve these
  if (
    range.startsWith('http://') ||
    range.startsWith('https://') ||
    range.startsWith('git://') ||
    range.startsWith('git+') ||
    range.startsWith('file:') ||
    range.includes('/')
  ) {
    return null
  }

  return maxSatisfying(versions, range)
}

interface ResolvedDep {
  name: string
  version: string
  size: number
  optional: boolean
}

/**
 * Recursively resolve dependencies for a package.
 * Uses a breadth-first approach with deduplication.
 */
async function resolveDependencyTree(
  rootName: string,
  rootVersion: string,
): Promise<Map<string, ResolvedDep>> {
  const resolved = new Map<string, ResolvedDep>()
  const queue: Array<{
    name: string
    range: string
    optional: boolean
  }> = [{ name: rootName, range: rootVersion, optional: false }]
  const seen = new Set<string>()

  while (queue.length > 0) {
    // Process in batches for better parallelism
    const batch = queue.splice(0, Math.min(20, queue.length))

    await Promise.all(
      batch.map(async ({ name, range, optional }) => {
        // Skip if we've already resolved this package
        // (deduplication - use the first version we encounter)
        if (seen.has(name)) return
        seen.add(name)

        const packument = await fetchPackument(name)
        if (!packument) return

        const versions = Object.keys(packument.versions)
        const version = resolveVersion(range, versions)
        if (!version) return

        const versionData = packument.versions[version]
        if (!versionData) return

        // Skip if this package doesn't match our target platform
        if (!matchesPlatform(versionData)) return

        // Get unpacked size
        const size = (versionData.dist as { unpackedSize?: number })?.unpackedSize ?? 0

        const key = `${name}@${version}`
        if (!resolved.has(key)) {
          resolved.set(key, { name, version, size, optional })
        }

        // Queue regular dependencies
        if (versionData.dependencies) {
          for (const [depName, depRange] of Object.entries(versionData.dependencies)) {
            if (!seen.has(depName)) {
              queue.push({ name: depName, range: depRange, optional: false })
            }
          }
        }

        // Queue optional dependencies (but mark them as optional)
        // Only include if they match our platform
        if (versionData.optionalDependencies) {
          for (const [depName, depRange] of Object.entries(versionData.optionalDependencies)) {
            if (!seen.has(depName)) {
              queue.push({ name: depName, range: depRange, optional: true })
            }
          }
        }
      }),
    )
  }

  return resolved
}

/**
 * Calculate the total install size for a package.
 *
 * Resolves dependencies by fetching packuments directly from the npm registry.
 * No filesystem operations - safe for serverless environments.
 *
 * Dependencies are resolved for linux-x64-glibc as a representative platform.
 */
export const calculateInstallSize = defineCachedFunction(
  async (name: string, version: string): Promise<InstallSizeResult> => {
    const resolved = await resolveDependencyTree(name, version)

    // Separate self from dependencies
    const selfKey = `${name}@${version}`
    const selfEntry = resolved.get(selfKey)
    const selfSize = selfEntry?.size ?? 0

    // Build dependencies list (excluding self)
    const dependencies: DependencySize[] = []
    let totalSize = selfSize
    let dependencyCount = 0

    for (const [key, dep] of resolved) {
      if (key === selfKey) continue

      dependencies.push({
        name: dep.name,
        version: dep.version,
        size: dep.size,
        optional: dep.optional || undefined,
      })
      totalSize += dep.size
      dependencyCount++
    }

    // Sort by size descending
    dependencies.sort((a, b) => b.size - a.size)

    return {
      package: name,
      version,
      selfSize,
      totalSize,
      dependencyCount,
      dependencies,
    }
  },
  {
    // Cache for 1 hour - dependency resolutions can change with new releases
    maxAge: 60 * 60,
    swr: true,
    name: 'install-size',
    getKey: (name: string, version: string) => `${name}@${version}`,
  },
)
