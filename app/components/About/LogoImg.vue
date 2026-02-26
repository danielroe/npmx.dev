<script setup lang="ts">
const props = defineProps<{
  src:
    | string
    | {
        dark: string
        light: string
      }
  alt: string
}>()
</script>
<template>
  <div v-if="typeof src === 'string'">
    <img :src="src" loading="lazy" height="36" class="w-auto block h-9" :alt="alt" />
  </div>
  <div v-else-if="src.light === 'auto'">
    <img
      :src="src.dark"
      loading="lazy"
      height="36"
      class="w-auto block light:invert light:grayscale h-9"
      :alt="alt"
    />
  </div>
  <div v-else>
    <img
      :src="src.dark"
      loading="lazy"
      height="36"
      class="w-auto block light:hidden h-9"
      :alt="alt"
    />
    <img
      :src="src.light"
      loading="lazy"
      height="36"
      class="w-auto block hidden light:block h-9"
      :alt="alt"
    />
  </div>
</template>
