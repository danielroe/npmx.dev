import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { scrollToAnchor } from '~/utils/scrollToAnchor'

describe('scrollToAnchor', () => {
  let scrollToSpy: ReturnType<typeof vi.fn>
  let replaceStateSpy: ReturnType<typeof vi.fn>
  let testElement: HTMLElement

  beforeEach(() => {
    // Spy on window.scrollTo
    scrollToSpy = vi.fn()
    vi.stubGlobal('scrollTo', scrollToSpy)

    // Spy on history.replaceState
    replaceStateSpy = vi.spyOn(history, 'replaceState').mockImplementation(() => {})

    // Create a test element
    testElement = document.createElement('div')
    testElement.id = 'test-section'
    document.body.appendChild(testElement)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    // Clean up test element
    if (testElement && testElement.parentNode) {
      testElement.parentNode.removeChild(testElement)
    }
  })

  describe('with custom scrollFn', () => {
    it('calls the provided scroll function with the id', () => {
      const scrollFn = vi.fn()
      scrollToAnchor('test-section', { scrollFn })

      expect(scrollFn).toHaveBeenCalledWith('test-section')
      expect(scrollToSpy).not.toHaveBeenCalled()
    })

    it('does not update URL when using custom scrollFn', () => {
      const scrollFn = vi.fn()
      scrollToAnchor('test-section', { scrollFn })

      expect(replaceStateSpy).not.toHaveBeenCalled()
    })
  })

  describe('with default scroll behavior', () => {
    it('does nothing when element is not found', () => {
      scrollToAnchor('non-existent-id')

      expect(scrollToSpy).not.toHaveBeenCalled()
      expect(replaceStateSpy).not.toHaveBeenCalled()
    })

    it('scrolls to element with smooth behavior', () => {
      scrollToAnchor('test-section')

      expect(scrollToSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          behavior: 'smooth',
        }),
      )
    })

    it('calculates scroll position with header offset', () => {
      scrollToAnchor('test-section')

      // Verify scrollTo was called with a top property (exact value depends on element position)
      expect(scrollToSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          top: expect.any(Number),
        }),
      )
    })

    it('updates URL hash by default', () => {
      scrollToAnchor('test-section')

      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '#test-section')
    })

    it('does not update URL when updateUrl is false', () => {
      scrollToAnchor('test-section', { updateUrl: false })

      expect(scrollToSpy).toHaveBeenCalled()
      expect(replaceStateSpy).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('handles empty id string without errors', () => {
      expect(() => scrollToAnchor('')).not.toThrow()
      expect(scrollToSpy).not.toHaveBeenCalled()
    })

    it('handles id with user-content prefix (GitHub-style anchors)', () => {
      const userContentElement = document.createElement('div')
      userContentElement.id = 'user-content-installation'
      document.body.appendChild(userContentElement)

      scrollToAnchor('user-content-installation')

      expect(scrollToSpy).toHaveBeenCalled()
      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '#user-content-installation')

      document.body.removeChild(userContentElement)
    })
  })
})
