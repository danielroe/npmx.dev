# User Preferences

This directory contains composables for managing user preferences — settings that are synced to the server for authenticated users and persisted in `localStorage` for anonymous users.

## Two stores, two purposes

| Store                | Composable                  | localStorage key        | Synced to server    | Use case                                         |
| -------------------- | --------------------------- | ----------------------- | ------------------- | ------------------------------------------------ |
| **User preferences** | `useUserPreferencesState()` | `npmx-user-preferences` | Yes (authenticated) | Settings the user would expect on another device |
| **Local settings**   | `useUserLocalSettings()`    | `npmx-settings`         | No                  | Device-specific UI state                         |

### Decision rule

> Would a user expect this setting to transfer to another browser or device?
>
> - **Yes** → user preference (`npmx-user-preferences`)
> - **No** → local setting (`npmx-settings`)

**User preferences** (synced): accent color, background theme, color mode, locale, search provider, keyboard shortcuts, instant search, relative dates, hide platform packages, include @types in install.

**Local settings** (device-only): chart filter params (average window, smoothing, prediction, anomalies), sidebar collapse state, connector auto-open URL.

## Available composables

| Composable                         | Purpose                                                           |
| ---------------------------------- | ----------------------------------------------------------------- |
| `useUserPreferencesState()`        | Read/write access to the full preferences ref                     |
| `useAccentColor()`                 | Accent color picker with DOM sync                                 |
| `useBackgroundTheme()`             | Background shade with DOM sync                                    |
| `useColorModePreference()`         | Color mode synced with `@nuxtjs/color-mode`                       |
| `useInstantSearchPreference()`     | Toggle instant search (shared)                                    |
| `useKeyboardShortcutsPreference()` | Toggle keyboard shortcuts with DOM attribute sync (shared)        |
| `useRelativeDatesPreference()`     | Read-only computed for relative date display                      |
| `useSearchProvider()`              | npm/algolia toggle                                                |
| `useUserPreferencesSyncStatus()`   | Sync status signals (`isSyncing`, `isSynced`, `hasError`) for UI  |
| `useInitUserPreferencesSync()`     | Imperative `initSync()` — called by the plugin, not by components |

## Adding a new user preference

1. **Add the field to the schema** in `shared/schemas/userPreferences.ts`:

   ```ts
   export const UserPreferencesSchema = object({
     // ... existing fields
     myNewPref: optional(boolean()),
   })
   ```

2. **Add a default value** in `DEFAULT_USER_PREFERENCES` (same file):

   ```ts
   export const DEFAULT_USER_PREFERENCES = {
     // ... existing defaults
     myNewPref: false,
   }
   ```

3. **Create a composable** in this directory (e.g. `useMyNewPref.ts`):

   ```ts
   export function useMyNewPref() {
     const { preferences } = useUserPreferencesState()

     return computed({
       get: () => preferences.value.myNewPref ?? false,
       set: (value: boolean) => {
         preferences.value.myNewPref = value
       },
     })
   }
   ```

4. **Use it in components** — the composable is auto-imported:

   ```vue
   <script setup lang="ts">
   const myNewPref = useMyNewPref()
   </script>
   ```

The preference will automatically persist to localStorage and sync to the server for authenticated users. No additional wiring needed.

## Adding a new local setting

1. **Add the field** to the `UserLocalSettings` interface and `DEFAULT_USER_LOCAL_SETTINGS` in `app/composables/useUserLocalSettings.ts`:

   ```ts
   export interface UserLocalSettings {
     // ... existing fields
     myLocalThing: boolean
   }

   const DEFAULT_USER_LOCAL_SETTINGS: UserLocalSettings = {
     // ... existing defaults
     myLocalThing: false,
   }
   ```

2. **Use it in components:**

   ```vue
   <script setup lang="ts">
   const { localSettings } = useUserLocalSettings()
   // localSettings.value.myLocalThing
   </script>
   ```

## Architecture overview

```
useUserPreferencesProvider        ← singleton, manages localStorage + sync lifecycle
  ├── useUserPreferencesSync      ← client-only: debounced server writes, route guard, sendBeacon
  ├── useUserPreferencesState     ← read/write access to reactive ref (used by all composables above)
  └── preferences-merge.ts        ← merge logic for first-login vs returning-user scenarios

useUserLocalSettings              ← separate singleton, localStorage only, no sync

useLocalStorageHashProvider       ← generic localStorage + defu provider (used by usePackageListPreferences)
```

### Sync flow (authenticated users)

1. `preferences-sync.client.ts` plugin calls `initSync()` on app boot
2. Preferences are loaded from server and merged with local state
3. A deep watcher on the preferences ref triggers `scheduleSync()` on every change
4. `scheduleSync()` debounces for 2 seconds, then pushes to `PUT /api/user/preferences`
5. On route navigation, `router.beforeEach` flushes any pending sync
6. On tab close, `sendBeacon` fires the latest preferences via `POST /api/user/preferences`
