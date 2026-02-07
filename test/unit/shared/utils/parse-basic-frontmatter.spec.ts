import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { parseBasicFrontmatter } from '../../../../shared/utils/parse-basic-frontmatter'

describe('parseBasicFrontmatter', () => {
  it('returns empty object for content without frontmatter', () => {
    expect(parseBasicFrontmatter('just some text')).toEqual({})
  })

  it('returns empty object for empty string', () => {
    expect(parseBasicFrontmatter('')).toEqual({})
  })

  it('returns empty object for empty frontmatter block', () => {
    expect(parseBasicFrontmatter('---\n---\n')).toEqual({})
  })

  it('parses string values', () => {
    const input = '---\ntitle: Hello World\nauthor: James\n---\n'
    expect(parseBasicFrontmatter(input)).toEqual({
      title: 'Hello World',
      author: 'James',
    })
  })

  it('strips surrounding quotes from values', () => {
    const input = '---\ntitle: "Hello World"\nauthor: \'James\'\n---\n'
    expect(parseBasicFrontmatter(input)).toEqual({
      title: 'Hello World',
      author: 'James',
    })
  })

  it('parses boolean true', () => {
    const input = '---\ndraft: true\n---\n'
    expect(parseBasicFrontmatter(input)).toEqual({ draft: true })
  })

  it('parses boolean false', () => {
    const input = '---\ndraft: false\n---\n'
    expect(parseBasicFrontmatter(input)).toEqual({ draft: false })
  })

  it('parses integer values', () => {
    const input = '---\ncount: 42\nnegative: -7\n---\n'
    expect(parseBasicFrontmatter(input)).toEqual({ count: 42, negative: -7 })
  })

  it('parses float values', () => {
    const input = '---\nrating: 4.5\nnegative: -3.14\n---\n'
    expect(parseBasicFrontmatter(input)).toEqual({ rating: 4.5, negative: -3.14 })
  })

  it('parses array values', () => {
    const input = '---\ntags: [foo, bar, baz]\n---\n'
    expect(parseBasicFrontmatter(input)).toEqual({
      tags: ['foo', 'bar', 'baz'],
    })
  })

  it('strips quotes from array items', () => {
    const input = '---\ntags: ["foo", \'bar\']\n---\n'
    expect(parseBasicFrontmatter(input)).toEqual({
      tags: ['foo', 'bar'],
    })
  })

  it('does not support nested arrays', () => {
    const input = '---\nmatrix: [[1, 2], [3, 4]]\n---\n'
    const result = parseBasicFrontmatter(input)
    expect(result.matrix).toEqual(['[1', '2]', '[3', '4]'])
  })

  it('handles values with colons', () => {
    const input = '---\nurl: https://example.com\n---\n'
    expect(parseBasicFrontmatter(input)).toEqual({
      url: 'https://example.com',
    })
  })

  it('skips lines without colons', () => {
    const input = '---\ntitle: Hello\ninvalid line\nauthor: James\n---\n'
    expect(parseBasicFrontmatter(input)).toEqual({
      title: 'Hello',
      author: 'James',
    })
  })

  it('trims keys and values', () => {
    const input = '---\n  title  :  Hello  \n---\n'
    expect(parseBasicFrontmatter(input)).toEqual({ title: 'Hello' })
  })

  it('handles frontmatter at end of file without trailing newline', () => {
    const input = '---\ntitle: Hello\n---'
    expect(parseBasicFrontmatter(input)).toEqual({ title: 'Hello' })
  })

  it('handles mixed types', () => {
    const input = '---\ntitle: My Post\ncount: 5\nrating: 9.8\npublished: true\ntags: [a, b]\n---\n'
    expect(parseBasicFrontmatter(input)).toEqual({
      title: 'My Post',
      count: 5,
      rating: 9.8,
      published: true,
      tags: ['a', 'b'],
    })
  })

  it.fails('handles string numerics as strings', () => {
    const input = "---\nid: '42'\n---"
    expect(parseBasicFrontmatter(input)).toEqual({ id: '42' })
  })

  it.fails('handles numbers using scientific notation', () => {
    const input = '---\nprice: 1e+50\n---'
    expect(parseBasicFrontmatter(input)).toEqual({ price: 1e50 })
  })

  it.fails('handles escaped double quote', () => {
    const input = '---\nquote: "He said, \\"Hello\\""\n---'
    expect(parseBasicFrontmatter(input)).toEqual({ quote: 'He said, "Hello"' })
  })

  it('strips leading and trailing whitespace', () => {
    const input = '---\ntext:   Something to say    \n---'
    expect(parseBasicFrontmatter(input)).toEqual({ text: 'Something to say' })
  })

  it.fails('handles numeric in arrays', () => {
    const input = '---\ntags: [1, 2]\n---'
    expect(parseBasicFrontmatter(input)).toEqual({ tags: [1, 2] })
  })

  it('handles strings with array like content', () => {
    const input = '---\ntext: Read the content of this array [1, 2, 3]\n---'
    expect(parseBasicFrontmatter(input)).toEqual({
      text: 'Read the content of this array [1, 2, 3]',
    })
  })

  it.fails('handles quoted strings with array as content', () => {
    const input = '---\nvalue: "[123]"\n---'
    expect(parseBasicFrontmatter(input)).toEqual({ value: '[123]' })
  })

  it.fails('handles string with commas when quoted in arrays', () => {
    const input = '---\ntags: ["foo, bar", "baz"]\n---'
    expect(parseBasicFrontmatter(input)).toEqual({ tags: ['foo, bar', 'baz'] })
  })

  it('should parse back every key-value pair from generated frontmatter', () => {
    const keyArb = fc.stringMatching(/^[a-z][a-z0-9_]*$/i)
    const singleValueArbs = (inArray: boolean) =>
      // for arrays: all values get parsed as strings and there should not be any comma in the value even for quoted strings
      [
        // For boolean values
        fc.boolean().map(b => ({ raw: `${b}`, expected: inArray ? `${b}` : b })),
        // For number values
        fc
          .oneof(
            // no support for -0
            fc.constant(0),
            // no support for scientific notation
            // anything <0.000001 will be displayed in scientific notation, and anything >999999999999999900000 too
            fc.double({ min: 0.000001, max: 999999999999999900000, noNaN: true }),
            fc.double({ min: -999999999999999900000, max: -0.000001, noNaN: true }),
          )
          .map(n => ({ raw: `${n}`, expected: inArray ? `${n}` : n })),
        // For string values
        fc.oneof(
          fc
            .stringMatching(inArray ? /^[^',]*$/ : /^[^']*$/) // single-quoted string
            .filter(v => Number.isNaN(Number(v))) // numbers, even quoted ones, get parsed as numbers
            .map(v => ({ raw: `'${v}'`, expected: v })),
          fc
            .stringMatching(inArray ? /^[^",]*$/ : /^[^"]*$/) // double-quoted string
            .filter(v => Number.isNaN(Number(v)))
            .map(v => ({ raw: `"${v}"`, expected: v })),
          fc // need to forbid [, ', " or space as first character
            .stringMatching(inArray ? /^[^,]+$/ : /^.+$/) // leading and trailing whitespace are ignored for unquoted strings
            .filter(v => Number.isNaN(Number(v)))
            .map(v => v.trim())
            .map(v => ({ raw: `'${v}'`, expected: v })),
        ),
      ]
    const valueArb = fc.oneof(
      ...singleValueArbs(false),
      fc
        .array(fc.oneof(...singleValueArbs(true)), { minLength: 1 }) // all values get read as strings, no support to empty arrays
        .map(arr => ({
          raw: `[${arr.map(v => v.raw).join(', ')}]`,
          expected: arr.map(v => v.expected),
        })),
    )
    const frontmatterContentArb = fc.dictionary(keyArb, valueArb).map(dict => {
      const entries = Object.entries(dict).map(([key, { raw, expected }]) => ({
        key,
        raw: `${key}: ${raw}`,
        expected,
      }))
      return {
        raw: `---\n${entries.map(e => e.raw).join('\n')}\n---\n`,
        expected: Object.fromEntries(entries.map(e => [e.key, e.expected])),
      }
    })
    fc.assert(
      fc.property(frontmatterContentArb, ({ raw, expected }) => {
        expect(parseBasicFrontmatter(raw)).toEqual(expected)
      }),
      { numRuns: 10000, endOnFailure: true },
    )
  })
})
