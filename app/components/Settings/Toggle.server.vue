<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label?: string
    description?: string
    justify?: 'between' | 'start'
    reverseOrder?: boolean
  }>(),
  {
    justify: 'between',
    reverseOrder: false,
  },
)
</script>

<template>
  <div
    class="grid items-center gap-4 py-1 -my-1"
    :class="[
      justify === 'start' ? 'justify-start' : '',
      props.reverseOrder ? 'toggle-reverse' : 'toggle-default',
    ]"
  >
    <template v-if="props.reverseOrder">
      <SkeletonBlock class="h-6 w-11 shrink-0 rounded-full" style="grid-area: toggle-background" />
      <span
        v-if="label"
        class="text-sm text-fg font-medium text-start"
        style="grid-area: label-text"
      >
        {{ label }}
      </span>
    </template>
    <template v-else>
      <span
        v-if="label"
        class="text-sm text-fg font-medium text-start"
        style="grid-area: label-text"
      >
        {{ label }}
      </span>
      <SkeletonBlock
        class="h-6 w-11 shrink-0 rounded-full"
        style="grid-area: toggle-background; justify-self: end"
      />
    </template>
  </div>
  <p v-if="description" class="text-sm text-fg-muted mt-2">
    {{ description }}
  </p>
</template>

<style scoped>
.toggle-default {
  grid-template-areas: 'label-text . toggle-background';
  grid-template-columns: auto 1fr auto;
}

.toggle-reverse {
  grid-template-areas: 'toggle-background . label-text';
  grid-template-columns: auto 1fr auto;
}
</style>
