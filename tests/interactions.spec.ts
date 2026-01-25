import { expect, test } from '@nuxt/test-utils/playwright'

test.describe('Search Pages', () => {
  test('/search?q=vue → keyboard navigation (arrow keys + enter)', async ({ page, goto }) => {
    await goto('/search?q=vue', { waitUntil: 'domcontentloaded' })

    await expect(page.locator('text=/found \\d+/i')).toBeVisible()

    const searchInput = page.locator('input[type="search"]')
    await expect(searchInput).toBeFocused()

    const firstResult = page.locator('[data-result-index="0"]').first()
    await expect(firstResult).toBeVisible()

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/package\//)

    await page.goBack()
    await expect(searchInput).toBeFocused()
    await expect(page.locator('text=/found \\d+/i')).toBeVisible()

    await page.keyboard.press('ArrowDown')
    const secondResult = page.locator('[data-result-index="1"]').first()
    await expect(secondResult).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/package\//)
  })

  test('/search?q=vue → "/" focuses the search input from results', async ({ page, goto }) => {
    await goto('/search?q=vue', { waitUntil: 'domcontentloaded' })

    await expect(page.locator('text=/found \\d+/i')).toBeVisible()

    await page.locator('[data-result-index="0"]').first().focus()
    await page.keyboard.press('/')
    await expect(page.locator('input[type="search"]')).toBeFocused()
  })
})
