import type { RemovableRef } from '@vueuse/core'
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

const MAX_RECENT_ITEMS = 5
const STORAGE_KEY = 'npmx-recent'

export type RecentItemType = 'package' | 'org' | 'user'

export interface RecentItem {
  type: RecentItemType
  /** Canonical identifier: package name, org name (without @), or username */
  name: string
  /** Display label shown on homepage (e.g. "@nuxt", "~sindresorhus") */
  label: string
  /** Unix timestamp (ms) of most recent view */
  viewedAt: number
}

let recentRef: RemovableRef<RecentItem[]> | null = null

function getRecentRef() {
  if (!recentRef) {
    recentRef = useLocalStorage<RecentItem[]>(STORAGE_KEY, [])
  }
  return recentRef
}

export function useRecentlyViewed() {
  const items = getRecentRef()
  return { items: computed(() => items.value) }
}

export function trackRecentView(item: Omit<RecentItem, 'viewedAt'>) {
  if (import.meta.server) return
  const items = getRecentRef()
  const filtered = items.value.filter(
    existing => !(existing.type === item.type && existing.name === item.name),
  )
  filtered.unshift({ ...item, viewedAt: Date.now() })
  items.value = filtered.slice(0, MAX_RECENT_ITEMS)
}
