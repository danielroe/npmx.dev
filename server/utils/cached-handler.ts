import type { H3Event, EventHandler } from 'h3'
import { shouldBypassCacheFor } from './cache-bypass'

// Get the options type from the defineCachedEventHandler function
type CachedEventHandlerOptions = NonNullable<Parameters<typeof defineCachedEventHandler>[1]>

/**
 * Extended options that include a bypass key for fine-grained cache control.
 */
type BypassableCachedEventHandlerOptions = CachedEventHandlerOptions & {
  /**
   * Unique key for this handler's cache bypass.
   * When `?__bypass_cache__=<key>` is present, only this handler's cache is bypassed.
   * When `?__bypass_cache__=handler` is present, all handlers are bypassed.
   */
  bypassKey?: string
}

/**
 * Wrapper around `defineCachedEventHandler` that automatically respects the
 * `__bypass_cache__` query parameter for cache bypass.
 *
 * Supports both category-level and specific key bypass:
 * - `?__bypass_cache__=handler` - Bypass all handlers
 * - `?__bypass_cache__=readme` - Bypass only handlers with bypassKey='readme'
 */
export function defineBypassableCachedEventHandler<T extends EventHandler>(
  handler: T,
  options: BypassableCachedEventHandlerOptions = {},
) {
  const { bypassKey, ...cachedOptions } = options
  const originalShouldBypassCache = cachedOptions.shouldBypassCache

  return defineCachedEventHandler(handler, {
    ...cachedOptions,
    shouldBypassCache: (event: H3Event) => {
      // Check cache bypass (category or specific key)
      if (shouldBypassCacheFor(event, 'handler', bypassKey)) {
        if (import.meta.dev) {
          // eslint-disable-next-line no-console
          console.log(`[cached-handler] BYPASS (${bypassKey || 'handler'}): ${event.path}`)
        }
        return true
      }

      // Fall back to original shouldBypassCache if provided
      if (originalShouldBypassCache) {
        return originalShouldBypassCache(event)
      }

      return false
    },
  })
}
