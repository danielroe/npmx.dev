import type { ProviderId } from '../utils/git-providers'
import type { TocItem } from './readme'

export interface ChangelogReleaseInfo {
  type: 'release'
  provider: ProviderId
  repo: `${string}/${string}`
}

export interface ChangelogMarkdownInfo {
  type: 'md'
  provider: ProviderId
  /**
   * location within the repository
   */
  location: string
}

export type ChangelogInfo = ChangelogReleaseInfo | ChangelogMarkdownInfo

export interface ReleaseData {
  title: string // example "v1.x.x",
  html: string | null
  prerelease?: boolean
  draft?: boolean
  id: string | number
  publishedAt?: string
  toc?: TocItem[]
}
