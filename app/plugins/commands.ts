export default defineNuxtPlugin(() => {
  const router = useRouter()
  const { $i18n } = useNuxtApp()
  const t = $i18n.t
  const { register } = useCommandRegistry()

  register({
    id: 'packages:search',
    name: t('command.package_search'),
    description: t('command.package_search_desc'),
    handler: async () => {
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[type="search"], input[name="q"]',
      )

      if (searchInput) {
        searchInput.focus()
        return
      }

      router.push('/search')
    },
  })
})
