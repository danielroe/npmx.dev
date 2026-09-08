import { describe, expect, it } from 'vitest'
import { docsRoute, packageRoute } from '~/utils/router'

describe('packageRoute', () => {
  it.each([
    ['vue', '3.5.0', '', 'vue', '3.5.0'],
    ['@nuxt/kit', ' >= 3.0.0 < 4.0.0 ', '@nuxt', 'kit', '>=3.0.0<4.0.0'],
    ['vue', 'next', '', 'vue', 'next'],
  ] as const)('routes %s at %s', (packageName, version, org, name, expectedVersion) => {
    expect(packageRoute(packageName, version, '#dependencies')).toEqual({
      name: 'package-version',
      params: { org, name, version: expectedVersion },
      hash: '#dependencies',
    })
  })

  it.each([
    ['vite', 'npm:@voidzero-dev/vite-plus-core@0.3.1', '@voidzero-dev', 'vite-plus-core', '0.3.1'],
    ['string-width', 'npm:string-width@^4.2.0', '', 'string-width', '^4.2.0'],
    ['@scope/alias', 'npm:vue@next', '', 'vue', 'next'],
    ['alias', 'npm:@scope/pkg@>= 1.0.0 < 2.0.0', '@scope', 'pkg', '>=1.0.0<2.0.0'],
  ] as const)(
    'routes %s to its alias target %s',
    (packageName, version, org, name, expectedVersion) => {
      expect(packageRoute(packageName, version, '#dependencies')).toEqual({
        name: 'package-version',
        params: { org, name, version: expectedVersion },
        hash: '#dependencies',
      })
    },
  )

  it.each([
    ['npm:vue', '', 'vue'],
    ['npm:@scope/pkg', '@scope', 'pkg'],
  ] as const)('routes an alias without a version to %s', (version, org, name) => {
    expect(packageRoute('alias', version)).toEqual({
      name: 'package',
      params: { org, name },
    })
  })

  it.each([undefined, null, ''])('omits the version route for %s', version => {
    expect(packageRoute('@nuxt/kit', version)).toEqual({
      name: 'package',
      params: { org: '@nuxt', name: 'kit' },
    })
  })
})

describe('docsRoute', () => {
  it('emits a scoped name as two path segments (literal slash, not %2F)', () => {
    // A single "@org/name" segment would be URL-encoded to "@org%2Fname"; the
    // docs route must keep the scope slash literal by splitting it into two.
    expect(docsRoute('@vitest/pretty-format', '4.1.10')).toEqual({
      name: 'docs',
      params: { path: ['@vitest', 'pretty-format', 'v', '4.1.10'] },
    })
  })

  it('handles an unscoped name with a version', () => {
    expect(docsRoute('nuxt', '4.2.0')).toEqual({
      name: 'docs',
      params: { path: ['nuxt', 'v', '4.2.0'] },
    })
  })

  it('omits the version marker when no version is given', () => {
    expect(docsRoute('@vitest/pretty-format')).toEqual({
      name: 'docs',
      params: { path: ['@vitest', 'pretty-format'] },
    })
  })

  it('strips whitespace from the version', () => {
    expect(docsRoute('nuxt', ' 4.2.0 ')).toEqual({
      name: 'docs',
      params: { path: ['nuxt', 'v', '4.2.0'] },
    })
  })

  it('keeps a package literally named "v" separate from the version marker', () => {
    expect(docsRoute('v', '1.0.0')).toEqual({
      name: 'docs',
      params: { path: ['v', 'v', '1.0.0'] },
    })
  })

  it('handles a scoped package whose name is "v"', () => {
    expect(docsRoute('@org/v', '1.0.0')).toEqual({
      name: 'docs',
      params: { path: ['@org', 'v', 'v', '1.0.0'] },
    })
  })
})
