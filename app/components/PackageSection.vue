<script setup lang="ts">
defineProps<{
  title: string
  toggleable?: boolean
  isVisible?: boolean
  scrollToId?: string
}>()

const isVisible = defineModel('isVisible', {
  default: true,
})

function toggleVisibility() {
  isVisible.value = !isVisible.value
}
</script>

<template>
  <section class="overflow-hidden scroll-mt-20">
    <header class="group flex items-center justify-between gap-2 mb-3">
      <h2 class="group text-xs text-fg-subtle uppercase tracking-wider">
        <a
          v-if="scrollToId"
          :href="`#${scrollToId}`"
          class="inline-flex items-center gap-1.5 text-fg-subtle hover:text-fg-muted transition-colors duration-200 no-underline"
        >
          {{ title }}
          <span
            class="i-carbon-link w-3 h-3 block opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-hidden="true"
          />
        </a>
        <template v-else>{{ title }}</template>
      </h2>

      <button
        v-if="toggleable"
        @click="toggleVisibility"
        class="text-xs text-fg-subtle hover:text-fg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        {{ isVisible ? 'hide' : 'show' }}
      </button>
    </header>

    <div v-if="isVisible" class="space-y-0.5 min-w-0">
      <slot />
    </div>
  </section>
</template>
