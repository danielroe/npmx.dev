import Markdown from 'unplugin-vue-markdown/vite'
import { addVitePlugin, defineNuxtModule, useNuxt } from 'nuxt/kit'
import shiki from '@shikijs/markdown-it'
import { defu } from 'defu'

export default defineNuxtModule({
  meta: {
    name: 'blog',
  },
  setup() {
    const nuxt = useNuxt()

    nuxt.options.extensions.push('.md')
    nuxt.options.vite.vue = defu(nuxt.options.vite.vue, {
      include: [/\.vue($|\?)/, /\.(md|markdown)($|\?)/],
    })

    addVitePlugin(() =>
      Markdown({
        include: [/\.(md|markdown)($|\?)/],
        wrapperComponent: 'BlogPostWrapper',
        wrapperClasses: 'text-fg-muted leading-relaxed',
        async markdownItSetup(md) {
          md.use(
            await shiki({
              themes: {
                dark: 'github-dark',
                light: 'github-light',
              },
            }),
          )
        },
      }),
    )
  },
})
