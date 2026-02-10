<script setup lang="ts">
const props = defineProps<{
  as?: string | Component
}>()
</script>

<template>
  <component
    :is="props.as || 'div'"
    class="inline-flex items-stretch [&>*:not(:first-child)]:(-ml-px rounded-is-none) [&>*:not(:last-child)]:rounded-ie-none [&>*:focus-visible]:(relative z-40)"
  >
    <slot />
  </component>
</template>
