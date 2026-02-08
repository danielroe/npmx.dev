<script setup lang="ts">
const props = defineProps<{
  as?: string | Component
}>()
</script>

<template>
  <component
    :is="props.as || 'div'"
    class="flex [&>*]:rounded-e-none [&>*:last-child]:rounded-e-md [&>*]:rounded-s-none [&>*:first-child]:rounded-s-md [&>*:not(:first-child)]:border-s-0 [&>*:focus-visible]:relative [&>*:focus-visible]:z-10"
  >
    <slot />
  </component>
</template>
