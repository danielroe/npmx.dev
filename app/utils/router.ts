export function packageRoute(packageName: string, version?: string | null) {
  const [org, name] = packageName.startsWith('@')
    ? packageName.slice(1).split('/')
    : [null, packageName]

  if (version) {
    return {
      name: 'package-version' as const,
      params: {
        org,
        name,
        version,
      },
    }
  }

  return {
    name: 'package' as const,
    params: {
      org,
      name,
    },
  }
}
