<script setup lang="ts">
import TooltipApp from '~/components/Tooltip/App.vue'

const props = withDefaults(
  defineProps<{
    label: string
    description?: string
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
    class="grid items-center gap-1.5 py-1 -my-1 grid-cols-[auto_1fr_auto] cursor-pointer group"
    :class="[justify === 'start' ? 'justify-start' : '']"
    :style="
      props.reverseOrder
        ? 'grid-template-areas: \'toggle . label-text\''
        : 'grid-template-areas: \'label-text . toggle\''
    "
  >
    <span
      class="relative inline-flex items-center shrink-0"
      style="grid-area: toggle; justify-self: end"
    >
      <input type="checkbox" :id="id" role="switch" v-model="checked" class="sr-only peer" />

      <!-- Track -->
      <span
        class="w-11 h-6 bg-fg-subtle peer-focus:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-fg peer-focus-visible:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-bg after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fg transition-colors duration-200 ease-in-out"
      ></span>

      <!-- Thumb Icon (Check) - Positioned absolutely over the thumb area -->
      <span
        class="absolute top-[2px] start-[2px] h-5 w-5 rounded-full flex items-center justify-center transition-transform duration-200 ease-in-out pointer-events-none"
        :class="checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'"
      >
        <span
          class="i-lucide:check w-3.5 h-3.5 text-fg transition-transform duration-200"
          :class="checked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'"
          aria-hidden="true"
        ></span>
      </span>
    </span>

    <template v-if="props.reverseOrder">
      <TooltipApp
        v-if="tooltip && label"
        :text="tooltip"
        :position="tooltipPosition ?? 'top'"
        :to="tooltipTo"
        :offset="tooltipOffset"
      >
        <span class="text-sm text-fg font-medium text-start" style="grid-area: label-text">
          {{ label }}
        </span>
      </TooltipApp>
      <span
        v-else-if="label"
        class="text-sm text-fg font-medium text-start"
        style="grid-area: label-text"
      >
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
        <span class="text-sm text-fg font-medium text-start" style="grid-area: label-text">
          {{ label }}
        </span>
      </TooltipApp>
      <span
        v-else-if="label"
        class="text-sm text-fg font-medium text-start"
        style="grid-area: label-text"
      >
        {{ label }}
      </span>
    </template>
  </label>
  <p v-if="description" class="text-sm text-fg-muted mt-2">
    {{ description }}
  </p>
</template>

<style scoped>
/* Support forced colors */
@media (forced-colors: active) {
  /* Label text */
  label > span {
    color: Highlight !important;
    forced-color-adjust: none;
    background: Canvas !important;
  }

  /* Track (OFF & ON base) */
  input + span {
    forced-color-adjust: none;
    border: 1px solid CanvasText !important;
    background: Canvas !important;
  }

  /* Track ON */
  input:checked + span {
    background: Highlight !important;
    border-color: CanvasText !important;
  }

  /* Thumb (OFF) - Purple circle */
  input + span::after {
    forced-color-adjust: none;
    background-color: Highlight !important;
    border: none !important;
  }

  /* Thumb (ON) - White circle on purple track */
  input:checked + span::after {
    background-color: Canvas !important;
  }

  /* Icon (ON) - Purple check on white thumb */
  .i-lucide\:check {
    color: Highlight !important;
    forced-color-adjust: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  span,
  span::after,
  .i-lucide\:check {
    transition: none !important;
    animation: none !important;
  }
}
</style>
