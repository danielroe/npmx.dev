<script setup lang="ts">
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
    if (selectedPackages.value.length === 0) {
      return
    }

    e.preventDefault()
    actionBar.value?.focus()
  },
)
</script>

<template>
  <Transition name="action-bar-slide" appear>
    <div
      v-if="selectedPackages.length"
      class="fixed bottom-10 inset-is-0 w-full flex items-center justify-center z-36 pointer-events-none"
    >
      <div
        ref="actionBarRef"
        tabindex="-1"
        aria-keyshortcuts="b"
        class="pointer-events-auto bg-bg shadow-xl shadow-accent/5 border border-fg-muted/20 p-2.5 min-w-[300px] rounded-xl flex gap-2 items-center justify-between animate-in"
      >
        <div aria-live="polite" aria-atomic="true" class="sr-only">
          {{ $t('action_bar.selection', selectedPackages.length) }}.
          {{ $t('action_bar.shortcut', { key: shortcutKey }) }}.
        </div>

        <div class="flex items-center gap-1 ms-2">
          <span class="text-fg text-sm">
            {{ $t('action_bar.selection', selectedPackages.length) }}
          </span>
          <button
            @click="clearSelectedPackages"
            class="flex items-center ms-2 hover:text-fg-muted"
            aria-label="Close action bar"
          >
            <span class="i-lucide:x text-xs relative top-px" aria-hidden="true" />
          </button>
        </div>

        <LinkBase
          :to="{ name: 'compare', query: { packages: selectedPackagesParam } }"
          variant="button-secondary"
          classicon="i-lucide:git-compare"
        >
          {{ $t('package.links.compare') }}
        </LinkBase>
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
