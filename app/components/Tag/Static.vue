<script setup lang="ts">
const props = withDefaults(defineProps<{ as?: string | Component }>(),{ as: 'span' })
</script>

<template>
  <component :is="props.as" class="tag">
    <slot />
  </component>
</template>
