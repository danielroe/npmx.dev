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

  test('/settings has no hydration mismatches', async ({ goto, hydrationErrors }) => {
    await goto('/settings', { waitUntil: 'hydration' })

    expect(hydrationErrors).toEqual([])
  })

  test('/privacy has no hydration mismatches', async ({ goto, hydrationErrors }) => {
    await goto('/privacy', { waitUntil: 'hydration' })

    expect(hydrationErrors).toEqual([])
  })

  test('/compare has no hydration mismatches', async ({ goto, hydrationErrors }) => {
    await goto('/compare', { waitUntil: 'hydration' })

    expect(hydrationErrors).toEqual([])
  })

  test('/packages/nuxt has no hydration mismatches', async ({ goto, hydrationErrors }) => {
    await goto('/packages/nuxt', { waitUntil: 'hydration' })

    expect(hydrationErrors).toEqual([])
  })
})
