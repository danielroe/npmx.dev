import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Readme from '~/components/Readme.vue'

describe('Readme', () => {
  describe('rendering', () => {
    it('renders the provided HTML content', async () => {
      const component = await mountSuspended(Readme, {
        props: { html: '<p>Hello world</p>' },
      })
      expect(component.html()).toContain('Hello world')
    })
  })

  describe('hash link click handling', () => {
    it('allows native browser handling for hash links (does not prevent default)', async () => {
      const component = await mountSuspended(Readme, {
        props: { html: '<a href="#Installation">Installation</a>' },
      })

      const link = component.find('a')
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })
      link.element.dispatchEvent(clickEvent)

      // Hash links should NOT have default prevented - browser handles them natively
      // (Case normalization happens server-side when generating the href)
      expect(clickEvent.defaultPrevented).toBe(false)
    })
  })
})
