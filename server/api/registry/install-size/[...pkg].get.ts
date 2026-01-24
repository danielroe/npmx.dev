/**
 * GET /api/registry/install-size/:name or /api/registry/install-size/:name/v/:version
 *
 * Calculate total install size for a package including all dependencies.
 * Handles platform-specific optional dependencies by counting only one representative per group.
 */
export default defineCachedEventHandler(
  async event => {
    const pkgParam = getRouterParam(event, 'pkg')
    if (!pkgParam) {
      throw createError({ statusCode: 400, message: 'Package name is required' })
    }

    // Parse package name and optional version from path segments
    // Supports: /install-size/lodash, /install-size/lodash/v/4.17.21, /install-size/@scope/name, /install-size/@scope/name/v/1.0.0
    const segments = pkgParam.split('/')
    let packageName: string
    let requestedVersion: string | undefined

    if (segments[0]?.startsWith('@')) {
      // Scoped package: @scope/name or @scope/name/v/version
      if (segments.length < 2) {
        throw createError({ statusCode: 400, message: 'Invalid scoped package name' })
      }
      packageName = `@${segments[0]?.slice(1)}/${segments[1]}`
      if (segments[2] === 'v' && segments[3]) {
        requestedVersion = segments[3]
      }
    } else {
      // Unscoped package: name or name/v/version
      packageName = segments[0] ?? ''
      if (segments[1] === 'v' && segments[2]) {
        requestedVersion = segments[2]
      }
    }

    if (!packageName) {
      throw createError({ statusCode: 400, message: 'Package name is required' })
    }
    assertValidPackageName(packageName)

    // If no version specified, resolve to latest
    let version = requestedVersion
    if (!version) {
      try {
        const packument = await fetchNpmPackage(packageName)
        version = packument['dist-tags']?.latest
        if (!version) {
          throw createError({ statusCode: 404, message: 'No latest version found' })
        }
      } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error) {
          throw error
        }
        throw createError({ statusCode: 502, message: 'Failed to fetch package info' })
      }
    }

    try {
      return await calculateInstallSize(packageName, version)
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }
      throw createError({ statusCode: 502, message: 'Failed to calculate install size' })
    }
  },
  {
    maxAge: 60 * 60, // 1 hour
    swr: true,
    getKey: event => getRouterParam(event, 'pkg') ?? '',
  },
)
