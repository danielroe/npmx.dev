type MiniDoc = {
  did: string
  handle: string
  pds: string
}

/** @public */
export async function useAtproto() {
  const {
    data: user,
    pending,
    clear,
  } = await useAsyncData<MiniDoc | null>('user-state', async () => {
    const data = await useRequestFetch()<MiniDoc>('/api/auth/session', {
      headers: { accept: 'application/json' },
    })

    return data
  })

  const logout = async () => {
    await useRequestFetch()<MiniDoc>('/api/auth/session', {
      method: 'delete',
      headers: { accept: 'application/json' },
    })

    clear()
  }

  return { user, pending, logout }
}
