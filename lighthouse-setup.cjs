/**
 * Lighthouse CI puppeteer setup script.
 *
 * Sets the color mode (light/dark) before running accessibility audits
 * and intercepts client-side API requests using the same fixture data
 * as the Playwright E2E tests.
 *
 * The color mode is determined by the LIGHTHOUSE_COLOR_MODE environment variable.
 * If not set, defaults to 'dark'.
 *
 * Request interception uses CDP (Chrome DevTools Protocol) at the browser level
 * so it applies to all pages Lighthouse opens, not just the setup page.
 */

const mockRoutes = require('./test/fixtures/mock-routes.cjs')

module.exports = async function setup(browser, { url }) {
  const colorMode = process.env.LIGHTHOUSE_COLOR_MODE || 'dark'

  // Set up browser-level request interception via CDP.
  // This ensures mocking applies to pages Lighthouse creates after setup.
  setupBrowserRequestInterception(browser)

  const page = await browser.newPage()

  // Set localStorage before navigating so @nuxtjs/color-mode picks it up
  await page.evaluateOnNewDocument(mode => {
    localStorage.setItem('npmx-color-mode', mode)
  }, colorMode)

  // Navigate and wait for DOM only - Lighthouse will do its own full load
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })

  // Close the page - Lighthouse will open its own with localStorage already set
  await page.close()
}

/**
 * Set up request interception on every new page target the browser creates.
 * Uses Puppeteer's page-level request interception, applied automatically
 * to each new page via the 'targetcreated' event.
 *
 * @param {import('puppeteer').Browser} browser
 */
function setupBrowserRequestInterception(browser) {
  browser.on('targetcreated', async target => {
    if (target.type() !== 'page') return

    try {
      const page = await target.page()
      if (!page) return

      await page.setRequestInterception(true)
      page.on('request', request => {
        const requestUrl = request.url()
        const result = mockRoutes.matchRoute(requestUrl)

        if (result) {
          request.respond({
            status: result.response.status,
            contentType: result.response.contentType,
            body: result.response.body,
          })
        } else {
          request.continue()
        }
      })
    } catch {
      // Target may have been closed before we could set up interception.
      // This is expected for transient targets like service workers.
    }
  })
}
