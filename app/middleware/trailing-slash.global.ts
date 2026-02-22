/**
 * Removes trailing slashes from URLs.
 *
 * This middleware only runs in development to maintain consistent behavior.
 * In production, Vercel handles this redirect via vercel.json.
 *
 * - /package/vue/ → /package/vue
 * - /docs/getting-started/?query=value → /docs/getting-started?query=value
 */
export default defineNuxtRouteMiddleware(to => {
  if (to.path !== '' && !to.path.endsWith('/')) {
    return navigateTo(
      {
        path: to.path + '/',
        query: to.query,
        hash: to.hash,
      },
      { replace: true },
    )
  }
})
