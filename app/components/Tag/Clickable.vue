<script setup lang="ts">
const props = withDefaults(defineProps<{ as?: string | Component }>(),{ as: 'button' })
</script>

<template>
  <component
    :is="props.as"
    class="inline-flex items-center px-2 py-0.5 text-xs font-mono text-fg-muted bg-bg-muted border border-border rounded transition-colors duration-200 hover:(text-fg border-border-hover) focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-1"
  >
    <slot />
  </component>
</template>
