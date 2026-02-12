# Why Storybook?

Storybook is a development environment for UI components that helps catch UI changes and provides integrations for various testing types. For testing, Storybook offers:

- **Accessibility tests** - Built-in a11y checks
- **Visual tests** - Compare JPG screenshots
- **Vitest tests** - Use stories directly in your unit tests

## Component Categories

The plan is to organize components into 3 categories.

### UI Library Components

Generic and reusable components used throughout your application.

- Examples: Button, Input, Modal, Card
- **Testing focus:** Props, variants, accessibility
- **Coverage:** All variants and states

### Composite Components

Single-use components that encapsulate one feature.

- Examples: UserProfile, WeeklyDownloadStats
- **Testing focus:** Integration patterns, user interactions
- **Coverage:** Common usage scenarios

### Page Components

**Full-page layouts** should match what the users see.

- Examples: HomePage, Dashboard, CheckoutPage
- **Testing focus:** Layout, responsive behavior, integration testing
- **Coverage:** Critical user flows and breakpoints

## Coverage Guidelines

### Which Components Need Stories?

TBD

## Project Conventions

### Place a `.stories.ts` file next to your component

```
components/
├── Button.vue
└── Button.stories.ts
```

### Story Template

```ts
// *.stories.ts
import type { Meta, StoryObj } from '@nuxtjs/storybook'
import Component from './Button.vue'

const meta = {
  component: Component,
  // component scope configuration goes here
} satisfies Meta<typeof Component>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  // story scope configuration goes here
}
```

## Configuration

Stories can be configured at three levels:

- **Global scope** (`.storybook/preview.ts`) - Applies to all stories
- **Component scope** - Applies to all stories for a specific component
- **Story scope** - Applies to individual stories only

## Global App Settings

Global application settings are added to the Storybook toolbar for easy testing and viewing. Configure these in `.storybook/preview.ts` under the `globalTypes` and `decorators` properties.

## Known Limitations

- `autodocs` usage is discouraged as it is buggy.
- Changing `i18n` in the toolbar doesn't update the language. A manual story reload is required.
