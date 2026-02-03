import type { UserSession } from '#shared/schemas/userSession'

export function useAtproto() {
  const {
    data: user,
    pending,
    clear,
  } = useFetch<UserSession | null>('/api/auth/session', {
    server: false,
  })

  async function logout() {
    await $fetch('/api/auth/session', {
      method: 'delete',
    })

    clear()
  }

  return { user, pending, logout }
}
