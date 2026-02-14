import type { Meta, StoryObj } from '@nuxtjs/storybook'
import Component from './Base.vue'

const meta = {
  component: Component,
} satisfies Meta<typeof Component>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {},
  render: args => ({
    components: { Component },
    setup() {
      return { args }
    },
    template: '<Component v-bind="args">Primary Button</Component>',
  }),
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
  render: args => ({
    components: { Component },
    setup() {
      return { args }
    },
    template: '<Component v-bind="args">Secondary Button</Component>',
  }),
}

export const Small: Story = {
  args: {
    variant: 'secondary',
    size: 'small',
  },
  render: args => ({
    components: { Component },
    setup() {
      return { args }
    },
    template: '<Component v-bind="args">Small Button</Component>',
  }),
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: args => ({
    components: { Component },
    setup() {
      return { args }
    },
    template: '<Component v-bind="args">Disabled Button</Component>',
  }),
}

export const WithIcon: Story = {
  args: {
    variant: 'secondary',
    classicon: 'i-carbon:search',
  },
  render: args => ({
    components: { Component },
    setup() {
      return { args }
    },
    template: '<Component v-bind="args">Search</Component>',
  }),
}

export const WithKeyboardShortcut: Story = {
  args: {
    variant: 'secondary',
    ariaKeyshortcuts: '/',
  },
  render: args => ({
    components: { Component },
    setup() {
      return { args }
    },
    template: '<Component v-bind="args">Search</Component>',
  }),
}

export const Block: Story = {
  args: {
    block: true,
  },
  render: args => ({
    components: { Component },
    setup() {
      return { args }
    },
    template: '<Component v-bind="args">Full Width Button</Component>',
  }),
}
