<script setup lang="ts">
const props = defineProps<{
  disabled?: boolean
  /**
   * type should never be used, because this will always be a button.
   *
   * If you want a link use `TagLink` instead.
   *  */
  type?: never
}>()

const el = ref<HTMLButtonElement | null>(null)

defineExpose({
  focus: () => el.value?.focus(),
})
</script>

<template>
  <button
    ref="el"
    class="inline-flex items-center justify-center px-4 py-2 font-mono text-sm border border-border rounded-md bg-transparent text-fg transition-all duration-200 hover:(bg-fg hover:text-bg border-fg) focus-ring active:scale-98 disabled:(opacity-40 cursor-not-allowed hover:bg-transparent hover:text-fg)"
    :class="{
      'opacity-50 cursor-not-allowed': disabled,
    }"
    type="button"
    :disabled="disabled ? true : undefined"
  >
    <slot />
  </button>
</template>
