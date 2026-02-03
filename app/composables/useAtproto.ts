import type { UserSession } from '#shared/schemas/userSession'

export function useAtproto() {
  const {
    data: user,
    pending,
    refresh,
    clear,
  } = useFetch<UserSession | null>('/api/auth/session', {
    server: false,
    immediate: false,
  })

  onNuxtReady(() => refresh())

  async function logout() {
    await $fetch('/api/auth/session', {
      method: 'delete',
    })

    clear()
  }

  return { user, pending, logout }
}
