<script setup lang="ts">
const { query } = defineProps<{
  query: string
}>()

const { data: result, status } = useExactPackage(query)
</script>

<template>
  <PackageCard v-if="result" :result heading-level="h2" :search-query="query" />
  <p v-else-if="status !== 'pending'" class="text-fg-muted font-mono mb-6 text-center">
    {{ $t('search.no_results', { query }) }}
  </p>
</template>
