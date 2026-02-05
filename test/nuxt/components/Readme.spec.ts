import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Readme from '~/components/Readme.vue'

// Mock scrollToAnchor
vi.mock('~/utils/scrollToAnchor', () => ({
  scrollToAnchor: vi.fn(),
}))

// Import the mocked function for assertions
import { scrollToAnchor } from '~/utils/scrollToAnchor'

describe('Readme', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('renders the provided HTML content', async () => {
      const component = await mountSuspended(Readme, {
        props: { html: '<p>Hello world</p>' },
      })
      expect(component.html()).toContain('Hello world')
    })

    it('renders as an article element with readme class', async () => {
      const component = await mountSuspended(Readme, {
        props: { html: '<p>Content</p>' },
      })
      const article = component.find('article.readme')
      expect(article.exists()).toBe(true)
    })
  })

  describe('hash link click handling', () => {
    it('intercepts hash link clicks and calls scrollToAnchor', async () => {
      const component = await mountSuspended(Readme, {
        props: { html: '<a href="#installation">Installation</a>' },
      })

      const link = component.find('a')
      await link.trigger('click')

      expect(scrollToAnchor).toHaveBeenCalledWith('installation')
    })

    it('lowercases the ID when calling scrollToAnchor', async () => {
      const component = await mountSuspended(Readme, {
        props: { html: '<a href="#Installation">Installation</a>' },
      })

      const link = component.find('a')
      await link.trigger('click')

      expect(scrollToAnchor).toHaveBeenCalledWith('installation')
    })

    it('handles user-content prefixed hash links', async () => {
      const component = await mountSuspended(Readme, {
        props: { html: '<a href="#user-content-getting-started">Getting Started</a>' },
      })

      const link = component.find('a')
      await link.trigger('click')

      expect(scrollToAnchor).toHaveBeenCalledWith('user-content-getting-started')
    })

    it('handles mixed case user-content hash links', async () => {
      const component = await mountSuspended(Readme, {
        props: { html: '<a href="#User-Content-API">API</a>' },
      })

      const link = component.find('a')
      await link.trigger('click')

      expect(scrollToAnchor).toHaveBeenCalledWith('user-content-api')
    })
  })

  describe('non-hash link handling', () => {
    it('does not intercept external links', async () => {
      const component = await mountSuspended(Readme, {
        props: { html: '<a href="https://example.com">External</a>' },
      })

      const link = component.find('a')
      await link.trigger('click')

      expect(scrollToAnchor).not.toHaveBeenCalled()
    })

    it('does not intercept relative links', async () => {
      const component = await mountSuspended(Readme, {
        props: { html: '<a href="./docs/readme.md">Docs</a>' },
      })

      const link = component.find('a')
      await link.trigger('click')

      expect(scrollToAnchor).not.toHaveBeenCalled()
    })
  })
})
