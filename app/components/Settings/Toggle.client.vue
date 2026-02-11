<script setup lang="ts">
import TooltipApp from '~/components/Tooltip/App.vue'

const props = withDefaults(
  defineProps<{
    label?: string
    description?: string
    class?: string
    justify?: 'between' | 'start'
    tooltip?: string
    tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
    tooltipTo?: string
    tooltipOffset?: number
    reverseOrder?: boolean
  }>(),
  {
    justify: 'between',
    reverseOrder: false,
  },
)

const checked = defineModel<boolean>({
  required: true,
})
const id = useId()
</script>

<template>
  <label
    :for="id"
    class="grid items-center gap-4 py-1 -my-1"
    :class="[justify === 'start' ? 'justify-start' : '', props.reverseOrder ? 'toggle-reverse' : 'toggle-default', $props.class]"
  >
    <template v-if="props.reverseOrder">
      <input
        role="switch"
        type="checkbox"
        :id
        class="toggle-checkbox opacity-0"
        style="grid-row: 1; grid-column: 1; justify-self: start"
        v-model="checked"
      />
      <span
        class="toggle-background h-6 w-11 rounded-full border border-fg relative flex shrink-0"
      ></span>
      <TooltipApp
        v-if="tooltip && label"
        :text="tooltip"
        :position="tooltipPosition ?? 'top'"
        :to="tooltipTo"
        :offset="tooltipOffset"
      >
        <span class="text-sm text-fg font-medium text-start">
          {{ label }}
        </span>
      </TooltipApp>
      <span v-else-if="label" class="text-sm text-fg font-medium text-start">
        {{ label }}
      </span>
    </template>
    <template v-else>
      <TooltipApp
        v-if="tooltip && label"
        :text="tooltip"
        :position="tooltipPosition ?? 'top'"
        :to="tooltipTo"
        :offset="tooltipOffset"
      >
        <span class="text-sm text-fg font-medium text-start">
          {{ label }}
        </span>
      </TooltipApp>
      <span v-else-if="label" class="text-sm text-fg font-medium text-start">
        {{ label }}
      </span>
      <input
        role="switch"
        type="checkbox"
        :id
        class="toggle-checkbox opacity-0"
        style="grid-row: 1; grid-column: 3; justify-self: end"
        v-model="checked"
      />
      <span
        class="toggle-background h-6 w-11 rounded-full border border-fg relative flex shrink-0"
        style="grid-area: toggle-background; justify-self: end"
      ></span>
    </template>
  </label>
  <p v-if="description" class="text-sm text-fg-muted mt-2">
    {{ description }}
  </p>
</template>

<style scoped>
/* Layout: default order (label first, toggle last) */
.toggle-default {
  grid-template-areas: 'label-text . toggle-background';
  grid-template-columns: auto 1fr auto;
}

/* Layout: reverse order (toggle first, label last) */
.toggle-reverse {
  grid-template-areas: 'toggle-background . label-text';
  grid-template-columns: auto 1fr auto;
}

/* Track background */
.toggle-background {
  background: var(--fg-subtle);
  transition: background-color 100ms ease-in, border-color 100ms ease-in;
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
