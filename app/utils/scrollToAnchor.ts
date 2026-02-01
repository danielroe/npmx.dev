/**
 * Scroll to an element by ID, using a custom scroll function if provided,
 * otherwise falling back to default scroll behavior with header offset.
 *
 * @param id - The element ID to scroll to
 * @param scrollFn - Optional custom scroll function (e.g., from useActiveTocItem)
 */
export function scrollToAnchor(id: string, scrollFn?: (id: string) => void): void {
  // Use custom scroll function if provided
  if (scrollFn) {
    scrollFn(id)
    return
  }

  // Fallback: scroll with header offset
  const element = document.getElementById(id)
  if (!element) return

  // Calculate scroll position with header offset (matches scroll-padding-top in main.css)
  const HEADER_OFFSET = 80
  const elementTop = element.getBoundingClientRect().top + window.scrollY
  const targetScrollY = elementTop - HEADER_OFFSET

  // Use scrollTo for precise control
  window.scrollTo({
    top: targetScrollY,
    behavior: 'smooth',
  })

  // Update URL hash after initiating scroll
  // Use replaceState to avoid triggering native scroll-to-anchor behavior
  history.replaceState(null, '', `#${id}`)
}
