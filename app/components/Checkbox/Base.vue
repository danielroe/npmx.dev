<script setup lang="ts">
const model = defineModel<boolean>()

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    size?: 'small' | 'medium'
    hideRadio?: boolean
    value: string

    /**
     * type should never be used, because this will always be a radio button.
     *
     * If you want a link use `TagLink` instead.
     *  */
    type?: never
  }>(),
  {
    size: 'medium',
  },
)

const el = useTemplateRef('el')

defineExpose({
  focus: () => el.value?.focus(),
  getBoundingClientRect: () => el.value?.getBoundingClientRect(),
})

const uid = useId()
const internalId = `checkbox-${uid}`
</script>

<template>
  <label
    :htmlFor="internalId"
    class="bg-bg-muted text-fg-muted border-border hover:(text-fg border-border-hover) inline-flex items-center font-mono border rounded transition-colors duration-200 border-none has-checked:(bg-fg text-bg border-fg hover:(text-bg/50)) has-disabled:(opacity-50 pointer-events-none)"
    :class="{
      'text-sm px-4 py-2': size === 'medium',
      'text-xs px-2 py-0.5': size === 'small',
    }"
  >
    <input
      type="checkbox"
      :value="props.value"
      :checked="model"
      :id="internalId"
      :disabled="props.disabled ? true : undefined"
      @change="$emit('update:modelValue', !model)"
      class="size-[1em] bg-bg-muted border-border rounded disabled:opacity-50 me-2"
    />
    <slot />
  </label>
</template>
