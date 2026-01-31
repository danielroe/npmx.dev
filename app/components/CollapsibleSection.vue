<script setup lang="ts">
defineProps<{
  id: string
}>()
</script>

<template>
  <section
    :id="id"
    :aria-labelledby="id + '-title'"
    class="group relative collapsible-section scroll-mt-20"
  >
    <a
      :href="`#${id}`"
      class="section-anchor p-1 col-start-2 col-span-1 row-start-1 self-start opacity-0 rounded text-fg-subtle transition-opacity hover:text-accent focus:opacity-100 group-hover:opacity-100 motion-reduce:opacity-100"
      aria-label="Link to section"
      data-anchor
    >
      <span class="i-carbon-link block size-full" />
    </a>
    <details open class="col-span-full row-start-1 open:pb-2">
      <summary
        :id="id + '-title'"
        class="collapsible-header flex items-center justify-between transition-all motion-reduce:pr-7 group-hover:pr-7 group-has-[[data-anchor]:focus]:pr-7"
      >
        <div
          class="text-xs text-fg-subtle uppercase tracking-wider inline-flex items-center gap-1.5 group-hover:text-fg"
        >
          <slot name="title" />
        </div>
        <span
          class="collapsible-arrow i-carbon-chevron-down size-5 text-fg-subtle transition-all opacity-0 group-hover:opacity-100 max-lg:opacity-100 motion-reduce:opacity-100"
        />
      </summary>
      <div class="py-2">
        <slot />
      </div>
    </details>
  </section>
</template>

<style scoped>
.collapsible-section {
  --header-height: 1.5rem;
  display: grid;
  grid-template-columns: 1fr auto;
}

.collapsible-header {
  position: relative;
  height: var(--header-height);
  cursor: pointer;
  list-style: none;
  &::-webkit-details-marker {
    display: none;
  }
  &::before {
    content: '';
    position: absolute;
    inset: -0.25rem -0.25rem -0.25rem -0.5rem;
    border-radius: 0.5rem;
    background-color: var(--bg-subtle);
    opacity: 0;
    transition: opacity 150ms;
    z-index: -1;
  }
}

.collapsible-section:hover .collapsible-header::before {
  opacity: 1;
}

details:not([open]) .collapsible-arrow {
  transform: rotate(-90deg);
}

.section-anchor {
  width: var(--header-height);
  height: var(--header-height);
}
</style>
