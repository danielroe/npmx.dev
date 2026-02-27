<script setup lang="ts">
const props = defineProps<{
  /** Number of selected packages */
  selectedCount: number
  /** Org name for displaying in the UI */
  orgName?: string
}>()

const emit = defineEmits<{
  /** Clear all selections */
  clearSelection: []
  /** Open the grant access modal */
  grantAccess: []
  /** Open the copy access modal */
  copyAccess: []
}>()
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    leave-active-class="transition-all duration-150 ease-in"
    enter-from-class="opacity-0 -translate-y-2"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="selectedCount > 0"
      class="sticky top-0 z-20 bg-bg-elevated border border-border rounded-lg shadow-lg mb-4 p-3"
    >
      <div class="flex flex-wrap items-center gap-3">
        <!-- Selection count -->
        <div class="flex items-center gap-2 text-sm font-mono">
          <span class="i-lucide:check-square w-4 h-4 text-accent-fallback" aria-hidden="true" />
          <span class="text-fg">
            {{ $t('package.bulk.selected_count', { count: selectedCount }, selectedCount) }}
          </span>
        </div>

        <span aria-hidden="true" class="flex-shrink-1 flex-grow-1" />

        <!-- Action buttons -->
        <div class="flex items-center gap-2">
          <!-- Grant access button -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-sm text-bg bg-accent-fallback rounded transition-colors duration-200 hover:bg-accent-fallback/90 focus-visible:outline-accent/70"
            @click="emit('grantAccess')"
          >
            <span class="i-lucide:shield-plus w-4 h-4" aria-hidden="true" />
            {{ $t('package.bulk.grant_access') }}
          </button>

          <!-- Copy access button -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-sm text-fg bg-bg border border-border rounded transition-colors duration-200 hover:bg-bg-muted hover:border-border-hover focus-visible:outline-accent/70"
            @click="emit('copyAccess')"
          >
            <span class="i-lucide:copy w-4 h-4" aria-hidden="true" />
            {{ $t('package.bulk.copy_access') }}
          </button>

          <!-- Clear selection button -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-sm text-fg-muted hover:text-fg transition-colors duration-200 rounded focus-visible:outline-accent/70"
            :aria-label="$t('package.bulk.clear_selection')"
            @click="emit('clearSelection')"
          >
            <span class="i-lucide:x w-4 h-4" aria-hidden="true" />
            <span class="hidden sm:inline">{{ $t('package.bulk.clear_selection') }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
