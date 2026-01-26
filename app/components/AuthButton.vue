<script setup lang="ts">
const { loggedIn, user, session, fetch, clear, openInPopup } = useUserSession()

const showModal = ref(false)
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="relative flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-200 hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50"
      @click="showModal = true"
    >
      {{ user?.bluesky ?? 'Login' }}
    </button>

    <AuthModal v-model:open="showModal" />
  </div>
</template>
