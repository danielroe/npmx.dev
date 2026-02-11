<script setup lang="ts">
import Readme from '../Readme.vue'

const props = defineProps<{
  packageName: string
  requestedVersion: string | null
  repositoryUrl: string | null
}>()

// Fetch README for specific version if requested, otherwise latest
const { data, status, error } = useLazyFetch<ReadmeResponse>(() => {
  const base = `/api/registry/readme/${props.packageName}`
  const version = props.requestedVersion
  return version ? `${base}/v/${version}` : base
})

// Track active TOC item based on scroll position
const tocItems = computed(() => data.value?.toc ?? [])
const { activeId: activeTocId } = useActiveTocItem(tocItems)

//copy README file as Markdown
const { copied: copiedReadme, copy: copyReadme } = useClipboard({
  source: () => data.value?.md ?? '',
  copiedDuring: 2000,
})
</script>

<template>
  <div class="flex flex-wrap items-center justify-between mb-3 px-1">
    <h2 id="readme-heading" class="group text-xs text-fg-subtle uppercase tracking-wider">
      <LinkBase to="#readme">
        {{ $t('package.readme.title') }}
      </LinkBase>
    </h2>
    <div class="flex gap-2">
      <!-- Copy readme as Markdown button -->
      <TooltipApp
        v-if="data?.md || status === 'pending' || status === 'idle'"
        :text="$t('package.readme.copy_as_markdown')"
        position="bottom"
      >
        <ButtonBase
          @click="copyReadme()"
          :aria-pressed="copiedReadme"
          :aria-label="copiedReadme ? $t('common.copied') : $t('package.readme.copy_as_markdown')"
          :classicon="copiedReadme ? 'i-carbon:checkmark' : 'i-simple-icons:markdown'"
          :disabled="status === 'pending' || status === 'idle'"
        >
          {{ copiedReadme ? $t('common.copied') : $t('common.copy') }}
        </ButtonBase>
      </TooltipApp>
      <ReadmeTocDropdown
        v-if="data?.toc && data.toc.length > 1"
        :toc="data.toc"
        :active-id="activeTocId"
        :disabled="!data || !data.toc"
      />
      <ButtonBase
        v-else-if="status === 'pending' || status === 'idle'"
        disabled
        classicon="i-carbon:list"
        block
      >
        <span class="i-carbon:chevron-down w-3 h-3" aria-hidden="true" />
      </ButtonBase>
    </div>
  </div>

  <!-- eslint-disable vue/no-v-html -- HTML is sanitized server-side -->
  <Readme v-if="status === 'success' && data?.html" :html="data.html" />
  <div class="space-y-4" v-else-if="status === 'pending' || status === 'idle'">
    <!-- Heading -->
    <SkeletonBlock class="h-7 w-2/3" />
    <!-- Paragraphs -->
    <SkeletonBlock class="h-4 w-full" />
    <SkeletonBlock class="h-4 w-full" />
    <SkeletonBlock class="h-4 w-4/5" />
    <!-- Gap for section break -->
    <SkeletonBlock class="h-6 w-1/2 mt-6" />
    <SkeletonBlock class="h-4 w-full" />
    <SkeletonBlock class="h-4 w-full" />
    <SkeletonBlock class="h-4 w-3/4" />
    <!-- Code block placeholder -->
    <SkeletonBlock class="h-24 w-full rounded-lg mt-4" />
    <SkeletonBlock class="h-4 w-full" />
    <SkeletonBlock class="h-4 w-5/6" />
  </div>
  <div v-else-if="status === 'error'" class="text-red-500">
    {{ $t('package.readme.load_error') }}
  </div>
  <p v-else class="text-fg-muted italic">
    {{ $t('package.readme.no_readme') }}
    <a
      v-if="repositoryUrl"
      :href="repositoryUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="link text-fg underline underline-offset-4 decoration-fg-subtle hover:(decoration-fg text-fg) transition-colors duration-200"
      >{{ $t('package.readme.view_on_github') }}</a
    >
  </p>
</template>

<style module>
.areaReadme {
  grid-area: readme;
}

.areaReadme > :global(.readme) {
  overflow-x: hidden;
}
</style>
