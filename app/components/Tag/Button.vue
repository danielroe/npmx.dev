<script setup lang="ts">
const props = defineProps<{
  disabled?: boolean
  /**
   * type should never be used, because this will always be a button.
   *
   * If you want a link use `TagLink` instead.
   *  */
  type?: never
  pressed?: boolean
}>()
</script>

<template>
  <button
    class="inline-flex items-center px-2 py-0.5 text-xs font-mono border rounded transition-colors duration-200 disabled:(opacity-50 cursor-not-allowed)"
    :class="[
      pressed
        ? 'bg-fg text-bg border-fg hover:enabled:(text-text-bg/50)'
        : 'bg-bg-muted text-fg-muted border-border hover:enabled:(text-fg border-border-hover)',
    ]"
    type="button"
    :disabled="disabled ? true : undefined"
    :aria-pressed="pressed"
  >
    <slot />
  </button>
</template>
