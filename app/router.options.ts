import type { RouterConfig } from 'nuxt/schema'

/**
 * Restore RFC 3986 unreserved/safe characters that encodeURIComponent encodes
 * but are readable and safe in query strings: @ / : ,
 */
function readableEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%40/g, '@')
    .replace(/%2F/gi, '/')
    .replace(/%3A/gi, ':')
    .replace(/%2C/gi, ',')
}

function stringifyQuery(query: Record<string, any>): string {
  const parts: string[] = []
  for (const key in query) {
    const value = query[key]
    if (value == null) continue
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v != null) {
          parts.push(`${encodeURIComponent(key)}=${readableEncode(String(v))}`)
        }
      }
    } else {
      parts.push(`${encodeURIComponent(key)}=${readableEncode(String(value))}`)
    }
  }
  return parts.join('&')
}

export default <RouterConfig>{
  stringifyQuery,
}
