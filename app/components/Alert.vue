<script setup lang="ts">
interface Props {
  variant: 'warning' | 'error'
  icon?: string
  title?: string
}

defineProps<Props>()

const variantClasses: Record<Props['variant'], string> = {
  warning: 'border-amber-400/20 bg-amber-500/8',
  error: 'border-red-400/20 bg-red-500/8',
}

const iconClasses: Record<Props['variant'], string> = {
  warning: 'text-amber-400/80',
  error: 'text-red-400/80',
}
</script>

<template>
  <div role="alert" class="border rounded-md px-3 py-2.5" :class="variantClasses[variant]">
    <p v-if="icon || title" class="flex items-center gap-1.5 text-sm font-medium text-fg mb-1">
      <span
        v-if="icon"
        :class="[`i-lucide:${icon}`, 'w-3.5 h-3.5 shrink-0', iconClasses[variant]]"
        aria-hidden="true"
      />
      {{ title }}
    </p>
    <div class="text-sm text-fg-muted">
      <slot />
    </div>
  </div>
</template>
