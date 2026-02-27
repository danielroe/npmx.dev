import type { BlogMetaResponse } from '#shared/schemas/atproto'
import type { ResolvedAuthor } from '#shared/schemas/blog'
import type { FederatedArticleInput, ResolvedFederatedArticle } from '#shared/types/blog-post'
import { type AtIdentifierString } from '@atproto/lex'

export async function useFederatedArticles(
  federatedArticles: FederatedArticleInput[],
): Promise<ResolvedFederatedArticle[]> {
  if (!federatedArticles || federatedArticles.length === 0) return []

  // 1. Prepare batch author request
  const authorQueryItems = federatedArticles.map(article => ({
    name: article.authorHandle,
    blueskyHandle: article.authorHandle,
  }))

  // 2. Execute Fetches
  const [authorResponse, ...blogMetaResponses] = await Promise.all([
    // Batch Author Fetch
    $fetch<{ authors: any[] }>('/api/atproto/bluesky-author-profiles', {
      query: { authors: JSON.stringify(authorQueryItems) },
    }).catch(error => {
      console.error('Failed to fetch bluesky authors:', error)
      return { authors: [] }
    }),

    // Parallel Blog Meta Fetches
    ...federatedArticles.map(article =>
      $fetch<BlogMetaResponse>('/api/atproto/blog-meta', {
        query: { url: article.url },
      }).catch(
        () =>
          ({
            // Fallback if scraping fails
            title: 'Untitled Article',
            author: undefined,
            description: undefined,
            image: undefined,
            _meta: {},
            _fetchedAt: '',
          }) as BlogMetaResponse,
      ),
    ),
  ])

  // 3. Merge Data
  return federatedArticles.map((article, index) => {
    const meta = blogMetaResponses[index]
    const authorProfile = authorResponse?.authors?.[index]

    const resolvedAuthor: ResolvedAuthor = {
      name: meta?.author || authorProfile?.displayName || article.authorHandle,
      blueskyHandle: article.authorHandle as AtIdentifierString,
      avatar: authorProfile?.avatar || null,
      profileUrl: authorProfile?.profileUrl || null,
    }

    return {
      url: article.url,
      title: meta?.title || 'Untitled',
      // INFO: Prefer input description, otherwise fallback to fetched meta
      description: article.description || meta?.description,
      image: meta?.image,
      author: resolvedAuthor,
    }
  })
}
