import { defineNuxtModule, useNuxt } from 'nuxt/kit'
import { execSync } from 'node:child_process'
import { join } from 'node:path'

export default defineNuxtModule({
  meta: {
    name: 'lunaria',
  },
  setup() {
    const nuxt = useNuxt()

    nuxt.options.nitro.publicAssets ||= []
    nuxt.options.nitro.publicAssets.push({
      dir: join(nuxt.options.rootDir, 'dist/lunaria/'),
      baseURL: '/lunaria/',
      maxAge: 60 * 60 * 24, // 1 day
    })

    nuxt.hook('nitro:build:public-assets', async () => {
      execSync('node --experimental-transform-types ./lunaria/lunaria.ts', {
        cwd: nuxt.options.rootDir,
      })
    })
  },
})
