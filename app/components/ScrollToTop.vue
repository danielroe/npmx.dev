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
  <Transition name="fade">
    <button
      v-if="isActive && isVisible"
      type="button"
      class="fixed top-16 left-1/2 -translate-x-1/2 z-50 p-3 bg-bg-elevated border border-border rounded-full shadow-lg md:hidden active:scale-95"
      aria-label="Scroll to top"
      @click="scrollToTop"
    >
      <span class="i-carbon-chevron-up w-5 h-5 block text-fg" aria-hidden="true" />
    </button>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
