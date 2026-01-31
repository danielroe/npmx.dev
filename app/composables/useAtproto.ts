import type { UserSession } from '#shared/schemas/userSession'

/** @public */
export async function useAtproto() {
  const {
    data: user,
    pending,
    clear,
  } = await useAsyncData<UserSession | null>('user-state', async () => {
    return await useRequestFetch()<UserSession>('/api/auth/session', {
      headers: { accept: 'application/json' },
    })
  })

  const logout = async () => {
    await useRequestFetch()<UserSession>('/api/auth/session', {
      method: 'delete',
      headers: { accept: 'application/json' },
    })

    clear()
  }

  return { user, pending, logout }
}
