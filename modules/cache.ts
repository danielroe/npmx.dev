import { defineNuxtModule } from 'nuxt/kit'
import { provider } from 'std-env'

export default defineNuxtModule({
  meta: {
    name: 'vercel-cache',
  },
  setup(_, nuxt) {
    if (provider !== 'vercel') {
      return
    }

    nuxt.hook('nitro:config', nitroConfig => {
      nitroConfig.storage = nitroConfig.storage || {}
      nitroConfig.storage.cache = {
        driver: 'vercel-runtime-cache',
        ...nitroConfig.storage.cache,
      }
    })
  },
})
