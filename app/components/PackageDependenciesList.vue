<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<
  | {
      type: 'dependencies' | 'optional'
      dependencies: Record<string, string>
    }
  | {
      type: 'peer'
      dependencies: Record<string, string>
      meta: Record<string, { optional?: boolean }>
    }
>()

// Only fetch outdated info for regular dependencies
const outdatedDeps =
  props.type === 'dependencies' ? useOutdatedDependencies(() => props.dependencies) : null

// Expanded state
const expanded = shallowRef(false)

// Sort dependencies
const sortedDependencies = computed(() => {
  if (!props.dependencies) return []

  const entries = Object.entries(props.dependencies).map(([name, version]) => {
    const outdated = outdatedDeps?.value?.[name] ?? null
    return {
      name,
      version,
      optional: props.type === 'peer' && !!props.meta?.[name]?.optional,
      outdated,
      versionClass: outdated ? getVersionClass(outdated) : 'text-fg-subtle',
      versionTooltip: outdated ? getOutdatedTooltip(outdated, t) : version,
    }
  })

  // Peer deps: required first, then optional; others: alphabetical
  // Since non-peer deps always have optional=false, we can use the same sort for all
  return entries.sort((a, b) => {
    if (a.optional !== b.optional) return a.optional ? 1 : -1
    return a.name.localeCompare(b.name)
  })
})

// i18n key prefix based on type
const i18nPrefix = computed(() => {
  switch (props.type) {
    case 'peer':
      return 'package.peer_dependencies'
    case 'optional':
      return 'package.optional_dependencies'
    default:
    case 'dependencies':
      return 'package.dependencies'
  }
})
</script>

<template>
  <div v-if="sortedDependencies.length > 0">
    <ul class="space-y-1 list-none m-0 p-0" :aria-label="$t(`${i18nPrefix}.list_label`)">
      <li
        v-for="dep in sortedDependencies.slice(0, expanded ? undefined : 10)"
        :key="dep.name"
        class="flex items-center justify-between py-1 text-sm gap-2"
      >
        <div class="flex items-center gap-2 min-w-0">
          <NuxtLink
            :to="{ name: 'package', params: { package: dep.name.split('/') } }"
            class="font-mono text-fg-muted hover:text-fg transition-colors duration-200 truncate"
          >
            {{ dep.name }}
          </NuxtLink>
          <!-- Optional badge for peer dependencies -->
          <span
            v-if="props.type === 'peer' && dep.optional"
            class="px-1 py-0.5 font-mono text-[10px] text-fg-subtle bg-bg-muted border border-border rounded shrink-0"
            :title="$t('package.dependencies.optional')"
          >
            {{ $t('package.dependencies.optional') }}
          </span>
        </div>
        <span class="flex items-center gap-1">
          <!-- Outdated warning for regular dependencies -->
          <span
            v-if="dep.outdated"
            class="shrink-0"
            :class="dep.versionClass"
            :title="dep.versionTooltip"
            aria-hidden="true"
          >
            <span class="i-carbon-warning-alt w-3 h-3 block" />
          </span>
          <NuxtLink
            :to="{
              name: 'package',
              params: { package: [...dep.name.split('/'), 'v', dep.version] },
            }"
            class="font-mono text-xs text-end truncate"
            :class="dep.versionClass"
            :title="dep.versionTooltip"
          >
            {{ dep.version }}
          </NuxtLink>
          <span v-if="dep.outdated" class="sr-only"> ({{ dep.versionTooltip }}) </span>
        </span>
      </li>
    </ul>
    <button
      v-if="sortedDependencies.length > 10 && !expanded"
      type="button"
      class="mt-2 font-mono text-xs text-fg-muted hover:text-fg transition-colors duration-200 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50"
      @click="expanded = true"
    >
      {{ $t(`${i18nPrefix}.show_all`, { count: sortedDependencies.length }) }}
    </button>
  </div>
</template>
