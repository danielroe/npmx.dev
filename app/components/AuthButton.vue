<script setup lang="ts">
const showModal = ref(false)
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="relative flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-200 hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50"
      :aria-label="ariaLabel"
      @click="showModal = true"
    >
      Login
    </button>

    <AuthModal v-model:open="showModal" />
  </div>
</template>
