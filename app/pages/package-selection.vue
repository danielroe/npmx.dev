<script setup lang="ts">
const router = useRouter()
const canGoBack = useCanGoBack()

const { selectedPackages } = usePackageSelection()
</script>

<template>
  <main class="flex-1 py-8">
    <div class="container-sm">
      <div class="flex items-center justify-between gap-4 mb-4">
        <h1 class="font-mono text-2xl sm:text-3xl font-medium">selected packages</h1>
        <button
          type="button"
          class="cursor-pointer inline-flex items-center gap-2 font-mono text-sm text-fg-muted hover:text-fg transition-colors duration-200 rounded focus-visible:outline-accent/70 shrink-0 p-1.5 -mx-1.5"
          @click="router.back()"
          v-if="canGoBack"
        >
          <span class="i-lucide:arrow-left rtl-flip w-4 h-4" aria-hidden="true" />
          <span class="sr-only sm:not-sr-only">{{ $t('nav.back') }}</span>
        </button>
      </div>

      <p class="text-fg-muted text-sm mt-4 font-mono">
        {{
          $t(
            'search.found_packages',
            { count: $n(selectedPackages.length) },
            selectedPackages.length,
          )
        }}
      </p>

      <div class="mt-6">
        <PackageList
          v-if="selectedPackages.length > 0"
          :results="selectedPackages"
          search-context
          heading-level="h2"
          show-publisher
        />
      </div>
    </div>
  </main>
</template>
