<script setup lang="ts">
const props = defineProps<{
  /** Username or organization name */
  name: string
  /** Type determines shape: user = circle, org = rounded square */
  type?: 'user' | 'org'
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}>()

const sizeClasses = {
  sm: 'size-8 text-sm',
  md: 'size-16 text-2xl',
  lg: 'size-24 text-4xl',
}

const imgError = shallowRef(false)

// GitHub avatar URL - works for both users and orgs
const avatarUrl = computed(() => `https://github.com/${props.name}.png?size=128`)

const sizeClass = computed(() => sizeClasses[props.size ?? 'md'])
const roundedClass = computed(() => (props.type === 'org' ? 'rounded-lg' : 'rounded-full'))

// Reset error state when name changes
watch(
  () => props.name,
  () => {
    imgError.value = false
  },
)
</script>

<template>
  <div
    :class="[
      sizeClass,
      roundedClass,
      'shrink-0 bg-bg-muted border border-border flex items-center justify-center overflow-hidden',
    ]"
    aria-hidden="true"
  >
    <img
      v-if="!imgError"
      :src="avatarUrl"
      :alt="name"
      class="w-full h-full object-cover"
      loading="lazy"
      @error="imgError = true"
    />
    <span v-else class="text-fg-subtle font-mono">
      {{ name.charAt(0).toUpperCase() }}
    </span>
  </div>
</template>
