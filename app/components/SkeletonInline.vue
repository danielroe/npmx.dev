<!-- Vue component that only takes a class as prop and adds `bg-bg-elevated rounded animate-skeleton-pulse` to that class -->
<script setup lang="ts">
const props = defineProps<{
  class?: string
}>()
</script>

<template>
  <span
    :class="`inline-block bg-bg-elevated rounded animate-skeleton-pulse ${props.class ?? ''}`"
  />
</template>
