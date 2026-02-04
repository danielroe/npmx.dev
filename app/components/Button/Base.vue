<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    disabled?: boolean
    type?: 'button' | 'submit'
    variant?: 'primary' | 'secondary'
  }>(),
  {
    type: 'button',
    variant: 'secondary',
  },
)

const el = ref<HTMLButtonElement | null>(null)

defineExpose({
  focus: () => el.value?.focus(),
})
</script>

<template>
  <button
    ref="el"
    class="inline-flex gap-x-1 items-center justify-center px-4 py-2 font-mono text-sm border border-border rounded-md transition-all duration-200 disabled:(opacity-40 cursor-not-allowed)"
    :class="[
      variant === 'primary'
        ? 'text-bg bg-fg hover:enabled:(bg-fg/90)'
        : 'bg-transparent text-fg hover:enabled:(bg-fg text-bg border-fg)',
    ]"
    :type="props.type"
    :disabled="disabled ? true : undefined"
  >
    <slot />
  </button>
</template>
