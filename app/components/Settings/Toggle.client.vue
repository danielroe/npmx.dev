<script setup lang="ts">
const props = defineProps<{
  label: string
  description?: string
  class?: string
}>()
defineEmits(['update:modelValue'])
const checked = defineModel<boolean>({
  required: true,
})
const id = 'toggle-' + props.label
const { locale, locales } = useI18n()
const dir = computed(() => {
  const localeObj = locales.value.find(item => item.code === locale.value)
  return localeObj?.dir ?? 'ltr'
})
</script>

<template>
  <label :for="id">
    <span class="toggle--label-text">{{ label }}</span>
    <input
      role="switch"
      type="checkbox"
      :id
      class="toggle--checkbox"
      :class="dir"
      v-model="checked"
    />
    <span class="toggle--background"></span>
  </label>
  <p v-if="description" class="text-sm text-fg-muted mt-2">
    {{ description }}
  </p>
</template>

<style scoped>
.toggle--label-text {
  grid-area: label-text;
}

.toggle--background {
  grid-area: toggle-background;
  justify-self: end;
}

.toggle--checkbox {
  opacity: 0;
}

label {
  display: grid;
  grid-template-areas: 'label-text . toggle-background';
}

input {
  grid-row: 1;
  grid-column: 3;
  justify-self: end;
}

label:has(input:focus) .toggle--background {
  outline: solid 2px #030712;
  outline-offset: 2px;
}

label:has(input:checked) .toggle--background {
  background: #030712;
  border-color: #030712;
}

label:has(input:hover) .toggle--background {
  background: #6b7280;
}

/* background */
.toggle--background {
  width: 46px;
  height: 26px;
  background: #9ca3af;
  border-radius: 9999px;
  border: 1px solid #030712;
  display: flex;
  position: relative;
}

.toggle--checkbox:checked.ltr + .toggle--background:before {
  transform: translate(21px);
  left: 2px;
}

.toggle--checkbox:checked.rtl + .toggle--background:before {
  transform: translate(-21px);
  right: 2px;
}

/* Circle that moves */
.toggle--checkbox:checked + .toggle--background:before {
  animation-fill-mode: forwards;
  transition: transform 200ms ease-in-out;
  background: #f9fafb;
}

.toggle--background:before {
  animation-fill-mode: forwards;
  transition: transform 200ms ease-in-out;
  content: '';
  width: 20px;
  height: 20px;
  top: 2px;
  position: absolute;
  border-radius: 9999px;
  background: #f9fafb;
}
</style>
