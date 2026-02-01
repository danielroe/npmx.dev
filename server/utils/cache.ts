import { Redis } from '@upstash/redis'

/**
 * Generic cache adapter to allow using a local cache during development and redis in production
 */
export interface CacheAdapter {
  get<T>(key: string): Promise<T | undefined>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
}

/**
 * Local cache data entry
 */
interface LocalCachedEntry<T = unknown> {
  value: T
  ttl?: number
  cachedAt: number
}

/**
 * Checks to see if a cache entry is stale locally
 * @param entry - The entry from the locla cache
 * @returns
 */
function isCacheEntryStale(entry: LocalCachedEntry): boolean {
  if (!entry.ttl) return false
  const now = Date.now()
  const expiresAt = entry.cachedAt + entry.ttl * 1000
  return now > expiresAt
}

/**
 * Local implmentation of a cache to be used during development
 */
export class StorageCacheAdapter implements CacheAdapter {
  private readonly storage = useStorage('generic-cache')

  async get<T>(key: string): Promise<T | undefined> {
    const result = await this.storage.getItem<LocalCachedEntry<T>>(key)
    if (!result) return
    if (isCacheEntryStale(result)) {
      await this.storage.removeItem(key)
      return
    }
    return result.value
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.storage.setItem(key, { value, ttl, cachedAt: Date.now() })
  }

  async delete(key: string): Promise<void> {
    await this.storage.removeItem(key)
  }
}

/**
 * Redis cache storage with TTL handled by redis for use in production
 */
export class RedisCacheAdatper implements CacheAdapter {
  private readonly redis: Redis
  private readonly prefix: string

  formatKey(key: string): string {
    return `${this.prefix}:${key}`
  }

  constructor(redis: Redis, prefix: string) {
    this.redis = redis
    this.prefix = prefix
  }

  async get<T>(key: string): Promise<T | undefined> {
    const formattedKey = this.formatKey(key)
    const value = await this.redis.get<T>(formattedKey)
    if (!value) return
    return value
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const formattedKey = this.formatKey(key)
    if (ttl) {
      await this.redis.setex(formattedKey, ttl, value)
    } else {
      await this.redis.set(formattedKey, value)
    }
  }

  async delete(key: string): Promise<void> {
    const formattedKey = this.formatKey(key)
    await this.redis.del(formattedKey)
  }
}

export function getCacheAdatper(prefix: string): CacheAdapter {
  const config = useRuntimeConfig()

  if (!import.meta.dev && config.upstash?.redisRestUrl && config.upstash?.redisRestToken) {
    const redis = new Redis({
      url: config.upstash.redisRestUrl,
      token: config.upstash.redisRestToken,
    })
    return new RedisCacheAdatper(redis, prefix)
  }
  return new StorageCacheAdapter()
}
