import { describe, expect, it } from 'vitest'
import { decodeHtmlEntities } from '../../../../shared/utils/html'

describe('decodeHtmlEntities', () => {
  it.each([
    ['&amp;', '&'],
    ['&lt;', '<'],
    ['&gt;', '>'],
    ['&quot;', '"'],
    ['&#39;', "'"],
    ['&apos;', "'"],
    ['&nbsp;', '\u00A0'],
  ] as const)('%s → %s', (input, expected) => {
    expect(decodeHtmlEntities(input)).toBe(expected)
  })

  it('decodes multiple entities in one string', () => {
    expect(decodeHtmlEntities('a &amp; b &lt; c')).toBe('a & b < c')
  })

  it('leaves plain text unchanged', () => {
    expect(decodeHtmlEntities('say no to bloat')).toBe('say no to bloat')
  })

  it('leaves unknown entities unchanged', () => {
    expect(decodeHtmlEntities('&unknown;')).toBe('&unknown;')
  })
})
