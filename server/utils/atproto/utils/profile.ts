import type { MiniDoc, NPMXProfile } from '~~/shared/types/social'

//Cache keys and helpers
const CACHE_PREFIX = 'atproto-profile:'
const CACHE_PROFILE_MINI_DOC = (handle: string) => `${CACHE_PREFIX}${handle}:minidoc`
const CACHE_PROFILE_KEY = (did: string) => `${CACHE_PREFIX}${did}:profile`

const CACHE_MAX_AGE = CACHE_MAX_AGE_ONE_MINUTE * 5

/**
 * Logic to handle and update profile queries
 */
export class ProfileUtils {
  private readonly cache: CacheAdapter
  // TODO: create Slingshot client (like Constellation class)

  constructor() {
    this.cache = getCacheAdapter('generic')
  }

  private async slingshotMiniDoc(handle: string) {
    const miniDocKey = CACHE_PROFILE_MINI_DOC(handle)
    const cachedMiniDoc = await this.cache.get<MiniDoc>(miniDocKey)

    let miniDoc
    if (cachedMiniDoc) {
      miniDoc = cachedMiniDoc
    } else {
      const resolveUrl = `https://${SLINGSHOT_HOST}/xrpc/blue.microcosm.identity.resolveMiniDoc?identifier=${encodeURIComponent(handle)}`
      const response = await fetch(resolveUrl, {
        headers: { 'User-Agent': 'npmx' },
      })
      const value = (await response.json()) as MiniDoc

      miniDoc = value
      await this.cache.set(miniDocKey, value, CACHE_MAX_AGE)
    }

    return miniDoc
  }

  /**
   * Gets an npmx profile based on a handle
   * @param handle
   * @returns
   */
  async getProfile(handle: string): Promise<NPMXProfile | undefined> {
    const profileKey = CACHE_PROFILE_KEY(handle)
    const cachedProfile = await this.cache.get<NPMXProfile>(profileKey)

    let profile: NPMXProfile | undefined
    if (cachedProfile) {
      profile = cachedProfile
    } else {
      const miniDoc = await this.slingshotMiniDoc(handle)
      const profileUri = `at://${miniDoc.did}/dev.npmx.actor.profile/self`
      const response = await fetch(
        `https://${SLINGSHOT_HOST}/xrpc/blue.microcosm.repo.getRecordByUri?at_uri=${profileUri}`,
        {
          headers: { 'User-Agent': 'npmx' },
        },
      )
      if (response.ok) {
        const { value } = (await response.json()) as { value: NPMXProfile }
        profile = value
        await this.cache.set(profileKey, profile, CACHE_MAX_AGE)
      }
    }

    return profile
  }

  async updateProfileCache(handle: string, profile: NPMXProfile): Promise<NPMXProfile | undefined> {
    const miniDoc = await this.slingshotMiniDoc(handle)
    const profileKey = CACHE_PROFILE_KEY(miniDoc.handle)
    await this.cache.set(profileKey, profile, CACHE_MAX_AGE)
    return profile
  }
}
