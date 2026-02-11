<script setup lang="ts">
defineProps<{
  label?: string
  description?: string
}>()
</script>

<template>
  <div class="grid" style="grid-template-areas: 'label-text . toggle-background'">
    <span v-if="label" class="text-sm text-fg font-medium text-start" style="grid-area: label-text">
      {{ label }}
    </span>
    <SkeletonBlock
      class="h-6 w-11 shrink-0 rounded-full"
      style="grid-area: toggle-background; justify-self: end"
    />
  </div>
  <p v-if="description" class="text-sm text-fg-muted mt-2">
    {{ description }}
  </p>
</template>
