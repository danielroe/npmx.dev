import { expect, test } from './test-utils'

test.describe('Hydration', () => {
  test('/ (homepage) has no hydration mismatches', async ({ goto, hydrationErrors }) => {
    await goto('/', { waitUntil: 'hydration' })

    expect(hydrationErrors).toEqual([])
  })

  test('/about has no hydration mismatches', async ({ goto, hydrationErrors }) => {
    await goto('/about', { waitUntil: 'hydration' })

    expect(hydrationErrors).toEqual([])
  })
})
