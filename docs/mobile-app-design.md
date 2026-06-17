# Mobile App Design And Architecture Plan

This document is the implementation handoff for replacing the current Charlotte Third Places PWA wrapper with a true Expo/React Native app while preserving the existing Next.js website as the web product.

The migration target is exact parity with the current live app and website. The React Native app must preserve the same catalog, same Home/Random/Browse/Map/Chat/Place Detail/Photos/Contribute/About/Legal functionality, same filtering semantics, same AI behavior, same visual identity, same place highlighting rules, same external link behavior, same sharing behavior, and same app-store bundle identity.

This document is intentionally deterministic. It does not use "if needed" as an implementation strategy. Each code path is classified as shared, platform-specific, or out of scope for the parity migration.

## Product Decision

Charlotte Third Places will have four explicit workspace areas:

1. `packages/core`: pure TypeScript domain, data, API contract, and business logic shared by web and mobile.
2. `packages/shared-react`: React-only, renderer-agnostic state and behavior shared by React DOM and React Native.
3. `web`: the existing Next.js web app for public web, SEO, shareable pages, legal pages, admin/web workflows, and server-side integrations. This folder is currently named `charlotte-third-places` and must be renamed to `web` as part of the migration.
4. `mobile`: the Expo/React Native app for iOS and Android app-store experiences.

The key split is shared logic, platform-specific rendering. The plan does not share DOM UI with React Native and does not render website pages inside the mobile app.

## Non-Negotiable Constraints


## Bundle Identity And Store Transition

Charlotte Third Places is being entirely replaced with the React Native app in the App Store. The current PWA version uses `com.charlottethirdplaces.app` and is live in the App Store.

The Expo app uses the same iOS bundle identifier:

```text
com.charlottethirdplaces.app
```

Development builds may require this PowerShell environment variable when EAS capability syncing fails against the existing Apple App ID or its entitlements:

```powershell
$env:EXPO_NO_CAPABILITY_SYNC=1
npx eas-cli@latest build --profile development --platform ios
```

This disables automatic EAS capability syncing for the build command. It does not remove capabilities from the Apple Developer account, and it does not change the App Store Connect app record.

Production replacement must keep the existing App Store Connect app record. Do not delete, remove, or archive the existing App Store Connect app record to "free" the bundle ID. Apple locks a bundle ID to an app record after a build has been uploaded, and removing the app record can make that bundle ID unavailable for reuse.

The React Native app replaces the current PWA wrapper by submitting a new version update to the existing App Store Connect app record using the same bundle identifier, `com.charlottethirdplaces.app`. Existing users receive the React Native app as a normal App Store update.

Production replacement steps:

1. Keep the existing App Store Connect app record.
2. Keep `ios.bundleIdentifier` set to `com.charlottethirdplaces.app`.
3. Complete the Apple Developer App ID capability procedure below.
4. Use EAS-managed remote iOS credentials as the signing source of truth. Before the production build, run `npx eas-cli@latest credentials -p ios`, select `com.charlottethirdplaces.app`, and remove the EAS-stored App Store provisioning profile for the production profile so the next production build must create a fresh profile from the current Apple Developer App ID capabilities.
5. Increment the iOS marketing version and build number.
6. Build the React Native production binary with EAS without `EXPO_NO_CAPABILITY_SYNC=1` so EAS syncs supported capabilities and creates the fresh App Store provisioning profile.
7. Upload the binary to the existing App Store Connect app as a new version/build.
8. Submit that existing app record for App Review.

Apple Developer App ID capability procedure:

1. Treat `mobile/app.json` as the iOS capability source of truth for the Expo app.
2. For the parity migration, configure exactly one App ID capability: Associated Domains. Authentication, Sign in with Apple, Push Notifications, App Groups, iCloud, Wallet, Apple Pay, and In-App Purchase stay disabled because they are future-only features in this migration plan.
3. Add the production universal-link domains to the Expo iOS config:

   ```json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.charlottethirdplaces.app",
         "associatedDomains": [
           "applinks:www.charlottethirdplaces.com",
           "applinks:charlottethirdplaces.com"
         ]
       }
     }
   }
   ```

4. From `mobile/`, generate the introspected native config:

   ```powershell
   npx expo config --type introspect | Out-File .\expo-introspect.json -Encoding utf8
   ```

5. Confirm `expo-introspect.json` contains `com.apple.developer.associated-domains` with exactly these values:

   ```text
   applinks:www.charlottethirdplaces.com
   applinks:charlottethirdplaces.com
   ```

6. Delete the temporary introspection file after inspection:

   ```powershell
   Remove-Item .\expo-introspect.json
   ```

7. In Apple Developer Console, open Certificates, IDs & Profiles, then Identifiers, then the App ID for `com.charlottethirdplaces.app`.
8. Enable Associated Domains on that App ID. Leave the future-only capabilities listed in step 2 disabled.
9. Save the App ID changes and confirm the Apple capability modification dialog.
10. Run the EAS credential reset step in production replacement step 4 so the stale App Store provisioning profile is removed from EAS.
11. Run the production EAS build without the capability-sync bypass:

    ```powershell
    Remove-Item Env:\EXPO_NO_CAPABILITY_SYNC -ErrorAction SilentlyContinue
    npx eas-cli@latest build --profile production --platform ios
    ```

12. Treat any production build error that says the provisioning profile does not support Associated Domains or does not include `com.apple.developer.associated-domains` as a failed capability procedure. Correct the App ID capability list, remove the EAS-stored App Store provisioning profile again, then rerun the production build. Do not upload a binary from a build with entitlement or provisioning errors.

## Web App Folder Rename

The nested Next.js application folder must be renamed from `charlotte-third-places` to `web` before the shared package extraction begins.

Current local structure:

```text
charlotte-third-places/
  charlotte-third-places/
    app/
    components/
    lib/
    styles/
  mobile/
```

Target local structure:

```text
charlotte-third-places/
  web/
    app/
    components/
    lib/
    styles/
  mobile/
```

Rename command:

```powershell
Rename-Item -Path .\charlotte-third-places -NewName web
```

After the local folder rename, update every repository reference that points at the old nested app folder. Verified reference groups include:

- GitHub Actions paths in `.github/workflows/unit-tests.yml` and `.github/workflows/e2e-tests.yml`, including `cache-dependency-path`, coverage artifacts, Playwright report artifacts, and test result artifacts.
- `.github/copilot-instructions.md`, which currently identifies `/charlotte-third-places/` as the main Next.js application directory.
- `.github/instructions/theme-color-sync.instructions.md`, whose `applyTo` pattern currently points at `charlotte-third-places/components/ThemeColorSync.tsx`, `charlotte-third-places/styles/globals.css`, `charlotte-third-places/app/manifest.webmanifest`, and `charlotte-third-places/app/layout.tsx`.
- `.github/agents/place-types-specialist.md`, whose target files currently point at `charlotte-third-places/lib/place-type-config.ts` and `charlotte-third-places/components/Icons.tsx`.
- Root `README.md` media paths that currently point at `charlotte-third-places/media/...`.
- Documentation paths in `docs/testing.md`, `docs/ai.md`, `docs/user-lists-plan.md`, and this document.
- Any scripts, task definitions, or command examples that `cd` into `charlotte-third-places` to run Next.js commands.

The Next.js package `name` field may remain `charlotte-third-places`. The rename changes the filesystem app folder name, not the product name, npm package identity, Expo slug, bundle identifier, or public domain.

After the local rename lands, update the Vercel project root directory at:

```text
https://vercel.com/segun-akinyemis-projects/charlotte-third-places/settings/build-and-deployment
```

Set the Vercel Root Directory to:

```text
web
```

Do this only after the local repository has been updated and pushed with the renamed folder. Until Vercel's Root Directory is changed to `web`, Vercel builds will look for the old nested folder and fail.

## Current Codebase Facts

These facts were verified from the current repository and must drive the implementation plan.

### Existing Web Routes


### Existing API Routes


These endpoints are not speculative. They are the current compatibility surface.

### Existing Data Source

`charlotte-third-places/lib/data-services.ts` currently owns data loading:


Server-only parts of this file stay server-only. Pure normalization parts move to shared code after server-only imports are removed.

## Target Repository Layout

```text
charlotte-third-places/
  package.json
  packages/
    core/
      package.json
      src/
        index.ts
        places/
          types.ts
          schemas.ts
          normalize.ts
          place-type-metadata.ts
          highlights.ts
        filters/
          definitions.ts
          predicates.ts
          sorting.ts
        hours/
          operating-hours.ts
        api/
          contracts.ts
          client.ts
        text/
          normalize.ts
        arrays/
          shuffle.ts
    shared-react/
      package.json
      src/
        index.ts
        filters/
          FilterProvider.tsx
          reducer.ts
          hooks.ts
        modals/
          surface-stack.ts
          types.ts
          actions.ts
  web/
    app/
    components/
    contexts/
    lib/
    styles/
  mobile/
    app/
    components/
    features/
    hooks/
    lib/
    styles/
    assets/
```

`packages/core` and `packages/shared-react` are separate because `packages/core` must not import React. Shared React state belongs in `packages/shared-react`, not core.

## Code Reuse Classification

Every migration task must classify source code using this table before moving or rewriting it.

| Classification | Rule | Examples |
| --- | --- | --- |
| Shared pure core | Runs without React, DOM, Next.js, Expo, native APIs, Tailwind, shadcn, or secrets | `Place`, `SortOption`, filter definitions, filtering predicates, sort logic, hours parsing, text normalization |
| Shared React state | Imports `react` only and has no renderer-specific API | `FilterProvider`, filter reducer, filter hooks, modal surface stack action contract |
| Shared contract with platform adapters | Same behavior, different rendering/runtime implementation | modal stack provider, place type icons, place highlights, share action, external links |
| Web-only | Requires DOM, Next.js, Radix/shadcn DOM primitives, `window`, `document`, CSS media queries, browser history | `DataTable`, `PlaceModal`, `PhotosModal`, web `ModalProvider`, `FilterDrawer`, `FilterSidebar` |
| Native-only | Requires Expo or React Native APIs | Expo Router routes, native tabs/stacks, native map, `expo-image`, native share sheet, native offline storage |

## `packages/core` Requirements

`packages/core` is pure TypeScript. It must not import:


Move these current concepts into `packages/core`:


Do not move `cn()` to core. `cn()` depends on Tailwind class merging and belongs in platform UI utility packages.

## Runtime Validation Decision

The current Next.js app already lists `zod` as a direct dependency, but first-party source currently does not define app-owned Zod schemas for the catalog. Current runtime validation is mostly ad hoc parsing in `data-services.ts`.

Zod is a TypeScript-first runtime validation library. TypeScript checks code at compile time. Zod checks untrusted data at runtime. It is needed at boundaries where Airtable, CSV, or HTTP JSON enters the application.

Use Zod in `packages/core` only for untrusted data boundaries:


Do not create Zod schemas for every internal UI type. Do not validate local component state with Zod unless that state crosses a network, storage, or persisted boundary.

Required validator files:

```text
packages/core/src/places/schemas.ts
packages/core/src/filters/schemas.ts
packages/core/src/api/contracts.ts
```

The `Place` TypeScript type and the `PlaceSchema` runtime validator must agree. API routes must validate outbound data before returning it to mobile. Mobile must validate API responses before storing them in the persisted query cache.

## Shared React State Requirements

`web/contexts/FilterContext.tsx` is reusable as React state because it imports React and shared helper functions but does not depend on DOM APIs. The same file is currently located at `charlotte-third-places/contexts/FilterContext.tsx` until the web folder rename is performed. It must be lifted into `packages/shared-react`.

Move these pieces into `packages/shared-react`:


Both web and mobile must import filter state from `packages/shared-react`. The mobile app must not create a separate native-only filter reducer.

The UI that consumes filter state remains platform-specific:


## Modal Surface Stack Requirements

`web/contexts/ModalContext.tsx` cannot be moved wholesale because it imports Next dynamic, web modal components, DOM loading states, and writes to `window.history`. The same file is currently located at `charlotte-third-places/contexts/ModalContext.tsx` until the web folder rename is performed.

The shared part is the surface stack contract:

```ts
type SurfaceKind = 'place' | 'chat' | 'photos';

type Surface =
  | { id: string; kind: 'place'; place: Place; hideAskAI?: boolean }
  | { id: string; kind: 'photos'; place: Place }
  | { id: string; kind: 'chat'; place: Place; initialMessage?: string };

type ModalActions = {
  pushPlace(place: Place, options?: { hideAskAI?: boolean }): void;
  pushPhotos(place: Place): void;
  pushChat(place: Place, initialMessage?: string): void;
  pop(): void;
  popTo(id: string): void;
  closeAll(): void;
};
```

Required behavior:

- Stack order is bottom-to-top.
- Back closes the top surface first.
- Place -> Photos reveals Place again after Photos closes.
- Place -> Chat preserves the place context.
- Chat -> Place opens the place above the chat and preserves the chat session.
- Places opened from chat use `hideAskAI: true` to prevent Chat -> Place -> Ask AI -> Chat loops.
- Web Back/Forward sync remains in the web provider.
- Native back handling is implemented in the native provider through Expo Router/native navigation primitives.

Implementation split:

- `packages/shared-react/src/modals/*`: shared surface types, reducer, action contract.
- `web/contexts/ModalContext.tsx`: web provider, `window.history` sync, renders `PlaceModal`, `PhotosModal`, `ChatModal`.
- `mobile/features/modals/modal-provider.tsx`: native provider, native back behavior, renders native Place/Photos/Chat surfaces.

## Place Type Metadata And Icons

`web/lib/place-type-config.ts` imports `components/Icons.tsx`, so it cannot move unchanged into core. The same file is currently located at `charlotte-third-places/lib/place-type-config.ts` until the web folder rename is performed.

Split it into shared metadata plus platform icon adapters.

Core metadata shape:

```ts
type PlaceTypeMetadata = {
  type: string;
  iconKey: string;
  emoji: string;
  mapColor: string;
};
```

Core owns:

- place type labels
- emoji values
- marker colors
- semantic icon keys
- fallback type metadata

Web owns:

- mapping `iconKey` to `Icons.*` from `components/Icons.tsx`

Mobile owns:

- mapping `iconKey` to the selected native icon implementation
- native marker glyph rendering

Map marker colors must come from core metadata on both platforms.

## Place Highlight Rules

`web/components/PlaceHighlights.tsx` mixes pure highlight rules with JSX icons and Tailwind classes. It cannot move unchanged. The same file is currently located at `charlotte-third-places/components/PlaceHighlights.tsx` until the web folder rename is performed.

Split it into:

1. Core highlight rules.
2. Web highlight rendering adapter.
3. Native highlight rendering adapter.

Core returns semantic descriptors:

```ts
type HighlightDescriptor = {
  key: string;
  priority?: number;
  badgeToken?: string;
  ribbonToken?: string;
  gradientToken?: 'featured' | 'comingSoon';
  label?: string;
  iconKey?: string;
  ariaLabel?: string;
};
```

Core must preserve current highlight logic:

- `featured`: priority 1, featured badge, featured ribbon, featured card/modal gradient.
- `comingSoon`: priority 2, coming soon badge, coming soon ribbon, coming soon card/modal gradient.
- `habesha`: tag match `Habesha`, badge only.
- `blackOwned`: tag match `Black Owned`, badge only.
- `french`: tag match `French`, badge only.
- `veteranOwned`: tag match `Veteran Owned`, badge only.
- `christian`: tag match `Christian`, priority 3, badge only.
- `cinnamonRoll`: `hasCinnamonRolls` is `Yes`, `TRUE`, or `true`, badge only.

Web adapter maps descriptors to Tailwind classes and web icons. Native adapter maps descriptors to NativeWind classes/native styles and native icons. The ordering of badges must match current web behavior: unprioritized badges first in definition order, prioritized badges sorted descending so priority 1 ends rightmost.

## API Boundary

The mobile app consumes HTTP APIs. It never talks directly to Airtable, CSV files, Cosmos DB, Azure OpenAI, or server secrets.

Preserve the current endpoints:

- `GET /api/places`: compatibility endpoint returning raw `Place[]`.
- `GET /api/places/[id]`: compatibility endpoint returning a raw `Place` or 404.
- `POST /api/chat`: streaming chat endpoint.

Add versioned endpoints for the mobile implementation:

- `GET /api/v1/places`: returns a typed envelope.
- `GET /api/v1/places/[id]`: returns a typed envelope for a single place.

Mobile must use the versioned endpoints. Existing web code may keep using server functions and compatibility endpoints during the extraction. New cross-platform clients use versioned endpoints.

Catalog envelope:

```ts
type PlacesResponse = {
  schemaVersion: 1;
  generatedAt: string;
  source: 'airtable' | 'local-csv';
  totalCount: number;
  places: Place[];
};
```

Single place envelope:

```ts
type PlaceResponse = {
  schemaVersion: 1;
  generatedAt: string;
  place: Place;
};
```

API routes validate data before returning. Mobile validates data before persisting it.

## Data Fetching And Offline Storage

Use TanStack Query for mobile server state. Use Expo SQLite only as the persisted key-value storage backend for TanStack Query cache during the parity migration. Do not create relational SQLite tables or use Drizzle in the parity migration.

These tools occupy different layers:

- TanStack Query: server-state orchestration, request deduping, loading/error states, retry, stale/fresh timing, background refetch, reconnect behavior, and cache persistence.
- Expo SQLite: on-device SQL database engine for local relational storage, full-text search, SQL queries, transactions, and durable local data.
- Drizzle: TypeScript ORM/query builder/migration layer that sits on top of SQLite or another SQL database. Drizzle does not replace TanStack Query.

Parity migration decision:

1. Install and use `@tanstack/react-query`.
2. Install and use `@tanstack/react-query-persist-client`.
3. Install and use `@tanstack/query-async-storage-persister`.
4. Install and use `expo-sqlite` for `expo-sqlite/kv-store` as the AsyncStorage-compatible persistence backend.
5. Install and use a network state integration such as `@react-native-community/netinfo` for online/offline state.
6. Do not create `places`, `photos`, `tags`, or `filters` SQLite tables during the parity migration.
7. Do not add Drizzle during the parity migration.

Professional offline behavior for the parity migration means:

- After one successful online launch, the app can cold-launch offline and show the last successful catalog.
- Place detail works offline for places already present in the cached catalog.
- Filters, quick search, sort, Open Now, dynamic tags, and card rendering work over the cached catalog.
- The app shows an explicit offline state when offline.
- Pull-to-refresh attempts to refetch and reports failure without clearing cached data.
- Reconnect triggers refetch of stale queries.

SQLite tables and Drizzle become required only when a later feature adds local relational ownership: offline saved lists, offline user mutations, queued writes, conflict resolution, full offline full-text search, or catalog size/performance that cannot be handled by persisted JSON plus in-memory shared filters.

## Mobile Styling Stack

Use NativeWind v5 as the styling foundation and React Native Reusables as the component layer.

This decision intentionally follows the local `expo-tailwind-setup` skill instead of the general Expo UI preference for inline styles because this migration requires exact visual parity with an existing Tailwind/shadcn web app.

Required mobile styling stack:

- NativeWind v5
- React Native Reusables
- `react-native-css` per the local Expo Tailwind setup guidance
- `tailwind-merge` and `clsx` in the native UI utility layer
- Expo font loading for Inter, JetBrains Mono, and IBM Plex Sans equivalents

Port these web tokens from `web/styles/globals.css` into the native theme after the folder rename. Before the rename, the source file is `charlotte-third-places/styles/globals.css`.

- light: `--background: 190 60% 97%`
- light: `--foreground: 210 5% 20%`
- light: `--card: 0 0% 99%`
- light: `--primary: 190 100% 42%`
- light: `--primary-foreground: 0 0% 100%`
- light: `--secondary: 270 90% 65%`
- light: `--secondary-foreground: 0 0% 100%`
- light: `--accent: 190 30% 88%`
- light: `--warm-accent: 30 90% 70%`
- light: `--muted: 190 10% 90%`
- light: `--muted-foreground: 210 5% 40%`
- light: `--destructive: 0 100% 50%`
- light: `--border: 190 20% 80%`
- light: `--input: 190 20% 80%`
- light: `--ring: 190 100% 42%`
- `--radius: 1.25rem`
- all `--map-control*` tokens
- all dark theme equivalents in `.dark`

Native components must not hardcode replacement brand colors. They consume shared tokens.

## Mobile Route Tree

The Expo app uses Expo Router. Routes live in `mobile/app`. Components, hooks, utilities, and feature code do not live in route files.

Required route tree:

```text
mobile/app/
  _layout.tsx
  (tabs)/
    _layout.tsx
    index.tsx
    map.tsx
    chat.tsx
    contribute.tsx
    more.tsx
  places/
    [id].tsx
  modals/
    photos.tsx
    chat.tsx
  +not-found.tsx
```

Tab mapping:

- `index.tsx`: Home, Random/feed, Browse list.
- `map.tsx`: Map.
- `chat.tsx`: AI chat page.
- `contribute.tsx`: Contribute cards linking to Airtable form URLs.
- `more.tsx`: About and Legal entry points.

Place detail route:

- `places/[id].tsx`: native place detail screen for deep links and direct navigation.

Modal routes:

- `modals/photos.tsx`: native photos surface.
- `modals/chat.tsx`: place-scoped chat surface.

## Screen Parity Requirements

### Home

Native Home must reproduce the current `HomePageClient` behavior:

- Load places from the shared query hook backed by `/api/v1/places`.
- Wrap Home content in the shared `FilterProvider` from `packages/shared-react`.
- Display total place count.
- Preserve copy meaning from the web Home page.
- Preserve AI recommendation CTA behavior by navigating to the native Chat tab.
- Do not show the web "Get the App" banner in native.
- Provide four mobile instant actions matching the current web mobile layout: Random, Map, Chat, Browse.
- Preserve Random/feed behavior using the same exclusion list: `Starbucks`, `Panera`.
- Render a native Random/feed carousel equivalent to `ResponsivePlaceCards`.
- Render Browse list below the Random/feed section.

### Browse List

Native Browse must preserve the current `PlaceListWithFilters` and `DataTable` behavior:

- Use the shared `PlacesContext` enriched by `injectDynamicTags`.
- Use the shared filter contexts.
- Apply quick search with `normalizeTextForSearch`.
- Apply `placeMatchesFilters`.
- Apply Open Now by filtering with `isPlaceOpenNow` using one `getCharlotteTimeNow()` snapshot per operation.
- Apply `sortPlaces` with featured-first priority.
- Show Coming Soon count from `operational === 'Coming Soon'`.
- Show visible result count.
- Use native list virtualization. Use `FlashList` or React Native `FlatList`; choose one during implementation and record the decision in the implementation PR. The virtualized list must keep smooth scrolling with the full current catalog.

Filter fields must match `FILTER_DEFS` exactly:

- `name`: scalar, picker field.
- `neighborhood`: multi-select scalar, fixed OR mode, picker field.
- `type`: multi-select array, default OR mode, picker field.
- `tags`: multi-select array, default AND mode, picker field.
- `parking`: array, chip field, allowed `Free`, `Paid`.
- `freeWiFi`: scalar, chip field, allowed `Yes`, `No`.
- `purchaseRequired`: scalar, chip field.
- `size`: scalar, chip field, allowed `Small`, `Medium`, `Large`.
- `hasCinnamonRolls`: scalar, chip field, allowed `Yes`, `No`, `Sometimes`.

### Place Card

Native place cards must preserve visible information and actions from `PlaceCard`:

- Name.
- Plain-text description preview derived from Airtable markdown.
- Size tag.
- Type tags with overflow handling and `+N more` indicator.
- Neighborhood tag with overflow handling.
- Highlight badges in the same semantic order.
- Chat button unless the place is Coming Soon.
- Photos button only when photos exist.
- Info button opens place detail.
- Tapping the card opens place detail.

Native cards use native press handlers, native haptics where appropriate, and shared highlight descriptors. Web JSX and web icon components are not reused.

### Place Detail

Native place detail must preserve the current `PlacePageClient` and `PlaceContent` behavior:

- Enrich a single raw place with `injectDynamicTags([place])[0]`.
- Display title.
- Display photo gallery at the top when photos exist.
- Use display image URLs for main slides.
- Use thumbnail URLs for filmstrips/rails to keep decoded image memory low.
- Hide failed images from the visible carousel.
- Show photo source disclosure text: "Photos come from publicly available sources, the site curator, and users. Use the Contribute page to request a takedown."
- Show primary action row: Google Maps, Apple Maps, Photos, Website, Share, Ask AI.
- Google Maps, Apple Maps, Website, and social links open outside the app with native link handling.
- Share uses native share sheet.
- Quick facts include address, neighborhood, size, purchase required, parking, free Wi-Fi, cinnamon rolls, operating hours, tags, and social links.
- Description renders Airtable rich text/markdown as native text.
- Comments render when non-empty.
- Metadata displays Added and Last Updated dates.
- Ask AI opens place-scoped chat using the shared modal surface contract.

### Photos

Native Photos must preserve the current photos behavior:

- Full-screen native surface.
- Swipe between photos.
- Use display URLs for active/full-size images.
- Use thumbnail URLs for preview rails.
- Exclude failed images after image load failure.
- Preserve photo source disclosure.
- Back closes Photos and returns to the place surface underneath.

### Map

Native Map must preserve `PlaceMap` behavior:

- Default center: Charlotte city center `{ lat: 35.23075539296459, lng: -80.83165532446358 }`.
- Default zoom equivalent: web zoom 11.
- Show markers only for places with valid non-zero latitude and longitude.
- Use shared place type map colors.
- Featured places use featured marker treatment.
- Marker tap opens place surface.
- Open Now toggle filters markers using shared hours logic.
- Find Me requests foreground location permission only from the user action, not on app launch.
- Successful location sets user marker, pans map to the user, and uses zoom equivalent to web zoom 14.
- Location failure shows a native error state explaining that location access is required.
- Web zoom-dependent labels are reproduced using native marker labels when feasible. Native implementation must cap visible labels at 30 and only show labels when zoomed in to the native equivalent of web zoom 12 or closer.

### Chat

Native Chat must preserve `ChatContent` behavior:

- General page chat uses `/api/chat`.
- Place-scoped chat sends the place context to `/api/chat`.
- Starter prompts on the Chat page:
  - "What are some good spots for groups?"
  - "What places are great for remote work?"
  - "What are some hidden gem third places?"
  - "Where can I find a quiet spot to read with a view?"
- Place prompts:
  - "How's access to outlets and Wi-Fi?"
  - "What's the vibe and aesthetic like here?"
  - "What are some fun facts about this place?"
  - "What are the best times to visit to avoid crowds?"
- Initial message support is preserved.
- Clear history is preserved.
- Stop streaming is preserved.
- Copy message is preserved through native clipboard.
- Internal `/places/{id}` links in AI responses are intercepted. They open a native place surface above the chat instead of replacing the chat route.
- Links to the same place currently being discussed render as non-clickable emphasis text.
- Failed place link resolution appends an assistant error message instead of destroying the chat session.

### Contribute

The current web Contribute page shows three cards and opens Airtable form URLs. Native must implement the same three cards as native UI and open the same URLs with `expo-web-browser` or the platform browser. It must not embed the forms in a WebView.

Required cards:

1. Title: `Suggest a New Place`
   - Description: `Know a great third place in Charlotte that's not listed? Suggest it here and help others discover new spots!`
   - URL: `https://airtable.com/embed/apptV6h58vA4jhWFg/pag4ZYWhjh1Ua96ul/form`
   - Button: `Submit Suggestion`
2. Title: `Enhance an Existing Place`
   - Description: `Have updates, corrections, or more details about a place already listed? Submit your enhancements to keep info fresh.`
   - URL: `https://airtable.com/embed/apptV6h58vA4jhWFg/pagu6cjLrQKhXBnvS/form`
   - Button: `Submit Update`
3. Title: `Contact the Site Creator`
   - Description: `Questions, feedback, or want to get in touch? Use this form to contact the creator directly.`
   - URL: `https://airtable.com/embed/apptV6h58vA4jhWFg/pagLva6jz6obzayaT/form`
   - Button: `Send Message`

### About And Legal

Native app parity requires About and Legal access from the More tab.

Implementation decision:

- More renders native list rows for About and Legal.
- Selecting About opens a native About screen or platform browser route to the web About page. The parity implementation uses platform browser links first because the current public website owns SEO/legal content and there is no account-specific native legal requirement in the current app.
- Selecting Legal opens the platform browser route to the web Legal page.
- No WebView is used.

## React Native New Architecture

React Native New Architecture stays enabled.

Important pieces:

- Fabric: native renderer for React Native views.
- TurboModules: native module system with lazy loading and typed contracts.
- Codegen: generated typed bindings between JavaScript/TypeScript and native code.
- JSI: direct JavaScript/native interface without the old serialized bridge cost.
- Concurrent React support: modern scheduling, transitions, automatic batching, and responsive update prioritization.

New Architecture is not a performance guarantee. It is the runtime foundation. The app still needs native list virtualization, careful image usage, minimal render churn, and real-device testing.

## Native Modules And Native Code

Native code is allowed when it is the correct tool. Use Expo config plugins, Expo Modules, or maintained Expo/community modules for native capabilities.

Native modules are allowed for:

- maps
- location
- image caching
- share sheet
- browser handoff
- secure storage after auth exists
- push notifications after push exists
- purchases after billing exists
- app intents, widgets, Live Activities, or background work after those features exist

The parity migration does not add push, purchases, auth, accounts, lists, or billing.

## Future-Only Features

The following areas are architecturally planned but are not part of the current parity migration:

- user accounts
- authentication
- saved places
- user-created lists
- list sharing and moderation
- account deletion
- push notifications
- purchases
- credits
- subscriptions
- RevenueCat
- StoreKit/Google Play Billing
- local relational SQLite tables
- Drizzle ORM

When those features start, they must be designed against shared contracts in `packages/core` and separate web/native clients. They must not be bolted onto the current PWA wrapper as the long-term path.

## Implementation Order

1. Create npm workspace structure for `packages/core` and `packages/shared-react`.
2. Rename the nested Next.js app folder from `charlotte-third-places` to `web`.
3. Update all repository references from the old nested app path to `web`.
4. Push the folder rename and reference updates.
5. Change the Vercel project Root Directory to `web` in the Build and Deployment settings.
6. Move platform-free types into `packages/core`.
7. Move filter definitions, predicates, sort logic, text normalization, and operating-hours logic into `packages/core`.
8. Add Zod runtime validators at data/API boundaries only.
9. Split place type config into core metadata and web/native icon adapters.
10. Split place highlights into core rules and web/native render adapters.
11. Move FilterContext into `packages/shared-react`.
12. Extract modal surface stack contract into shared code and keep platform providers separate.
13. Update the existing Next.js app imports so all current web tests and behavior continue to pass.
14. Preserve existing `/api/places`, `/api/places/[id]`, and `/api/chat` compatibility behavior.
15. Add `/api/v1/places` and `/api/v1/places/[id]` typed envelope endpoints for mobile.
16. Configure mobile NativeWind v5, React Native Reusables, fonts, tokens, and shared icon adapters.
17. Configure TanStack Query with persisted cache using `expo-sqlite/kv-store`.
18. Replace Expo starter screens with the required route tree.
19. Implement Home, Browse, and Place Card parity.
20. Implement Place Detail and Photos parity.
21. Implement Map parity.
22. Implement Chat parity.
23. Implement Contribute, More, About, and Legal access parity.
24. Validate offline cold launch after one successful online launch.
25. Validate on a physical iPhone development build.
26. Validate Android after iOS parity is stable.

## Verification Gates

### Shared Core Gate

`packages/core` must build and test without importing platform code.

Fail the gate if core imports:

- React rendering packages
- Next.js
- Expo
- React Native
- Tailwind/shadcn
- icon components
- browser storage APIs
- native storage APIs
- direct database clients
- server secrets

Required tests:

- filters and match modes
- sort behavior and featured-first ordering
- quick search normalization
- operating-hours parsing
- dynamic tag injection
- place photo manifest parsing
- place type metadata lookup
- highlight descriptor ordering
- API response validation

### Web Gate

The Next.js app must continue to serve:

- homepage
- place pages
- map page
- chat page
- contribute page
- about page
- legal page
- places API routes
- chat API route
- sitemap and robots
- existing PWA/offline behavior

Existing web tests for filters, operating hours, modal context, place cards, and performance must pass after shared-code extraction.

### Mobile Gate

The Expo app must render every primary interactive surface with native React Native views.

Fail the gate if final mobile flows use:

- `WebView`
- `use dom`
- Expo DOM Components
- embedded Next.js pages for primary app screens
- direct Airtable access
- direct Cosmos DB access
- direct Azure OpenAI access from the client

### Real iOS Gate

Test on a physical iPhone for:

- cold launch
- repeat launch
- Metro connection in development build
- foreground/background restore
- tabs
- native stack transitions
- native modal/sheet transitions
- Browse virtualization
- Random/feed carousel
- image loading and failed-image handling
- place detail
- photos
- map markers
- Find Me permission flow
- share sheet
- chat streaming
- internal chat place links
- external links
- offline repeat launch
- reconnect refetch

### Offline Gate

1. Launch online.
2. Load catalog successfully.
3. Open at least one place detail.
4. Quit the app.
5. Enable airplane mode.
6. Relaunch.
7. Confirm cached catalog renders.
8. Confirm filters/search/sort work against cached data.
9. Confirm cached place detail opens.
10. Confirm app displays offline state.
11. Disable airplane mode.
12. Confirm stale catalog refetches without clearing visible cached data.

## Sources And Rationale

- Expo SQLite docs: persistent local SQL database, key-value storage, SQLCipher, FTS, Drizzle integration. <https://docs.expo.dev/versions/latest/sdk/sqlite/>
- TanStack Query docs: server-state fetching, caching, synchronization, retries, stale/fresh state, persistence. <https://tanstack.com/query/latest/docs/framework/react/overview>
- TanStack Query AsyncStorage persister docs. <https://tanstack.com/query/latest/docs/framework/react/plugins/createAsyncStoragePersister>
- Drizzle ORM overview and Expo SQLite integration. <https://orm.drizzle.team/docs/overview>, <https://orm.drizzle.team/docs/connect-expo-sqlite>
- NativeWind docs: Tailwind CSS styling workflow for React Native. <https://www.nativewind.dev/>
- React Native Reusables docs: shadcn/ui-style component layer for React Native. <https://reactnativereusables.com/>
- React Native New Architecture docs. <https://reactnative.dev/architecture/landing-page>
- Expo Router docs. <https://docs.expo.dev/router/introduction/>
- Shopify Engineering, "Five years of React Native at Shopify." <https://shopify.engineering/five-years-of-react-native-at-shopify>
- Shopify Engineering, "React Native is the Future of Mobile at Shopify." <https://shopify.engineering/react-native-future-mobile-shopify>
