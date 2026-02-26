<script setup lang="ts">
import { debounce } from 'perfect-debounce'
import { updateProfile as updateProfileUtil } from '~/utils/atproto/profile'
import { normalizeSearchParam } from '#shared/utils/url'

type LikesResult = {
  records: {
    value: {
      subjectRef: string
    }
  }[]
}

const route = useRoute('/profile/[handle]')
const router = useRouter()
const handle = computed(() => route.params.handle)

const { data: profile }: { data?: NPMXProfile } = useFetch(
  () => `/api/social/profile/${handle.value}`,
  {
    default: () => ({ profile: { displayName: handle.value } }),
    server: false,
  },
)

const { user } = useAtproto()
const isEditing = ref(false)
const displayNameInput = ref()
const descriptionInput = ref()
const websiteInput = ref()
const isUpdateProfileActionPending = ref(false)

watchEffect(() => {
  if (isEditing) {
    if (profile) {
      displayNameInput.value = profile.value.displayName
      descriptionInput.value = profile.value.description
      websiteInput.value = profile.value.website
    }
  }
})

async function updateProfile() {
  if (!user.value.handle || !displayNameInput.value) {
    return
  }

  isUpdateProfileActionPending.value = true
  const currentProfile = profile.value

  // optimistic update
  profile.value = {
    displayName: displayNameInput.value,
    description: descriptionInput.value,
    website: websiteInput.value,
  }

  try {
    const result = await updateProfileUtil(handle, {
      displayName: displayNameInput.value,
      description: descriptionInput.value,
      website: websiteInput.value,
    })

    if (!result.success) {
      profile.value = currentProfile
    }

    isUpdateProfileActionPending.value = false
    isEditing.value = false
  } catch (e) {
    profile.value = currentProfile
    isUpdateProfileActionPending.value = false
  }
}

const { data: likesData, status } = await useProfileLikes(handle)

useSeoMeta({
  title: () => `${handle.value} - npmx`,
  description: () => `npmx profile by ${handle.value}`,
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
        <button @click="isEditing = false">Cancel</button>
        <button @click.prevent="updateProfile" :disabled="isUpdateProfileActionPending">
          Save
        </button>
        <label for="displayName" class="text-sm flex flex-col gap-2">
          Display Name
          <input
            required
            name="displayName"
            type="text"
            class="w-full min-w-25 bg-bg-subtle border border-border rounded-md ps-3 pe-3 py-1.5 font-mono text-sm text-fg placeholder:text-fg-subtle transition-[border-color,outline-color] duration-300 hover:border-fg-subtle outline-2 outline-transparent focus:border-accent focus-visible:(outline-2 outline-accent/70)"
            v-model="displayNameInput"
          />
        </label>
        <label for="description" class="text-sm flex flex-col gap-2">
          Description
          <input
            name="description"
            type="text"
            placeholder="No description"
            v-model="descriptionInput"
            class="w-full min-w-25 bg-bg-subtle border border-border rounded-md ps-3 pe-3 py-1.5 font-mono text-sm text-fg placeholder:text-fg-subtle transition-[border-color,outline-color] duration-300 hover:border-fg-subtle outline-2 outline-transparent focus:border-accent focus-visible:(outline-2 outline-accent/70)"
          />
        </label>
        <div class="flex gap-4 items-center">
          <h2>@{{ handle }}</h2>
          <div class="link-subtle font-mono text-sm inline-flex items-center gap-1.5">
            <span class="i-carbon:link w-4 h-4" aria-hidden="true" />
            <input
              name="website"
              type=""
              v-model="websiteInput"
              class="w-full min-w-25 bg-bg-subtle border border-border rounded-md ps-3 pe-3 py-1.5 font-mono text-sm text-fg placeholder:text-fg-subtle transition-[border-color,outline-color] duration-300 hover:border-fg-subtle outline-2 outline-transparent focus:border-accent focus-visible:(outline-2 outline-accent/70)"
            />
          </div>
        </div>
      </div>

      <!-- Display Profile -->
      <div v-else class="flex flex-col flex-wrap gap-4">
        <button v-if="user?.handle === handle" @click="isEditing = true">Edit</button>
        <h1 class="font-mono text-2xl sm:text-3xl font-medium">{{ profile.displayName }}</h1>
        <p v-if="profile.description">{{ profile.description }}</p>
        <div class="flex gap-4">
          <h2>@{{ handle }}</h2>
          <a
            v-if="profile.website"
            :href="profile.website"
            target="_blank"
            rel="noopener noreferrer"
            class="link-subtle font-mono text-sm inline-flex items-center gap-1.5"
          >
            <span class="i-carbon:link w-4 h-4" aria-hidden="true" />
            {{ profile.website }}
          </a>
        </div>
      </div>
    </header>

    <section class="flex flex-col gap-8">
      <h2
        class="font-mono text-2xl sm:text-3xl font-medium min-w-0 break-words"
        :title="Likes"
        dir="ltr"
      >
        Likes <span v-if="likesData">({{ likesData.likes.records.length ?? 0 }})</span>
      </h2>
      <div v-if="status === 'pending'">
        <p>Loading...</p>
      </div>
      <div v-else-if="status === 'error'">
        <p>Error</p>
      </div>
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PackageLikeCard
          v-if="likesData.likes.records"
          v-for="like in likesData.likes.records"
          :packageUrl="like.value.subjectRef"
        />
      </div>
    </section>
  </main>
</template>
