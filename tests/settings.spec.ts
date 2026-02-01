import { expect, test } from '@nuxt/test-utils/playwright'

test.describe('Settings', () => {
  test('settings persist across new tabs and reloads', async ({ page, goto }) => {
    await goto('/settings', { waitUntil: 'domcontentloaded' })

    const toggles = page.getByTestId('settings-toggle')
    const toggleCount = await toggles.count()
    expect(toggleCount).toBeGreaterThan(0)
    for (let i = 0; i < toggleCount; i += 1) {
      await toggles.nth(i).click()
    }

    const page2 = await page.context().newPage()
    await page2.goto('/nuxt', { waitUntil: 'domcontentloaded' })

    const storedBefore = await page.evaluate(() => localStorage.getItem('npmx-settings'))

    await page.reload()
    const storedAfter = await page.evaluate(() => localStorage.getItem('npmx-settings'))
    expect(storedAfter).toBe(storedBefore)

    await page2.reload()
    const storedFromOtherTab = await page2.evaluate(() => localStorage.getItem('npmx-settings'))
    expect(storedFromOtherTab).toBe(storedBefore)
  })
})
