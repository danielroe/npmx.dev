<template>
  <footer
    role="contentinfo"
    aria-label="Site footer"
    class="fixed bottom-0 left-0 right-0 z-30 bg-bg/90 backdrop-blur-md border-t border-border"
  >
    <div
      class="container py-3 sm:py-4 flex flex-col gap-2 sm:gap-4 text-fg-subtle text-xs sm:text-sm"
    >
      <div class="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
        <p class="font-mono m-0">a better browser for the npm registry</p>
        <div class="flex items-center gap-4 sm:gap-6">
          <a
            href="https://github.com/danielroe/npmx.dev"
            rel="noopener noreferrer"
            class="link-subtle font-mono text-xs min-h-11 min-w-11 flex items-center"
          >
            source
          </a>
          <span class="text-border">|</span>
          <a
            href="https://roe.dev"
            rel="noopener noreferrer"
            class="link-subtle font-mono text-xs min-h-11 min-w-11 flex items-center"
          >
            @danielroe
          </a>
        </div>
      </div>
      <p class="text-xs text-fg-subtle/60 text-center sm:text-left m-0 hidden sm:block">
        npm is a registered trademark of npm, Inc. This site is not affiliated with npm, Inc.
      </p>
    </div>
  </footer>
</template>
