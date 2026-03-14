import { computed } from 'vue'
import type { ModuleReplacement, KnownUrl } from 'module-replacements'

export function useReplacements(replacement: ModuleReplacement | null | undefined) {
  const resolveUrl = (url?: KnownUrl) => {
    if (!url) return null
    if (typeof url === 'string') return url

    switch (url.type) {
      case 'mdn':
        return `https://developer.mozilla.org/en-US/docs/${url.id}`
      case 'node':
        return `https://nodejs.org/${url.id}`
      case 'e18e':
        return `https://e18e.dev/docs/replacements/${url.id}`
      default:
        return null
    }
  }

  const externalUrl = computed(() => resolveUrl(replacement?.url))

  const nodeVersion = computed(() => {
    const nodeEngine = replacement?.engines?.find(e => e.engine === 'nodejs')
    return nodeEngine?.minVersion || null
  })

  const replacementName = computed(() => {
    if (!replacement) return ''
    return replacement.nodeFeatureId?.moduleName || replacement.description || replacement.id || ''
  })

  return {
    externalUrl,
    nodeVersion,
    replacementName,
  }
}
