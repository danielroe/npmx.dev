import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import type { RecentItem } from '../../../../app/composables/useRecentlyViewed'

// Mock @vueuse/core to use a plain ref instead of localStorage
const storageRef = ref<RecentItem[]>([])
vi.mock('@vueuse/core', () => ({
  useLocalStorage: () => storageRef,
}))

// Must import after mock is set up
const { trackRecentView, useRecentlyViewed } =
  await import('../../../../app/composables/useRecentlyViewed')

describe('useRecentlyViewed', () => {
  beforeEach(() => {
    storageRef.value = []
  })

  it('returns an empty list initially', () => {
    const { items } = useRecentlyViewed()
    expect(items.value).toEqual([])
  })

  it('adds an item to an empty list', () => {
    trackRecentView({ type: 'package', name: 'vue', label: 'vue' })
    const { items } = useRecentlyViewed()
    expect(items.value).toHaveLength(1)
    expect(items.value[0]).toMatchObject({ type: 'package', name: 'vue', label: 'vue' })
    expect(items.value[0]!.viewedAt).toBeTypeOf('number')
  })

  it('deduplicates by type and name, bumping to front', () => {
    trackRecentView({ type: 'package', name: 'vue', label: 'vue' })
    trackRecentView({ type: 'package', name: 'react', label: 'react' })
    trackRecentView({ type: 'package', name: 'vue', label: 'vue' })

    const { items } = useRecentlyViewed()
    expect(items.value).toHaveLength(2)
    expect(items.value[0]!.name).toBe('vue')
    expect(items.value[1]!.name).toBe('react')
  })

  it('caps at 5 items, evicting the oldest', () => {
    for (let i = 1; i <= 6; i++) {
      trackRecentView({ type: 'package', name: `pkg-${i}`, label: `pkg-${i}` })
    }

    const { items } = useRecentlyViewed()
    expect(items.value).toHaveLength(5)
    expect(items.value[0]!.name).toBe('pkg-6')
    expect(items.value[4]!.name).toBe('pkg-2')
    // pkg-1 should have been evicted
    expect(items.value.find(i => i.name === 'pkg-1')).toBeUndefined()
  })

  it('allows different entity types to coexist', () => {
    trackRecentView({ type: 'package', name: 'vue', label: 'vue' })
    trackRecentView({ type: 'org', name: 'nuxt', label: '@nuxt' })
    trackRecentView({ type: 'user', name: 'sindresorhus', label: '~sindresorhus' })

    const { items } = useRecentlyViewed()
    expect(items.value).toHaveLength(3)
    expect(items.value.map(i => i.type)).toEqual(['user', 'org', 'package'])
  })

  it('does not deduplicate items with the same name but different type', () => {
    trackRecentView({ type: 'package', name: 'nuxt', label: 'nuxt' })
    trackRecentView({ type: 'org', name: 'nuxt', label: '@nuxt' })

    const { items } = useRecentlyViewed()
    expect(items.value).toHaveLength(2)
  })

  it('sets viewedAt on new entries', () => {
    const before = Date.now()
    trackRecentView({ type: 'package', name: 'vue', label: 'vue' })
    const after = Date.now()

    const { items } = useRecentlyViewed()
    expect(items.value[0]!.viewedAt).toBeGreaterThanOrEqual(before)
    expect(items.value[0]!.viewedAt).toBeLessThanOrEqual(after)
  })

  it('updates viewedAt when deduplicating', () => {
    trackRecentView({ type: 'package', name: 'vue', label: 'vue' })
    const firstViewedAt = useRecentlyViewed().items.value[0]!.viewedAt

    // Small delay to ensure timestamp differs
    vi.spyOn(Date, 'now').mockReturnValueOnce(firstViewedAt + 1000)
    trackRecentView({ type: 'package', name: 'vue', label: 'vue' })

    const { items } = useRecentlyViewed()
    expect(items.value[0]!.viewedAt).toBeGreaterThan(firstViewedAt)
  })
})
