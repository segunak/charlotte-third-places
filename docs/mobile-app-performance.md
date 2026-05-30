# Mobile App Performance And Native-Feel Plan

Last updated: 2026-05-30

This document captures the complete agreed plan for making Charlotte Third Places feel faster, smoother, and more native in the existing mobile app architecture. It also records the planning context and the decisions made during the discussion so implementation can proceed without reopening settled questions.

The work applies to the current architecture:

- Next.js App Router application hosted on Vercel.
- Static-first pages and API routes backed by Airtable data at build/regeneration time.
- Serwist service worker for PWA behavior.
- Android app delivered through PWABuilder Trusted Web Activity.
- iOS app delivered through the checked-in PWABuilder Swift `WKWebView` wrapper.

The goal is not to make the app look different. The goal is to reduce surprise reloads, reduce mobile startup and interaction work, make catalog data local and resilient, and preserve every existing user-facing workflow.

## Executive Summary

We are keeping the current PWABuilder/Vercel architecture and improving it in place.

The highest-value changes are:

1. Disable Serwist surprise `online` reload behavior.
2. Expand `scripts/generate-airtable-data.ts` to generate public places catalog JSON and a manifest from the existing `data-services.ts` mapping.
3. Add Dexie-backed IndexedDB for local catalog persistence.
4. Cache only deterministic static assets and generated `/data/*` catalog files in Serwist.
5. Keep Azure Blob photos `NetworkOnly` in the service worker.
6. Render exactly 20 mobile Random cards instead of every filtered place.
7. Defer the Browse/DataTable surface until explicit Browse intent or viewport proximity.
8. Keep `PlaceCard -> PlaceModal` synchronous and local.
9. Keep iOS pull-to-refresh as a full `WKWebView.reload()` user-controlled hard refresh.

This is an app-native-feel plan, not a rewrite. The public website remains the canonical app surface, and routine content updates still happen through the web deployment/data pipeline.

## Context From The Planning Conversation

The original investigation started with a broad architecture question: understand how Charlotte Third Places is built as a Next.js/static-first site and how PWABuilder turns the site into iOS and Android apps.

The discussion then narrowed to a practical product goal: make the installed mobile app feel more native, especially on iOS, so users do not feel like they are just inside a website wrapper.

Several paths were considered and rejected:

- Capacitor was considered but rejected for now. Capacitor would still use `WKWebView` on iOS. A production Capacitor local bundle would require a larger architecture split around static assets and remote APIs, while Capacitor `server.url` would be close to the current live-site WebView approach and is not the right performance cure.
- A separate `/app` route was considered but rejected for now. We will optimize the existing homepage/app entry first.
- Disabling iOS pull-to-refresh was considered and rejected. Pull-to-refresh remains a legitimate native-style manual hard refresh gesture.
- Service-worker photo caching was considered and rejected because the current service worker intentionally keeps Azure Blob photos `NetworkOnly` to avoid iOS WebView storage pressure and a recent image-caching bug.
- Custom navigation caching was considered and rejected. We do not want to change page navigation freshness behavior as part of this work.
- `/api/places` custom caching was considered and rejected. The generated versioned JSON becomes the canonical local catalog transport.
- Generated derived-field catalog schemas were considered and rejected. Catalog JSON v1 is plain full `Place[]` only.

The final direction is an integrated performance/native-feel sprint built around the current stack.

## Current Architecture Baseline

### Web App

The main application lives in `charlotte-third-places/charlotte-third-places`.

Important files:

- `app/page.tsx`: static homepage server component that fetches places and passes them to the client.
- `components/HomePageClient.tsx`: main homepage client experience.
- `contexts/FilterContext.tsx`: filtering, quick search, sort, open-now, and dynamic tag state.
- `components/ResponsivePlaceCards.tsx`: desktop feed and mobile Random carousel/deck behavior.
- `components/CardCarousel.tsx`: Embla wrapper that renders `PlaceCard` slides.
- `components/PlaceListWithFilters.tsx`: Browse surface, filters, quick filters, drawer/sidebar, and DataTable loading.
- `components/DataTable.tsx`: virtualized Browse list using `@tanstack/react-virtual`.
- `components/PlaceCard.tsx`: card tap target that opens a modal with local/in-memory place data.
- `components/PlaceModal.tsx`: modal detail surface.
- `lib/data-services.ts`: canonical Airtable/CSV-to-`Place` mapping and `getPlaces()` data source logic.
- `lib/types.ts`: `Place` and related shared types.

The public site already has a strong static-first baseline. The homepage gets a static/server-provided `Place[]`, so first paint is not waiting on client-side Airtable calls.

### Data Source

Production data comes from Airtable. Local development can use CSV data from `local-data/Charlotte Third Places-Production.csv`.

Important rule: do not duplicate full Airtable/CSV-to-`Place` mapping in build scripts. The generator should reuse or share the existing mapping path from `lib/data-services.ts`.

### PWA And Serwist

Important files:

- `app/layout.tsx`: registers `SerwistProvider`.
- `app/sw.ts`: service worker source.
- `app/serwist/[path]/route.ts`: Serwist route builder for `/serwist/sw.js`.

Current important behavior:

- Service worker exists and uses Serwist.
- Offline fallback is `/~offline`.
- Azure Blob photo URLs under `https://thirdplacesdata.blob.core.windows.net/photos/` are already handled with `NetworkOnly`.
- Serwist provider needs `reloadOnOnline={false}` added to prevent surprise reloads.

### Native Wrappers

Android:

- PWABuilder TWA points at the live website.
- Android benefits from web, PWA, Serwist, and local-data improvements.
- Android source is not committed in this repo.

iOS:

- Checked-in Swift `WKWebView` wrapper lives under `ios/src/Third Places`.
- `Settings.swift` contains `pullToRefresh = true` and the root URL.
- `ViewController.swift` wires `UIRefreshControl` to `ThirdPlaces.webView?.reload()`.
- This pull-to-refresh behavior stays.
- The iOS app loads the live website; it does not bundle a static export.

## Locked Decisions

These are final unless new measured evidence contradicts them.

- Keep the current Next.js/Vercel web app as the canonical application.
- Keep PWABuilder/TWA/WKWebView architecture.
- Do not migrate to Capacitor in this performance pass.
- Do not create a separate `/app` route in this performance pass.
- Keep iOS pull-to-refresh as a full `WKWebView.reload()` user gesture.
- Add `reloadOnOnline={false}` to Serwist provider.
- Use Dexie for IndexedDB.
- Do not use Dexie Cloud.
- Do not add `dexie-react-hooks` unless a component-level live query is actually needed.
- Dexie v1 creates only catalog and catalog metadata stores.
- Do not create favorites/lists placeholder stores in v1.
- Expand the existing `scripts/generate-airtable-data.ts` script rather than creating a separate generator script.
- Reuse the existing `lib/data-services.ts` place mapping.
- Generate two public catalog files: a manifest and immutable versioned JSON.
- Catalog JSON v1 contains full `Place[]` only.
- No derived field wrapper in generated catalog JSON.
- No card/detail split in generated catalog JSON.
- Keep `schemaVersion` even though this is not an external public API.
- Hard-fail generation if any place has a missing or invalid `lastModifiedDate`.
- Do not use `generatedAt`, git SHA, or a partial max date as a fallback.
- Keep Azure Blob photos `NetworkOnly` in the service worker.
- Do not add service-worker photo caching.
- Do not change navigation caching behavior.
- Do not add custom `/api/places` caching.
- Use generated versioned JSON as the canonical local-data transport.
- Use `NetworkFirst` with a 3-second timeout for the catalog manifest.
- Use `CacheFirst` for versioned catalog JSON and hashed/static assets.
- Mobile Random renders exactly 20 cards.
- Mobile Random preserves current filter/sort/search reset behavior.
- Explicit shuffle is the only action that creates a new random global order.
- Deferred Browse uses `PlaceListWithFilters showIntro={false}`.
- Deferred Browse mounts on Browse intent or `1000px 0px` viewport proximity.
- Do not use idle preloading for Browse.
- Use permanent tests and guards, not temporary instrumentation.

## Why `schemaVersion` Exists

`schemaVersion` is not for an external API contract. We own all code upstream and downstream.

It exists because the app will persist catalog data in Dexie and cache catalog JSON through Serwist. A user can have old local data on-device after a later deployment changes the local catalog or Dexie shape. `schemaVersion` lets the app detect compatibility and either migrate or reseed.

It protects:

- persisted Dexie records
- service-worker-cached catalog JSON
- local provider assumptions
- future schema migrations

`schemaVersion` should rarely change. It changes only when the local catalog storage contract changes in a way that old persisted data may no longer be compatible with current code.

## Why Two Catalog Files Exist

We generate two files because they have different jobs.

### Manifest

File:

```text
public/data/places-manifest.json
```

Purpose:

- small mutable freshness check
- tells the app whether a newer catalog exists
- fetched periodically and on foreground checks
- cached with `NetworkFirst` and a 3-second timeout

Shape:

```json
{
  "schemaVersion": 1,
  "placesLastModifiedAt": "2026-05-25T00:00:00.000Z",
  "placeCount": 424,
  "placesUrl": "/data/places.v1.1789842384000.json"
}
```

### Versioned Catalog JSON

File pattern:

```text
public/data/places.v{schemaVersion}.{placesLastModifiedAtEpochMs}.json
```

Example:

```text
public/data/places.v1.1789842384000.json
```

Purpose:

- immutable catalog payload
- contains full `Place[]`
- cached with `CacheFirst`
- only downloaded when manifest says data changed

Shape:

```json
{
  "schemaVersion": 1,
  "placesLastModifiedAt": "2026-05-25T00:00:00.000Z",
  "places": []
}
```

One JSON file would force the app to fetch and possibly parse the full catalog just to ask whether anything changed. Two files let the app do cheap freshness checks while keeping the larger catalog payload immutable and cache-friendly.

## Why Generated JSON And Dexie Still Matter With Next Static Rendering

Next static rendering already gives the first page a strong server-rendered/static baseline. This plan does not pretend generated JSON is the biggest first-paint improvement.

The generated JSON and Dexie bring different wins:

- faster repeat launches
- better foreground resume behavior
- offline and slow-network catalog access
- silent data updates without full document reloads
- local persistence for app-like state
- future foundation for recent places, favorites, lists, and sync queues
- deterministic service-worker caching for catalog data

First-load rendering remains backed by static/server `places`. Dexie and generated JSON take over after hydration and on repeat visits.

## Phase 1: Stop Surprise Reloads

### File

```text
charlotte-third-places/charlotte-third-places/app/layout.tsx
```

### Change

Add `reloadOnOnline={false}` to `SerwistProvider`.

Current shape:

```tsx
<SerwistProvider swUrl="/serwist/sw.js" disable={disableServiceWorker}>
```

Target shape:

```tsx
<SerwistProvider
  swUrl="/serwist/sw.js"
  disable={disableServiceWorker}
  reloadOnOnline={false}
>
```

The exact formatting should follow local style when implemented.

### Why

The app should not reload because the browser or WebView fires an `online` event. That kind of reset feels unlike a native app and can destroy user context while browsing.

### Verification

- Dispatch or trigger an `online` event and verify the page does not reload.
- Confirm explicit iOS pull-to-refresh still reloads the page.

## Phase 2: Expand Airtable Build Output

### File

```text
charlotte-third-places/charlotte-third-places/scripts/generate-airtable-data.ts
```

### Current Behavior

The script currently:

- fetches place data from Airtable or CSV
- extracts distinct neighborhoods and tags
- writes `lib/ai/airtable-generated-data.ts`

### Target Behavior

The script should still write the current AI entity file exactly as before, and also write the public catalog files.

Outputs:

```text
lib/ai/airtable-generated-data.ts
public/data/places-manifest.json
public/data/places.v{schemaVersion}.{placesLastModifiedAtEpochMs}.json
```

### Mapping Rule

Do not create a second full mapping inside the script.

The generator should reuse or share the existing `Place` loading/mapping path from:

```text
charlotte-third-places/charlotte-third-places/lib/data-services.ts
```

The generated AI neighborhoods/tags should be derived from the canonical full `Place[]`.

### Catalog Payload V1

Catalog JSON v1 contains plain full `Place[]` only.

No derived fields.
No wrapper per place.
No card/detail split.
No precomputed UI data.

Shape:

```json
{
  "schemaVersion": 1,
  "placesLastModifiedAt": "2026-05-25T00:00:00.000Z",
  "places": []
}
```

### Manifest Shape

```json
{
  "schemaVersion": 1,
  "placesLastModifiedAt": "2026-05-25T00:00:00.000Z",
  "placeCount": 424,
  "placesUrl": "/data/places.v1.1789842384000.json"
}
```

### Date Rule

Generation must hard-fail if any place has a missing or invalid `lastModifiedDate`.

Rules:

- no fallback to `generatedAt`
- no fallback to git SHA
- no partial max from only valid records
- every place must have a valid `lastModifiedDate`

### Why

`placesLastModifiedAt` is the data version signal. If any record lacks it, the version can lie. A hard build failure is better than silently shipping stale or incorrectly versioned local data.

## Phase 3: Add Dexie Local Catalog

### Dependency

Add `dexie` as a direct dependency.

Do not add Dexie Cloud.

Do not add `dexie-react-hooks` unless implementation proves a direct component live query is needed.

### Suggested File

```text
charlotte-third-places/charlotte-third-places/lib/local-places-db.ts
```

### Dexie V1 Stores

Create only:

- `places`
- `catalogMetadata`

Do not create favorites, lists, or sync-queue stores yet. Those should be added when their product UI exists.

### Types

Add types in:

```text
charlotte-third-places/charlotte-third-places/lib/types.ts
```

Likely types:

- `PlacesCatalogManifest`
- `PlacesCatalogPayload`
- `PlacesCatalogMetadata`
- optional Dexie record types if needed

### Provider/Hook

Add a local places provider or hook, likely:

```ts
useLocalPlaces(initialPlaces)
```

Behavior:

1. First render uses SSR/static `places` from the page.
2. After hydration, seed Dexie from SSR/static places if needed.
3. Read freshest compatible places from Dexie.
4. Pass local/fresh places into `FilterProvider`.
5. Check `/data/places-manifest.json`.
6. If manifest is newer than local metadata, fetch `placesUrl`.
7. Validate `placeCount`.
8. Bulk replace/update Dexie.
9. Update UI silently.

### Update Check Timing

Check catalog manifest:

- on initial load
- every 60 minutes while active
- on `visibilitychange`, `pageshow`, and `online` only if last check is older than 60 minutes

Data updates apply silently. No user prompt is required for data-only updates.

## Phase 4: Conservative Serwist Caching

### Service Worker File

```text
charlotte-third-places/charlotte-third-places/app/sw.ts
```

### Keep Existing Photo Rule

The Azure Blob photos rule stays first and stays `NetworkOnly`.

Do not cache:

```text
https://thirdplacesdata.blob.core.windows.net/photos/*
```

### Add Only Static/Data Strategies

Use concrete Serwist imports:

- `CacheFirst`
- `NetworkFirst`
- `NetworkOnly`
- `ExpirationPlugin`
- `CacheableResponsePlugin`

Add strategies before `...defaultCache` for:

- `/_next/static/*`: `CacheFirst`
- stable same-origin fonts/icons/static assets: `CacheFirst`
- `/data/places-manifest.json`: `NetworkFirst` with a 3-second timeout
- `/data/places.*.json`: `CacheFirst`

Do not add:

- navigation caching changes
- page precaching
- custom `/api/places` caching
- photo caching

### Serwist Route File

```text
charlotte-third-places/charlotte-third-places/app/serwist/[path]/route.ts
```

Keep `/~offline`.

Add conservative non-navigation precache entries where practical:

- places manifest
- current versioned places JSON
- key icons/fonts

Do not precache:

- `/`
- `/map`
- `/chat`
- `/about`
- `/contribute`
- all place pages
- photos

### Why

This caches what is deterministic and safe while avoiding known risky areas. The app gets faster repeat loads and local catalog access without changing navigation freshness or image behavior.

## Phase 5: Bounded Mobile Random

### Files

```text
charlotte-third-places/charlotte-third-places/components/ResponsivePlaceCards.tsx
charlotte-third-places/charlotte-third-places/components/CardCarousel.tsx
```

### Current Problem

Mobile Random currently builds `mobileCarouselItems` from the full filtered order and passes all of it to `CardCarousel`. `CardCarousel` maps every item to a `PlaceCard` slide.

With hundreds of places, this can mount far more cards/slides than needed for the mobile interaction.

### Target Behavior

- Keep Embla.
- Keep full filtered/sorted place list.
- Keep a full shuffled index or ID queue for explicit shuffle.
- Render exactly 20 cards to Embla.
- Maintain a global cursor.
- Render a 20-card window centered around the cursor.
- Recenter/rebuild the 20-card window before the selected slide reaches the buffer edge.
- Preserve current filter/sort/search reset behavior.
- Explicit shuffle is the only action that creates a new random global order.

### Why

This is the most direct mobile performance win.

It reduces:

- mounted `PlaceCard` count
- Embla slide count
- layout work
- memory
- React reconciliation
- work competing with modal taps and swipes

## Phase 6: Deferred Browse

### Files

```text
charlotte-third-places/charlotte-third-places/components/HomePageClient.tsx
charlotte-third-places/charlotte-third-places/components/PlaceListWithFilters.tsx
```

### Current Problem

`PlaceListWithFilters` mounts immediately below Random. `DataTable` is already virtualized, so the list itself is not the same problem it used to be. The remaining problem is startup work from mounting the whole Browse surface before the user asks for Browse.

That Browse surface includes:

- dynamic DataTable path
- open-now computation
- coming-soon computation
- mobile quick filters
- filter drawer/sidebar plumbing
- toolbar state
- observer state
- modal state

### Target `PlaceListWithFilters` Change

Add prop:

```ts
showIntro?: boolean
```

Default:

```ts
showIntro = true
```

When `showIntro={false}`, hide the internal Browse heading and intro text.

### Target `HomePageClient` Change

Add `DeferredBrowseSection`.

It should always render:

- Browse anchor
- Browse heading
- Browse intro text
- sentinel/ref for viewport proximity

It should mount:

```tsx
<PlaceListWithFilters showIntro={false} />
```

only when:

- the user taps Browse, or
- the Browse sentinel enters a `1000px 0px` viewport root margin

Do not use idle preloading.

### Why

This preserves the Browse UX while removing Browse setup from the initial mobile Random path. On large desktop screens where Browse is already near or visible, it mounts immediately via viewport proximity.

## Phase 7: Keep Modal Path Local

### Files

```text
charlotte-third-places/charlotte-third-places/components/PlaceCard.tsx
charlotte-third-places/charlotte-third-places/components/PlaceModal.tsx
charlotte-third-places/charlotte-third-places/components/PlaceContent.tsx
```

### Rule

Keep components consuming plain `Place` objects.

Do not:

- pre-render every modal
- add generated derived wrappers
- add network fetches to card-to-modal path

### Why

`PlaceCard -> pushPlace(place) -> PlaceModal` already avoids Airtable/API calls. The modal path is not the main bottleneck and should remain simple.

## Phase 8: Verification

### Automated Tests

Add focused tests for:

Generator:

- current AI entity output still exists
- manifest has required fields
- `placeCount` matches payload
- `placesUrl` points to generated JSON
- catalog JSON contains full `Place[]`
- build fails if any place has missing or invalid `lastModifiedDate`

Dexie/local data:

- initial seed from static places
- manifest-change update
- stale manifest no-op
- bulk replace/update behavior
- schema version mismatch behavior

Random:

- mobile Random renders exactly 20 cards
- shuffle samples from full filtered catalog
- filter/sort/search reset behavior remains current behavior

Browse:

- Browse heading/anchor renders immediately
- `PlaceListWithFilters` does not mount initially when below threshold
- Browse button intent mounts it
- viewport proximity mounts it
- no duplicate Browse heading with `showIntro={false}`

Serwist:

- Azure Blob photos remain `NetworkOnly`
- generated `/data/*` assets use planned caching
- no navigation caching is added
- no custom `/api/places` caching is added

### Commands

Run from:

```text
charlotte-third-places/charlotte-third-places
```

Commands:

```bash
npm run test:unit:run
npm run build
npm run test:e2e
```

### Manual Checks

Test:

- iOS first launch
- iOS repeat launch
- slow network launch
- airplane-mode repeat launch
- foreground after more than 60 minutes
- explicit pull-to-refresh
- rapid Random swipes
- Browse button behavior
- Browse natural scroll behavior
- PlaceCard tap-to-modal latency
- no surprise reloads during normal browsing

## Implementation Order

This work can be implemented as one integrated sprint, but the dependency order should be:

1. Disable `reloadOnOnline`.
2. Expand `generate-airtable-data.ts` and shared data mapping.
3. Add catalog manifest/payload types.
4. Add Dexie dependency and local database module.
5. Add local places provider/hook.
6. Add Serwist static/data caching.
7. Implement bounded mobile Random.
8. Implement deferred Browse.
9. Add/adjust tests.
10. Run build, unit tests, and e2e tests.

## Expected User-Visible Improvements

- App no longer reloads unexpectedly when network state changes.
- Repeat launches feel faster because catalog data is local.
- Slow-network and offline repeat launches work better.
- Mobile Random swipes feel smoother because only 20 cards mount.
- Initial mobile homepage work is lighter because Browse does not mount before it is needed.
- Place modal taps remain local and responsive.
- Data can refresh silently without forcing a full page reload.
- Images and navigation behavior remain stable and conservative.

## Non-Goals

- No Capacitor migration.
- No separate `/app` route.
- No static export conversion.
- No iOS pull-to-refresh change.
- No photo service-worker caching.
- No custom navigation caching.
- No custom `/api/places` caching.
- No generated derived-field catalog schema in v1.
- No favorites/lists implementation in this performance pass.
- No temporary logging-only instrumentation.