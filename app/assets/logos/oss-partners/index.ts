import LogoNuxt from '~/assets/logos/oss-partners/nuxt.svg'
import LogoOpenSourcePledge from '~/assets/logos/oss-partners/open-source-pledge.svg'
import LogoOpenSourcePledgeLight from '~/assets/logos/oss-partners/open-source-pledge-light.svg'
import LogoOxC from '~/assets/logos/oss-partners/oxc.svg'
import LogoRolldown from '~/assets/logos/oss-partners/rolldown.svg'
import LogoStorybook from '~/assets/logos/oss-partners/storybook.svg'
import LogoVite from '~/assets/logos/oss-partners/vite.svg'
import LogoVitest from '~/assets/logos/oss-partners/vitest.svg'
import LogoVue from '~/assets/logos/oss-partners/vue.svg'
import LogoAlgolia from '~/assets/logos/oss-partners/algolia.svg'
import LogoAlgoliaLight from '~/assets/logos/oss-partners/algolia-light.svg'

// The list is used on the about page. To add, simply upload the logos nearby and add an entry here. Prefer SVGs.
// For logo src, specify a string or object with the light and dark theme variants.
// Prefer original assets from partner sites to keep their brand identity.
//
// If there are no original assets and the logo is not universal, you can add only the dark theme variant
// and specify 'auto' for the light one - this will grayscale the logo and invert it in light mode.
export const OSS_PARTNERS = [
  {
    name: 'Open Source Pledge',
    logo: {
      dark: LogoOpenSourcePledge,
      light: LogoOpenSourcePledgeLight,
    },
    url: 'https://opensourcepledge.com/',
  },
  {
    name: 'Void Zero',
    items: [
      {
        name: 'Vite',
        logo: LogoVite,
        url: 'https://vite.dev/',
      },
      {
        name: 'OxC',
        logo: LogoOxC,
        url: 'https://oxc.rs/',
      },
      {
        name: 'Vitest',
        logo: LogoVitest,
        url: 'https://vitest.dev/',
      },
      {
        name: 'Rolldown',
        logo: LogoRolldown,
        url: 'https://rolldown.rs/',
      },
    ],
  },
  {
    name: 'Nuxt',
    logo: LogoNuxt,
    url: 'https://nuxt.com/',
  },
  {
    name: 'Vue',
    logo: LogoVue,
    url: 'https://vuejs.org/',
  },
  {
    name: 'Algolia',
    logo: {
      dark: LogoAlgolia,
      light: LogoAlgoliaLight,
    },
    url: 'https://algolia.com/',
  },
  {
    name: 'Storybook',
    logo: LogoStorybook,
    url: 'https://storybook.js.org/',
  },
]
