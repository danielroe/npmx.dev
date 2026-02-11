<script setup lang="ts">
defineProps<{
  label: string
  description?: string
}>()
const checked = defineModel<boolean>({
  required: true,
})
const id = useId()
</script>

<template>
  <label :for="id" class="grid" style="grid-template-areas: 'label-text . toggle-background'">
    <span class="text-sm text-fg font-medium text-start" style="grid-area: label-text">{{
      label
    }}</span>
    <input
      role="switch"
      type="checkbox"
      :id
      class="opacity-0"
      style="grid-row: 1; grid-column: 3; justify-self: end"
      v-model="checked"
    />
    <span
      class="toggle-background h-6 w-11 rounded-full border border-fg relative flex"
      style="grid-area: toggle-background; justify-self: end"
    ></span>
  </label>
  <p v-if="description" class="text-sm text-fg-muted mt-2">
    {{ description }}
  </p>
</template>

<style scoped>
/* Track background */
.toggle-background {
  background: var(--fg-subtle);
  transition:
    background-color 100ms ease-in,
    border-color 100ms ease-in;
}

@media (prefers-reduced-motion: reduce) {
  .toggle-background {
    transition: none;
  }
}

label:has(input:focus-visible) .toggle-background {
  outline: solid 2px var(--fg);
  outline-offset: 2px;
}

label:has(input:checked) .toggle-background {
  background: var(--fg);
  border-color: var(--fg);
}

label:has(input:hover:not(:checked)) .toggle-background {
  background: var(--fg-muted);
}

label:has(input:checked:hover) .toggle-background {
  background: var(--fg-muted);
  border-color: var(--fg-muted);
}

/* Circle that moves */
.toggle-background::before {
  transition: translate 200ms ease-in-out;
  content: '';
  width: 20px;
  height: 20px;
  top: 1px;
  inset-inline-start: 1px;
  position: absolute;
  border-radius: 9999px;
  background: var(--bg);
}

@media (prefers-reduced-motion: reduce) {
  .toggle-background::before {
    transition: none;
  }
}

/* Support rtl locales */
:dir(ltr) input:checked + .toggle-background::before {
  translate: 20px;
}

:dir(rtl) input:checked + .toggle-background::before {
  translate: -20px;
}
</style>
