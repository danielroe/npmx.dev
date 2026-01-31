<script setup lang="ts">
const props = defineProps<{ title: string; htmlContent: string; date: string }>()
</script>
<template>
  <main class="container">
    <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
      {{ title }}
    </h1>

    <DateTime
      :datetime="date"
      year="numeric"
      month="short"
      day="numeric"
      class="text-xs text-fg-subtle"
    />

    <div class="" v-html="htmlContent" />
  </main>
</template>

<style>
.container {
  background: var(--bg-blue);
}
</style>
