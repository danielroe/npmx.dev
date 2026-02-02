<script setup lang="ts">
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
  <fieldset class="flex items-center gap-1 rounded-md border border-border p-1 w-fit">
    <legend class="sr-only">{{ $t('settings.text_size') }}</legend>
    <label
      v-for="textSize in textSizes"
      :key="textSize.id"
      class="rounded-xs px-2 bg-bg-subtle border border-border-subtle transition-transform duration-150 motion-safe:hover:bg-bg-elevated cursor-pointer has-[:checked]:(ring-2 ring-fg ring-offset-2 ring-offset-bg-subtle) has-[:focus-visible]:(ring-2 ring-fg ring-offset-2 ring-offset-bg-subtle)"
      :style="{ backgroundColor: textSize.value }"
    >
      <input
        type="radio"
        name="text-size"
        class="sr-only"
        :value="textSize.id"
        :checked="selectedTextSize === textSize.id"
        :aria-label="textSize.name"
        @change="setTextSize(textSize.id)"
      />
      <span>{{ $t(`settings.text_sizes.${textSize.id}`) }}</span>
    </label>
  </fieldset>
</template>
