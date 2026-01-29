/**
 * Generate a route object for navigating to a package page.
 *
 * @param pkg - Package name (e.g., "nuxt" or "@nuxt/kit")
 * @param version - Optional version string
 * @returns Route object with name and params
 * @public
 */
export function getPackageRoute(pkg: string, version: string | null = null) {
  return {
    name: 'package',
    params: {
      package: [...pkg.split('/'), version ? 'v' : null, version].filter(
        (a): a is NonNullable<typeof a> => !!a,
      ),
    },
  } as const
}

/**
 * Parse package name and optional version from the route URL.
 *
 * Supported patterns:
 *   /nuxt → packageName: "nuxt", requestedVersion: null
 *   /nuxt/v/4.2.0 → packageName: "nuxt", requestedVersion: "4.2.0"
 *   /@nuxt/kit → packageName: "@nuxt/kit", requestedVersion: null
 *   /@nuxt/kit/v/1.0.0 → packageName: "@nuxt/kit", requestedVersion: "1.0.0"
 *   /axios@1.13.3 → packageName: "axios", requestedVersion: "1.13.3"
 *   /@nuxt/kit@1.0.0 → packageName: "@nuxt/kit", requestedVersion: "1.0.0"
 * @public
 */
export function usePackageRoute() {
  const route = useRoute('package')

  const data = computed(() => {
    const segments = route.params.package || []

    // Find the /v/ separator for version
    const vIndex = segments.indexOf('v')
    if (vIndex !== -1 && vIndex < segments.length - 1) {
      return {
        packageName: segments.slice(0, vIndex).join('/'),
        requestedVersion: segments.slice(vIndex + 1).join('/'),
      }
    }

    // Parse @ versioned package
    const fullPath = segments.join('/')
    const versionMatch = fullPath.match(/^(@[^/]+\/[^/]+|[^/]+)@([^/]+)$/)
    if (versionMatch) {
      const [, packageName, requestedVersion] = versionMatch as [string, string, string]
      return {
        packageName,
        requestedVersion,
      }
    }

    return {
      packageName: fullPath,
      requestedVersion: null as string | null,
    }
  })

  return {
    packageName: computed(() => data.value.packageName),
    requestedVersion: computed(() => data.value.requestedVersion),
  }
}
