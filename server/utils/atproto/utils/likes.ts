import { getCacheAdatper } from '../../cache'
import { $nsid as likeNsid } from '#shared/types/lexicons/dev/npmx/feed/like.defs'
import type { Backlink } from '~~/shared/utils/constellation'

/**
 * Likes for a npm package on npmx
 */
export type PackageLikes = {
  // The total likes found for the package
  totalLikes: number
  // If the logged in user has liked the package, false if not logged in
  userHasLiked: boolean
}

const CACHE_PREFIX = 'atproto-likes:'
const CACHE_PACKAGE_TOTAL_KEY = (packageName: string) => `${CACHE_PREFIX}:${packageName}:total`
const CACHE_USER_LIKES_KEY = (packageName: string, did: string) =>
  `${CACHE_PREFIX}${packageName}:users:${did}`

const CACHE_MAX_AGE = CACHE_MAX_AGE_ONE_MINUTE * 5

export class PackageLikesUtils {
  private readonly constellation: Constellation
  private readonly cache: CacheAdapter

  constructor(cachedFunction: CachedFetchFunction) {
    this.constellation = new Constellation(cachedFunction)
    this.cache = getCacheAdatper(CACHE_PREFIX)
  }

  /**
   * Gets the true total count of likes for a npm package from the network
   * @param subjectRef
   * @returns
   */
  private async constellationLikes(subjectRef: string) {
    // TODO: I need to see what failed fetch calls do here
    const { data: totalLinks } = await this.constellation.getLinksDistinctDids(
      subjectRef,
      likeNsid,
      '.subjectRef',
      //Limit doesn't matter here since we are just counting the total likes
      1,
      undefined,
      0,
    )
    return totalLinks.total
  }

  /**
   * Checks if the user has liked the npm package from the network
   * @param subjectRef
   * @param usersDid
   * @returns
   */
  private async constellationUserHasLiked(subjectRef: string, usersDid: string) {
    const { data: userLikes } = await this.constellation.getBackLinks(
      subjectRef,
      likeNsid,
      'subjectRef',
      //Limit doesn't matter here since we are just counting the total likes
      1,
      undefined,
      false,
      [[usersDid]],
      0,
    )
    //TODO: need to double check this logic
    return userLikes.total > 0
  }

  /**
   * Gets the likes for a npm package on npmx. Tries a local cahce first, if not found uses constellation
   * @param packageName
   * @param usersDid
   * @returns
   */
  async getLikes(packageName: string, usersDid?: string | undefined) {
    //TODO: May need to do some clean up on the package name, and maybe even hash it? some of the charcteres may be a bit odd as keys
    const totalLikesKey = CACHE_PACKAGE_TOTAL_KEY(packageName)
    const subjectRef = PACKAGE_SUBJECT_REF(packageName)

    const cachedLikes = await this.cache.get<number>(totalLikesKey)
    let totalLikes = 0
    if (cachedLikes) {
      totalLikes = cachedLikes
    } else {
      totalLikes = await this.constellationLikes(subjectRef)
      await this.cache.set(totalLikesKey, totalLikes, CACHE_MAX_AGE)
    }

    let userHasLiked = false
    if (usersDid) {
      const userCachedLike = await this.cache.get<boolean>(
        CACHE_USER_LIKES_KEY(packageName, usersDid),
      )
      if (userCachedLike) {
        userHasLiked = userCachedLike
      } else {
        userHasLiked = await this.constellationUserHasLiked(subjectRef, usersDid)
        await this.cache.set(
          CACHE_USER_LIKES_KEY(packageName, usersDid),
          userHasLiked,
          CACHE_MAX_AGE,
        )
      }
    }

    return {
      totalLikes: totalLikes,
      userHasLiked,
    } as PackageLikes
  }

  /**
   * Gets the definite answer if the user has liked a npm package. Either from the cache or the network
   * @param packageName
   * @param usersDid
   * @returns
   */
  async hasTheUserLikedThePackage(packageName: string, usersDid: string) {
    const cached = await this.cache.get<boolean>(CACHE_USER_LIKES_KEY(packageName, usersDid))
    if (cached !== undefined) {
      return cached
    }
    const subjectRef = PACKAGE_SUBJECT_REF(packageName)

    const userHasLiked = await this.constellationUserHasLiked(subjectRef, usersDid)
    await this.cache.set(CACHE_USER_LIKES_KEY(packageName, usersDid), userHasLiked, CACHE_MAX_AGE)
    return userHasLiked
  }

  /**
   * It is asummed it has been checked by this point that if a user has liked a package and the new like was made as a record
   * to the user's atproto repostiory
   * @param packageName
   * @param usersDid
   */
  async likeAPackageAndRetunLikes(packageName: string, usersDid: string): Promise<PackageLikes> {
    const totalLikesKey = CACHE_PACKAGE_TOTAL_KEY(packageName)
    const subjectRef = PACKAGE_SUBJECT_REF(packageName)

    let totalLikes = await this.cache.get<number>(totalLikesKey)
    if (!totalLikes) {
      totalLikes = await this.constellationLikes(subjectRef)
      totalLikes = totalLikes + 1
      await this.cache.set(totalLikesKey, totalLikes, CACHE_MAX_AGE)
    }
    // We already know the user has not liked the package so set in the cache
    await this.cache.set(CACHE_USER_LIKES_KEY(packageName, usersDid), true, CACHE_MAX_AGE)
    return {
      totalLikes: totalLikes,
      userHasLiked: true,
    } as PackageLikes
  }

  /**
   * We need to get the record the user has that they liked the package
   * @param packageName
   * @param usersDid
   * @returns
   */
  async getTheUsersLikedRecord(
    packageName: string,
    usersDid: string,
  ): Promise<Backlink | undefined> {
    const subjectRef = PACKAGE_SUBJECT_REF(packageName)
    const { data: userLikes } = await this.constellation.getBackLinks(
      subjectRef,
      likeNsid,
      'subjectRef',
      //Limit doesn't matter here since we are just counting the total likes
      1,
      undefined,
      false,
      [[usersDid]],
      0,
    )
    if (userLikes.total > 0 && userLikes.records.length > 0) {
      return userLikes.records[0]
    }
  }

  /**
   * At this point you should have checked if the user had a record for the package on the network and removed it before updating the cache
   * @param packageName
   * @param usersDid
   * @returns
   */
  async unlikeAPackageAndReturnLikes(packageName: string, usersDid: string): Promise<PackageLikes> {
    const totalLikesKey = CACHE_PACKAGE_TOTAL_KEY(packageName)
    const subjectRef = PACKAGE_SUBJECT_REF(packageName)

    let totalLikes = await this.cache.get<number>(totalLikesKey)
    if (!totalLikes) {
      totalLikes = await this.constellationLikes(subjectRef)
    }
    totalLikes = totalLikes - 1
    await this.cache.set(totalLikesKey, totalLikes, CACHE_MAX_AGE)

    await this.cache.delete(CACHE_USER_LIKES_KEY(packageName, usersDid))
    return {
      totalLikes: totalLikes,
      userHasLiked: false,
    } as PackageLikes
  }
}
