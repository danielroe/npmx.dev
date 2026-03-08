<script setup lang="ts">
const instantSearch = useInstantSearch()

onPrehydrate(el => {
  let userPreferences: Record<string, unknown> = {}

  try {
    userPreferences = JSON.parse(localStorage.getItem('npmx-user-preferences') || '{}')
  } catch {}

  const enabled = userPreferences.instantSearch
  if (enabled === false) {
    el.querySelector('[data-instant-search-on]')!.className = 'hidden'
    el.querySelector('[data-instant-search-off]')!.className = ''
  }
})
</script>

<template>
  <p id="instant-search-advisory" class="text-fg-muted text-sm text-pretty">
    <span
      class="i-lucide:zap align-middle text-fg relative top-[-0.1em] me-1"
      style="font-size: 0.8em"
      aria-hidden="true"
    />
    <span data-instant-search-on :class="instantSearch ? '' : 'hidden'">
      <i18n-t keypath="search.instant_search_advisory">
        <template #label>
          {{ $t('search.instant_search') }}
        </template>
        <template #state>
          <strong>{{ $t('search.instant_search_on') }}</strong>
        </template>
        <template #action>
          <button type="button" class="underline" @click="instantSearch = false">
            {{ $t('search.instant_search_turn_off') }}
          </button>
        </template>
      </i18n-t>
    </span>
    <span data-instant-search-off :class="instantSearch ? 'hidden' : ''">
      <i18n-t keypath="search.instant_search_advisory">
        <template #label>
          {{ $t('search.instant_search') }}
        </template>
        <template #state>
          <strong>{{ $t('search.instant_search_off') }}</strong>
        </template>
        <template #action>
          <button type="button" class="underline" @click="instantSearch = true">
            {{ $t('search.instant_search_turn_on') }}
          </button>
        </template>
      </i18n-t>
    </span>
  </p>
</template>
