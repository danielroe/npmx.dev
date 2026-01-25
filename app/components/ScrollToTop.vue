<script setup lang="ts">
// Track scroll position
const showButton = ref(false)

// Show button after scrolling down 300px
function handleScroll() {
  showButton.value = window.scrollY > 300
}

// Scroll to top smoothly
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Add/remove scroll listener
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
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
      v-if="showButton"
      class="md:hidden fixed bottom-4 right-4 z-40 w-12 h-12 bg-bg-elevated border border-border rounded-full shadow-lg flex items-center justify-center text-fg-muted hover:text-fg transition-colors active:scale-98"
      aria-label="Scroll to top"
      @click="scrollToTop"
    >
      <span class="i-carbon-arrow-up w-5 h-5" />
    </button>
  </Transition>
</template>
