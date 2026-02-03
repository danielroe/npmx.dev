<script setup lang="ts">
import type { TextSizeId } from '~/composables/useSettings'

const { textSizes, selectedTextSize, setTextSize } = useTextSize()

onPrehydrate(el => {
  const settings = JSON.parse(localStorage.getItem('npmx-settings') || '{}')

  const id = settings.preferredTextSize
  if (id) {
    const input = el.querySelector<HTMLInputElement>(`input[value="${id || 'normal'}"]`)
    if (input) {
      input.checked = true
    }
  }
})
</script>

<template>
  <fieldset>
    <legend class="sr-only">{{ $t('settings.text_size') }}</legend>
    <select
      id="text-size-select"
      :value="selectedTextSize"
      class="w-full sm:w-auto min-w-48 bg-bg border border-border rounded-md px-3 py-2 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50 cursor-pointer"
      @change="setTextSize(($event.target as HTMLSelectElement).value as TextSizeId)"
    >
      <option v-for="textSize in textSizes" :key="textSize.id" :value="textSize.id">
        {{ $t(`settings.text_sizes.${textSize.id}`) }}
      </option>
    </select>
  </fieldset>
</template>
