import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('#server/utils/npm', () => ({
  fetchUserEmail: vi.fn(),
}))

const { getGravatarFromUsername } = await import('../../../../server/utils/gravatar')
const { fetchUserEmail } = await import('#server/utils/npm')

describe('gravatar utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when username is empty', async () => {
    const url = await getGravatarFromUsername('')

    expect(url).toBeNull()
    expect(fetchUserEmail).not.toHaveBeenCalled()
  })

  it('returns null when email is not available', async () => {
    vi.mocked(fetchUserEmail).mockResolvedValue(null)

    const url = await getGravatarFromUsername('user')

    expect(url).toBeNull()
    expect(fetchUserEmail).toHaveBeenCalledOnce()
  })

  it('builds a gravatar URL with a trimmed, lowercased email hash', async () => {
    const email = ' Test@Example.com '
    const normalized = 'test@example.com'
    const hash = createHash('md5').update(normalized).digest('hex')
    vi.mocked(fetchUserEmail).mockResolvedValue(email)

    const url = await getGravatarFromUsername('user')

    expect(url).toBe(`https://www.gravatar.com/avatar/${hash}?s=80&d=404`)
  })

  it('supports custom size', async () => {
    const email = 'user@example.com'
    const hash = createHash('md5').update(email).digest('hex')
    vi.mocked(fetchUserEmail).mockResolvedValue(email)

    const url = await getGravatarFromUsername('user', 128)

    expect(url).toBe(`https://www.gravatar.com/avatar/${hash}?s=128&d=404`)
  })

  it('trims the username before lookup', async () => {
    vi.mocked(fetchUserEmail).mockResolvedValue('user@example.com')

    await getGravatarFromUsername('  user  ')

    expect(fetchUserEmail).toHaveBeenCalledWith('user')
  })
})
