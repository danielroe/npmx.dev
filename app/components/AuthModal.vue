<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

const handleInput = ref('')

const { user, logout } = await useAtproto()

async function handleLogin() {
  if (handleInput.value) {
    await navigateTo(
      {
        path: '/api/auth/atproto',
        query: { handle: handleInput.value },
      },
      { external: true },
    )
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <button
          type="button"
          class="absolute inset-0 bg-black/60 cursor-default"
          aria-label="Close modal"
          @click="open = false"
        />

        <!-- Modal -->
        <div
          class="relative w-full max-w-lg bg-bg border border-border rounded-lg shadow-xl max-h-[90vh] overflow-y-auto overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 id="auth-modal-title" class="font-mono text-lg font-medium">Account Login</h2>
              <button
                type="button"
                class="text-fg-subtle hover:text-fg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50 rounded"
                aria-label="Close"
                @click="open = false"
              >
                <span class="i-carbon-close block w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div v-if="user?.miniDoc?.handle" class="space-y-4">
              <div class="flex items-center gap-3 p-4 bg-bg-subtle border border-border rounded-lg">
                <span class="w-3 h-3 rounded-full bg-green-500" aria-hidden="true" />
                <div>
                  <p class="font-mono text-xs text-fg-muted">
                    Logged in as @{{ user.miniDoc.handle }}
                  </p>
                </div>
              </div>
              <button
                @click="logout"
                class="w-full px-4 py-2 font-mono text-sm text-bg bg-fg rounded-md transition-all duration-200 hover:bg-fg/90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Logout
              </button>
            </div>

            <!-- Disconnected state -->
            <form v-else class="space-y-4" @submit.prevent="handleLogin">
              <p class="text-sm text-fg-muted">Login with your Atmosphere account</p>

              <div class="space-y-3">
                <div>
                  <label
                    for="handle-input"
                    class="block text-xs text-fg-subtle uppercase tracking-wider mb-1.5"
                  >
                    Internet Handle
                  </label>
                  <input
                    id="handle-input"
                    v-model="handleInput"
                    type="text"
                    name="handle"
                    placeholder="alice.bsky.social"
                    autocomplete="off"
                    spellcheck="false"
                    class="w-full px-3 py-2 font-mono text-sm bg-bg-subtle border border-border rounded-md text-fg placeholder:text-fg-subtle transition-colors duration-200 focus:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50"
                  />
                </div>

                <details class="text-sm">
                  <summary
                    class="text-fg-subtle cursor-pointer hover:text-fg-muted transition-colors duration-200"
                  >
                    What is an Atmosphere account?
                  </summary>
                  <div class="mt-3">
                    <p>
                      <span class="font-bold">npmx.dev</span> is an atmosphere application, meaning
                      it's built on the
                      <a
                        href="https://atproto.com"
                        target="_blank"
                        class="text-blue-400 hover:underline"
                        >AT Protocol</a
                      >. This means users can own their data and use one account for all atmosphere
                      accounts.
                    </p>
                  </div>
                </details>
              </div>

              <button
                type="submit"
                :disabled="!handleInput.trim()"
                class="w-full px-4 py-2 font-mono text-sm text-bg bg-fg rounded-md transition-all duration-200 hover:bg-fg/90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
