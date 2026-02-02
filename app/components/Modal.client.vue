<script setup lang="ts">
const props = defineProps<{
  modalTitle: string
  whenReadyOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'opened'): void
  (e: 'closed'): void
}>()

const dialogRef = ref<HTMLDialogElement>()
const isReady = ref(false)

const modalTitleId = computed(() => {
  const id = getCurrentInstance()?.attrs.id
  return id ? `${id}-title` : undefined
})

function handleModalClose() {
  dialogRef.value?.close()
}

function handleTransitionEnd(e: TransitionEvent) {
  if (e.target !== dialogRef.value) return
  if (e.propertyName !== 'opacity') return
  if (!dialogRef.value?.matches(':modal')) return

  isReady.value = true
  emit('opened')
}

function handleCloseEvent() {
  isReady.value = false
  emit('closed')
}

defineExpose({
  showModal: () => {
    isReady.value = false
    dialogRef.value?.showModal()
  },
  close: () => dialogRef.value?.close(),
})
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialogRef"
      @transitionend="handleTransitionEnd"
      @close="handleCloseEvent"
      closedby="any"
      class="w-full bg-bg border border-border rounded-lg shadow-xl max-h-[90vh] overflow-y-auto overscroll-contain m-0 m-auto p-6 text-white"
      :class="props.whenReadyOnly ? (isReady ? 'modal-ready' : 'modal-not-ready') : ''"
      :aria-labelledby="modalTitleId"
      v-bind="$attrs"
    >
      <div class="flex items-center justify-between mb-6">
        <h2 :id="modalTitleId" class="font-mono text-lg font-medium">
          {{ modalTitle }}
        </h2>
        <button
          type="button"
          class="text-fg-subtle hover:text-fg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50 rounded"
          :aria-label="$t('common.close')"
          @click="handleModalClose"
        >
          <span class="i-carbon-close w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <slot />
    </dialog>
  </Teleport>
</template>

<style scoped>
dialog:modal::backdrop {
  @apply bg-black/60;
}

dialog::backdrop {
  pointer-events: none;
}

/* Modal transition styles */
dialog {
  opacity: 0;
  transition: opacity 200ms ease;
  transition-behavior: allow-discrete;
}

dialog:modal {
  opacity: 1;
  transition: opacity 200ms ease;
  transition-behavior: allow-discrete;
}

@starting-style {
  dialog:modal {
    opacity: 0;
  }
}

/* whenReadyOnly: keep it non-visible but allow opacity transition to run */
.modal-not-ready:modal {
  visibility: hidden;
  pointer-events: none;
}

.modal-ready:modal {
  visibility: visible;
  pointer-events: auto;
}
</style>
