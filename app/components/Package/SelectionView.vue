<script setup lang="ts">
defineProps<{
  viewMode?: ViewMode
}>()

const { selectedPackages } = usePackageSelection()
const packages = ref<NpmSearchResult[]>([])
</script>

<template>
  <section>
    <p class="text-fg-muted text-sm mt-4 font-mono">
      {{
        $t('search.found_packages', { count: $n(selectedPackages.length) }, selectedPackages.length)
      }}
    </p>

    {{ selectedPackages }}

    <div class="mt-6">
      <PackageList
        v-if="packages.length > 0"
        :view-mode="viewMode"
        :results="packages"
        search-context
        heading-level="h2"
        show-publisher
      />
    </div>
  </section>
</template>
