<script setup lang="ts">
import { updateProfile as updateProfileUtil } from '~/utils/atproto/profile'

const route = useRoute('profile-handle')
const handle = computed(() => route.params.handle)

const {
  data: profile,
  status: profileStatus,
  error: profileError,
} = await useFetch<NPMXProfile>(() => `/api/social/profile/${handle.value}`, {
  default: () => ({ displayName: handle.value, description: '', website: '' }),
})

if (
  profileStatus.value === 'error' &&
  profileError.value?.statusCode &&
  profileError.value.statusCode >= 400 &&
  profileError.value.statusCode < 500
) {
  throw createError({
    statusCode: 404,
    statusMessage: $t('profile.not_found'),
    message: $t('profile.not_found_message', { handle: handle.value }),
  })
}

const { user } = useAtproto()
const isEditing = ref(false)
const displayNameInput = ref()
const descriptionInput = ref()
const websiteInput = ref()
const isUpdateProfileActionPending = ref(false)

watchEffect(() => {
  if (isEditing.value) {
    if (profile) {
      displayNameInput.value = profile.value.displayName
      descriptionInput.value = profile.value.description
      websiteInput.value = profile.value.website
    }
  }
})

async function updateProfile() {
  if (!user.value?.handle || !displayNameInput.value) {
    return
  }

  isUpdateProfileActionPending.value = true
  const currentProfile = profile.value

  // optimistic update
  profile.value = {
    displayName: displayNameInput.value,
    description: descriptionInput.value || undefined,
    website: websiteInput.value || undefined,
  }

  try {
    const result = await updateProfileUtil(handle.value, {
      displayName: displayNameInput.value,
      description: descriptionInput.value || undefined,
      website: websiteInput.value || undefined,
    })

    if (result.success) {
      isEditing.value = false
    } else {
      profile.value = currentProfile
    }

    isUpdateProfileActionPending.value = false
  } catch (e) {
    profile.value = currentProfile
    isUpdateProfileActionPending.value = false
  }
}

const { data: likesData, status } = await useProfileLikes(handle)

useSeoMeta({
  title: () => $t('profile.seo_title', { handle: handle.value }),
  description: () => $t('profile.seo_description', { handle: handle.value }),
})

/**
defineOgImageComponent('Default', {
  title: () => `~${username.value}`,
  description: () => (results.value ? `${results.value.total} packages` : 'npm user profile'),
  primaryColor: '#60a5fa',
})
**/
</script>

<template>
  <main class="container flex-1 flex flex-col py-8 sm:py-12 w-full">
    <!-- Header -->
    <header class="mb-8 pb-8 border-b border-border">
      <!-- Editing Profile -->
      <div v-if="isEditing" class="flex flex-col flex-wrap gap-4">
        <label for="displayName" class="text-sm flex flex-col gap-2">
          {{ $t('profile.display_name') }}
          <input
            required
            name="displayName"
            type="text"
            class="w-full min-w-25 bg-bg-subtle border border-border rounded-md ps-3 pe-3 py-1.5 font-mono text-sm text-fg placeholder:text-fg-subtle transition-[border-color,outline-color] duration-300 hover:border-fg-subtle outline-2 outline-transparent focus:border-accent focus-visible:(outline-2 outline-accent/70)"
            v-model="displayNameInput"
          />
        </label>
        <label for="description" class="text-sm flex flex-col gap-2">
          {{ $t('profile.description') }}
          <input
            name="description"
            type="text"
            :placeholder="$t('profile.no_description')"
            v-model="descriptionInput"
            class="w-full min-w-25 bg-bg-subtle border border-border rounded-md ps-3 pe-3 py-1.5 font-mono text-sm text-fg placeholder:text-fg-subtle transition-[border-color,outline-color] duration-300 hover:border-fg-subtle outline-2 outline-transparent focus:border-accent focus-visible:(outline-2 outline-accent/70)"
          />
        </label>
        <label for="website" class="text-sm flex flex-col gap-2">
          {{ $t('profile.website') }}
          <input
            name="website"
            type="url"
            :placeholder="$t('profile.website_placeholder')"
            v-model="websiteInput"
            class="w-full min-w-25 bg-bg-subtle border border-border rounded-md ps-3 pe-3 py-1.5 font-mono text-sm text-fg placeholder:text-fg-subtle transition-[border-color,outline-color] duration-300 hover:border-fg-subtle outline-2 outline-transparent focus:border-accent focus-visible:(outline-2 outline-accent/70)"
          />
        </label>
        <div class="flex gap-4 items-center font-mono text-sm">
          <h2>@{{ handle }}</h2>
          <button
            @click="isEditing = false"
            class="link-subtle font-mono text-sm inline-flex items-center gap-2 px-2 py-1.5 hover:bg-bg-subtle focus-visible:outline-accent/70 rounded"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            @click="updateProfile"
            :disabled="isUpdateProfileActionPending"
            class="link-subtle font-mono text-sm inline-flex items-center gap-2 px-2 py-1.5 hover:bg-bg-subtle focus-visible:outline-accent/70 rounded"
          >
            {{ $t('common.save') }}
          </button>
        </div>
      </div>

      <!-- Display Profile -->
      <div v-else class="flex flex-col flex-wrap gap-4">
        <h1 v-if="profile.displayName" class="font-mono text-2xl sm:text-3xl font-medium">
          {{ profile.displayName }}
        </h1>
        <p v-if="profile.description">{{ profile.description }}</p>
        <div class="flex gap-4 items-center font-mono text-sm">
          <h2>@{{ handle }}</h2>
          <LinkBase v-if="profile.website" :to="profile.website" classicon="i-lucide:link">
            {{ profile.website }}
          </LinkBase>
          <button
            v-if="user?.handle === handle"
            @click="isEditing = true"
            class="hidden sm:inline-flex link-subtle font-mono text-sm items-center gap-2 px-2 py-1.5 hover:bg-bg-subtle focus-visible:outline-accent/70 rounded"
          >
            {{ $t('common.edit') }}
          </button>
        </div>
      </div>
    </header>

    <section class="flex flex-col gap-8">
      <h2
        class="font-mono text-2xl sm:text-3xl font-medium min-w-0 break-words"
        :title="$t('profile.likes')"
        dir="ltr"
      >
        {{ $t('profile.likes') }}
        <span v-if="likesData">({{ likesData.likes?.records?.length ?? 0 }})</span>
      </h2>
      <div v-if="status === 'pending'">
        <p>{{ $t('common.loading') }}</p>
      </div>
      <div v-else-if="status === 'error'">
        <p>{{ $t('common.error') }}</p>
      </div>
      <div v-else-if="likesData?.likes?.records" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PackageLikeCard
          v-for="like in likesData.likes.records"
          :packageUrl="like.value.subjectRef"
        />
      </div>
    </section>
  </main>
</template>
