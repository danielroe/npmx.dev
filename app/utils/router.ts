import type { RouteLocationRaw } from 'vue-router'

export function packageRoute(packageName: string, version?: string | null): RouteLocationRaw {
  const [org, name] = packageName.startsWith('@')
    ? (packageName.split('/') as [string, string])
    : ['', packageName]

  if (version) {
    return {
      name: 'package-version',
      params: {
        org,
        name,
        version,
      },
    }
  }

  return {
    name: 'package',
    params: {
      org,
      name,
    },
  }
}
