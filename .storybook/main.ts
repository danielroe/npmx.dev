import type { StorybookConfig } from '@storybook-vue/nuxt'

const config = {
  stories: ['../app/**/*.stories.@(js|ts)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook-vue/nuxt',
  features: {
    backgrounds: false,
  },
} satisfies StorybookConfig

export default config
