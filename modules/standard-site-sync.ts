import { defineNuxtModule, useNuxt } from 'nuxt/kit'
import * as site from '../shared/types/lexicons/site'

const PUBLICATION_SITE = 'https://npmx.dev'

export default defineNuxtModule({
  meta: {
    name: 'standard-site-sync',
  },
  setup() {
    const nuxt = useNuxt()
    if (nuxt.options._prepare) {
      return
    }
    nuxt.hook('content:file:afterParse', ctx => {
      const { content } = ctx

      const document = site.standard.document.$build({
        site: PUBLICATION_SITE,
        path: content.path as string,
        title: content.title as string,
        description: (content.excerpt || content.description) as string | undefined,
        tags: content.tags as string[] | undefined,
        publishedAt: new Date(content.date as string).toISOString(),
      })

      // TODO: Mock PDS push
      console.log('[standard-site-sync] Would push:', JSON.stringify(document, null, 2))
    })
  },
})
