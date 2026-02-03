import { defineNuxtModule, useNuxt } from 'nuxt/kit'
import { defu } from 'defu'
import { isCI, provider } from 'std-env'

export default defineNuxtModule({
  meta: {
    name: 'prod-env',
  },
  setup() {
    const nuxt = useNuxt()

    const isGitHubActions = provider === 'github_actions' || !!process.env.GITHUB_ACTIONS
    const isTest = process.env.NODE_ENV === 'test'

    console.log('[prod-env]', {
      isCI,
      provider,
      isGitHubActions,
      isTest,
      GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
    })

    if (isCI && !isGitHubActions && !isTest) {
      console.log('[prod-env] Enabling hydration debugging')
      nuxt.options.debug = defu(nuxt.options.debug, { hydration: true })
    }
  },
})
