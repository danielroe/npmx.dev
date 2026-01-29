import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCssVariables, useCssVariable } from '#imports'
import type * as VueUseCore from '@vueuse/core'

vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual<typeof VueUseCore>('@vueuse/core')
  return {
    ...actual,
    useResizeObserver: vi.fn(),
    useMutationObserver: vi.fn(),
    useSupported: vi.fn(),
  }
})

import { useSupported, useMutationObserver } from '@vueuse/core'

function mockComputedStyle(values: Record<string, string>) {
  vi.stubGlobal('getComputedStyle', () => {
    return {
      getPropertyValue: (name: string) => values[name] ?? '',
    } as any
  })
}

describe('useCssVariables', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not attach html mutation observer when client is not supported', () => {
    vi.mocked(useSupported).mockReturnValueOnce(computed(() => false))

    mockComputedStyle({ '--bg': 'oklch(1 0 0)' })

    const { colors } = useCssVariables(['--bg'], { watchHtmlAttributes: true })

    expect(colors.value.bg).toBe('oklch(1 0 0)')
    expect(useMutationObserver).not.toHaveBeenCalled()
  })

  it('attaches html mutation observer when client is supported', () => {
    vi.mocked(useSupported).mockReturnValueOnce(computed(() => true))

    mockComputedStyle({ '--bg': 'oklch(1 0 0)' })

    useCssVariables(['--bg'], { watchHtmlAttributes: true })

    expect(useMutationObserver).toHaveBeenCalledTimes(1)
  })

  it('useCssVariable returns the single variable value (wrapper)', () => {
    vi.mocked(useSupported).mockReturnValueOnce(computed(() => true))

    mockComputedStyle({ '--fg-subtle': 'oklch(0.7 0 0)' })

    const { value } = useCssVariable('--fg-subtle')

    expect(value.value).toBe('oklch(0.7 0 0)')
  })
})
