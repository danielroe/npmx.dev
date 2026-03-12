import { describe, it, expect, beforeEach } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { usePackageListPreferences } from '../../../app/composables/usePackageListPreferences'
import { DEFAULT_PREFERENCES } from '../../../shared/types/preferences'

const STORAGE_KEY = 'npmx-list-prefs'

async function mountWithSetup<T>(setupFn: () => T) {
  let result: T
  const wrapper = mount(
    defineComponent({
      name: 'TestHarness',
      setup() {
        result = setupFn()
        return () => null
      },
    }),
    { attachTo: document.body },
  )
  await nextTick()
  return { wrapper, result: result! }
}

function setLocalStorage(stored: Record<string, unknown>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
}

describe('usePackageListPreferences', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initializes with default values when storage is empty', async () => {
    const { result, wrapper } = await mountWithSetup(() => usePackageListPreferences())
    expect(result.preferences.value).toEqual(DEFAULT_PREFERENCES)
    wrapper.unmount()
  })

  it('loads and merges values from localStorage', async () => {
    const stored = { viewMode: 'table' }
    setLocalStorage(stored)
    const { result, wrapper } = await mountWithSetup(() => usePackageListPreferences())
    expect(result.preferences.value.viewMode).toBe('table')
    expect(result.preferences.value.paginationMode).toBe(DEFAULT_PREFERENCES.paginationMode)
    expect(result.preferences.value.pageSize).toBe(DEFAULT_PREFERENCES.pageSize)
    expect(result.preferences.value.columns).toEqual(DEFAULT_PREFERENCES.columns)
    wrapper.unmount()
  })

  it('handles array merging by replacement', async () => {
    const stored = { columns: [] }
    setLocalStorage(stored)
    const { result, wrapper } = await mountWithSetup(() => usePackageListPreferences())
    expect(result.preferences.value.columns).toEqual([])
    wrapper.unmount()
  })
})
