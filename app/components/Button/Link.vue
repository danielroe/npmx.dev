<script setup lang="ts">
import type { NuxtLinkProps } from '#app'

const props = withDefaults(
  defineProps<
    {
      /** Disabled links will be displayed as plain text */
      disabled?: boolean
      /**
       * `type` should never be used, because this will always be a link.
       *
       * If you want a button use `TagButton` instead.
       * */
      type?: never
      variant?: 'primary' | 'secondary'
    } &
      /** This makes sure the link always has either `to` or `href` */
      (Required<Pick<NuxtLinkProps, 'to'>> | Required<Pick<NuxtLinkProps, 'href'>>) &
      NuxtLinkProps
  >(),
  { variant: 'secondary' },
)
</script>

<template>
  <!-- This is only a placeholder implementation yet. It will probably need some additional styling, but note: A disabled link is just text. -->
  <span v-if="disabled" class="opacity-50"><slot /></span>
  <NuxtLink
    v-else
    class="inline-flex gap-x-1 items-center justify-center px-4 py-2 font-mono text-sm border border-border rounded-md transition-all duration-200"
    :class="[
      variant === 'primary'
        ? 'text-bg bg-fg hover:enabled:(bg-fg/90)'
        : 'bg-transparent text-fg hover:enabled:(bg-fg text-bg border-fg)',
    ]"
  >
    <slot />
  </NuxtLink>
</template>
