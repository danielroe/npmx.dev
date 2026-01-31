export function useModal(modalId: string) {
  const modal = document.querySelector<HTMLDialogElement>(`#${modalId}`)

  function open() {
    if (modal) {
      setTimeout(() => {
        modal.showModal()
      })
    }
  }

  function close() {
    if (modal) {
      modal.close()
    }
  }

  return {
    open,
    close,
  }
}
