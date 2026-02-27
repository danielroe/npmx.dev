<script setup lang="ts">
defineProps<{
  viewMode?: ViewMode
}>()

const { selectedPackages, clearSelectedPackages, selectedPackagesParam } = usePackageSelection()
</script>

<template>
  <section>
    <header class="mb-6 flex items-center justify-end">
      <div class="flex items-center gap-2">
        <ButtonBase variant="secondary" @click="clearSelectedPackages" classicon="i-lucide:x"
          >Clear all</ButtonBase
        >
        <LinkBase
          :to="{ name: 'compare', query: { packages: selectedPackagesParam } }"
          variant="button-primary"
          classicon="i-lucide:git-compare"
        >
          Compare
        </LinkBase>
      </div>
    </header>

    <p class="text-fg-muted text-sm font-mono">
      {{ $t('action_bar.selection', selectedPackages.length) }}
    </p>

    <div class="mt-6">
      <PackageList
        v-if="selectedPackages.length > 0"
        :view-mode="viewMode"
        :results="selectedPackages"
        search-context
        heading-level="h2"
        show-publisher
      />
    </div>
  </section>
</template>
