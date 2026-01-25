<script setup lang="ts">
const route = useRoute()

// Pages where scroll-to-top should NOT be shown
const excludedRoutes = new Set(['index', 'code'])

const isActive = computed(() => !excludedRoutes.has(route.name as string))

const isVisible = ref(false)
const scrollThreshold = 300

function onScroll() {
  isVisible.value = window.scrollY > scrollThreshold
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <button
      v-if="isActive && isVisible"
      type="button"
      class="fixed bottom-4 right-4 z-50 w-12 h-12 bg-bg-elevated border border-border rounded-full shadow-lg md:hidden flex items-center justify-center text-fg-muted hover:text-fg transition-colors active:scale-95"
      aria-label="Scroll to top"
      @click="scrollToTop"
    >
      <span class="i-carbon-arrow-up w-5 h-5" aria-hidden="true" />
    </button>
  </Transition>
</template>
