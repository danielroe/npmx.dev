<script setup lang="ts">
import type { NuxtLinkProps } from '#app'

const props = withDefaults(
  defineProps<
    {
      /** Disabled links will be displayed as plain text */
      disabled?: boolean
      /**
       * `type` should never be used, because this will always be a link.
       * */
      type?: never
      variant?: 'button-primary' | 'button-secondary' | 'link'
      size?: 'small' | 'medium'
      iconSize?: 'sm' | 'md' | 'lg'

      ariaKeyshortcuts?: string

      /**
       * Don't use this directly. This will automatically be set to `_blank` for external links passed via `to`.
       */
      target?: never

      /**
       * Don't use this directly. This will automatically be set for external links passed via `to`.
       */
      rel?: never

      classicon?: string

      to?: NuxtLinkProps['to']

      /** always use `to` instead of `href` */
      href?: never

      /** should only be used for links where the context makes it very clear they are clickable. Don't just use this, because you don't like underlines. */
      noUnderline?: boolean
    } & NuxtLinkProps
  >(),
  { variant: 'link', size: 'medium' },
)

const isLinkExternal = computed(
  () =>
    !!props.to &&
    typeof props.to === 'string' &&
    (props.to.startsWith('http:') || props.to.startsWith('https:') || props.to.startsWith('//')),
)
const isLinkAnchor = computed(
  () => !!props.to && typeof props.to === 'string' && props.to.startsWith('#'),
)

const ICON_SIZE_MAP = {
  sm: 'size-3 min-w-3',
  md: 'size-4 min-w-4',
  lg: 'size-5 min-w-5',
}

/** size is only applicable for button like links */
const isLink = computed(() => props.variant === 'link')
const isButton = computed(() => props.variant !== 'link')
const isButtonSmall = computed(() => props.size === 'small' && props.variant !== 'link')
const isButtonMedium = computed(() => props.size === 'medium' && props.variant !== 'link')

const iconSizeClass = computed(
  () => ICON_SIZE_MAP[props.iconSize || (isButtonSmall.value && 'sm') || 'md'],
)
</script>

<template>
  <span
    v-if="disabled"
    :class="{
      'opacity-50 inline-flex gap-x-1 items-center justify-center font-mono border border-transparent rounded-md':
        isButton,
      'text-sm px-4 py-2': isButtonMedium,
      'text-xs px-2 py-0.5': isButtonSmall,
      'text-bg bg-fg': variant === 'button-primary',
      'bg-transparent text-fg': variant === 'button-secondary',
    }"
    ><slot
  /></span>
  <NuxtLink
    v-else
    class="group/link inline-flex gap-x-1 items-center justify-center"
    :class="{
      'underline-offset-[0.2rem] underline decoration-1 decoration-fg/30':
        !isLinkAnchor && isLink && !noUnderline,
      'font-mono text-fg hover:(decoration-accent text-accent) focus-visible:(decoration-accent text-accent) transition-colors duration-200':
        isLink,
      'font-mono border border-border rounded-md transition-all duration-200': isButton,
      'text-sm px-4 py-2': isButtonMedium,
      'text-xs px-2 py-0.5': isButtonSmall,
      'bg-transparent text-fg hover:(bg-fg/10 text-accent) focus-visible:(bg-fg/10 text-accent) aria-[current=true]:(bg-fg/10 text-accent border-fg/20 hover:enabled:(bg-fg/20 text-fg/50))':
        variant === 'button-secondary',
      'text-bg bg-fg hover:(bg-fg/50 text-accent) focus-visible:(bg-fg/50) aria-current:(bg-fg text-bg border-fg hover:enabled:(text-bg/50))':
        variant === 'button-primary',
    }"
    :to="to"
    :aria-keyshortcuts="ariaKeyshortcuts"
    :target="isLinkExternal ? '_blank' : undefined"
  >
    <span v-if="classicon" class="me-1" :class="[iconSizeClass, classicon]" aria-hidden="true" />
    <slot />
    <!-- automatically show icon indicating external link -->
    <span
      v-if="isLinkExternal && !classicon"
      class="i-carbon:launch rtl-flip w-3 h-3 opacity-50"
      aria-hidden="true"
    />
    <span
      v-else-if="isLinkAnchor && isLink"
      class="i-carbon:link w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity duration-200"
      aria-hidden="true"
    />
    <kbd
      v-if="ariaKeyshortcuts"
      class="ms-2 inline-flex items-center justify-center w-4 h-4 text-xs text-fg bg-bg-muted border border-border rounded no-underline"
      aria-hidden="true"
    >
      {{ ariaKeyshortcuts }}
    </kbd>
  </NuxtLink>
</template>
