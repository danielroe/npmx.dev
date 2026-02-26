<script setup lang="ts">
defineProps<{
  hide?: boolean
}>()

const { selectedPackages, selectedPackagesParam, clearSelectedPackages } = usePackageSelection()

const shortcutKey = 'b'
const actionBar = useTemplateRef('actionBarRef')
onKeyStroke(
  e => {
    const target = e.target as HTMLElement
    const isCheckbox = target.hasAttribute('data-package-card-checkbox')
    return isKeyWithoutModifiers(e, shortcutKey) && (!isEditableElement(target) || isCheckbox)
  },
  e => {
    e.preventDefault()
    actionBar.value?.focus()
  },
)
</script>

<template>
  <Transition name="action-bar-slide" appear>
    <div
      v-if="selectedPackages.length && !hide"
      class="fixed bottom-12 inset-is-0 w-full flex items-center justify-center z-36 pointer-events-none"
    >
      <div
        ref="actionBarRef"
        tabindex="-1"
        aria-keyshortcuts="b"
        class="pointer-events-auto bg-bg shadow-2xl border border-fg-muted/20 p-2.5 min-w-[280px] rounded-xl flex gap-2 items-center justify-between animate-in"
      >
        <div aria-live="polite" aria-atomic="true" class="sr-only">
          {{ $t('action_bar.selection', selectedPackages.length) }}.
          {{ $t('action_bar.shortcut', { key: shortcutKey }) }}.
        </div>

        <div class="flex items-center gap-1 ms-2">
          <span class="text-fg text-sm">
            {{ $t('action_bar.selection', selectedPackages.length) }}
          </span>
          <button @click="clearSelectedPackages" class="flex items-center ms-2 hover:text-fg-muted">
            <span class="i-lucide:x text-sm" aria-label="Close action bar" />
          </button>
        </div>

        <span class="w-px h-8 bg-fg-subtle/40" />

        <div>
          <LinkBase
            :to="{ name: 'compare', query: { packages: selectedPackagesParam } }"
            variant="button-secondary"
            classicon="i-lucide:git-compare"
            :disabled="selectedPackages.length > 4"
          >
            Compare
          </LinkBase>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Action bar slide/fade animation */
.action-bar-slide-enter-active,
.action-bar-slide-leave-active {
  transition:
    opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.action-bar-slide-enter-from,
.action-bar-slide-leave-to {
  opacity: 0;
  transform: translateY(40px) scale(0.98);
}
.action-bar-slide-enter-to,
.action-bar-slide-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>
