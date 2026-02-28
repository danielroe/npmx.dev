<script setup lang="ts">
const { user } = useAtproto()
</script>

<template>
  <main class="container py-8 sm:py-12 w-full max-w-3xl mx-auto flex flex-col gap-8">
    <header class="flex flex-col gap-4 pb-4 border-b border-border">
      <div>
        <LinkBase
          :to="`/profile/${user?.handle}`"
          classicon="i-lucide:arrow-left"
          class="text-sm text-fg-muted hover:text-fg mb-4 inline-flex items-center gap-2"
        >
          Back to Profile
        </LinkBase>
        <h1 class="font-mono text-2xl sm:text-3xl font-medium">PDS Account Settings</h1>
        <p class="text-fg-muted mt-2">
          Manage your underlying identity, handle, and security credentials.
        </p>
      </div>
    </header>

    <div class="flex flex-col gap-6">
      <section class="p-6 bg-bg-subtle border border-border rounded-lg">
        <h2 class="font-mono text-xl mb-2">Change Handle</h2>
        <p class="text-sm text-fg-muted mb-4">
          Your handle is your unique identifier on the AT Protocol. Changing it will update your
          identity across the network.
        </p>
        <div class="flex gap-4">
          <input
            type="text"
            class="flex-1 bg-bg border border-border rounded-md px-3 py-2 font-mono text-sm max-w-md"
            :placeholder="user?.handle || 'New handle...'"
          />
          <ButtonBase variant="primary">Update Handle</ButtonBase>
        </div>
      </section>

      <section
        class="p-6 bg-bg-subtle border border-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 class="font-mono text-xl mb-1">Email Address</h2>
          <p class="text-sm text-fg-muted">Update the email address used for account recovery.</p>
        </div>
        <ButtonBase variant="secondary">Request Email Change</ButtonBase>
      </section>

      <section
        class="p-6 bg-bg-subtle border border-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 class="font-mono text-xl mb-1">Password Reset</h2>
          <p class="text-sm text-fg-muted">
            Send a secure password reset link to your registered email.
          </p>
        </div>
        <ButtonBase variant="secondary" class="text-red-500 hover:bg-red-500/10 border-red-500/20">
          Reset Password
        </ButtonBase>
      </section>
    </div>
  </main>
</template>
