import type { ShallowRef } from 'vue'
import type { ModuleReplacement } from 'module-replacements'

async function fetchReplacements(
  deps: Record<string, string> | undefined,
  replacements: ShallowRef<Record<string, ModuleReplacement>>,
) {
  if (!deps || Object.keys(deps).length === 0) {
    replacements.value = {}
    return
  }

  const names = Object.keys(deps)

  const results = await Promise.all(
    names.map(async name => {
      try {
        const replacement = await $fetch<ModuleReplacement | null>(`/api/replacements/${name}`)
        return { name, replacement }
      } catch {
        return { name, replacement: null }
      }
    }),
  )

  const map: Record<string, ModuleReplacement> = {}
  for (const { name, replacement } of results) {
    if (replacement) {
      map[name] = replacement
    }
  }
  replacements.value = map
}

/**
 * Fetch module replacement suggestions for a set of dependencies.
 * Returns a reactive map of dependency name to ModuleReplacement.
 */
export function useReplacementDependencies(
  dependencies: MaybeRefOrGetter<Record<string, string> | undefined>,
) {
  const replacements = shallowRef<Record<string, ModuleReplacement>>({})

  if (import.meta.client) {
    watch(
      () => toValue(dependencies),
      deps => {
        fetchReplacements(deps, replacements).catch(() => {})
      },
      { immediate: true },
    )
  }

  return replacements
}
