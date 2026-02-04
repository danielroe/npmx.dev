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
      variant?: 'primary' | 'secondary' | 'tag'
    } &
      /** This makes sure the link always has either `to` or `href` */
      (Required<Pick<NuxtLinkProps, 'to'>> | Required<Pick<NuxtLinkProps, 'href'>>) &
      NuxtLinkProps
  >(),
  { variant: 'secondary' },
)
</script>

<template>
  <span
    v-if="disabled"
    class="opacity-50 inline-flex gap-x-1 items-center justify-center font-mono border border-border rounded-md"
    :class="{
      'text-sm px-4 py-2': variant !== 'tag',
      'text-xs px-2 py-0.5': variant === 'tag',
      'bg-bg-muted text-fg-muted': variant === 'tag',
      'text-bg bg-fg': variant === 'primary',
      'bg-transparent text-fg': variant === 'secondary',
    }"
    ><slot
  /></span>
  <NuxtLink
    v-else
    class="cursor-pointer inline-flex gap-x-1 items-center justify-center font-mono border border-border rounded-md transition-all duration-200 aria-current:(bg-fg text-bg border-fg hover:enabled:(text-bg/50))"
    :class="{
      'text-sm px-4 py-2': variant !== 'tag',
      'text-xs px-2 py-0.5': variant === 'tag',
      'bg-bg-muted text-fg-muted hover:(text-fg border-border-hover)': variant === 'tag',
      'text-bg bg-fg hover:(bg-fg/90)': variant === 'primary',
      'bg-transparent text-fg hover:(bg-fg text-bg border-fg)': variant === 'secondary',
    }"
  >
    <slot />
  </NuxtLink>
</template>
