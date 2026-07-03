# Mobile App Design And Architecture Plan

This document is the implementation handoff for replacing the current Charlotte Third Places PWA wrapper with a true Expo/React Native app while preserving the existing Next.js website as the web product.

The migration target is exact parity with the current live app and website. The React Native app must preserve the same catalog, same Home/Random/Browse/Map/Chat/Place Detail/Photos/Contribute/About/Legal functionality, same filtering semantics, same AI behavior, same visual identity, same place highlighting rules, same external link behavior, same sharing behavior, and same app-store bundle identity.

This document is intentionally deterministic. It does not use "if needed" as an implementation strategy. Each code path is classified as shared, platform-specific, and out of scope for the parity migration.

## Engineering Discipline For The Implementing Agent

This plan is executed by an LLM coding agent. The agent must follow these rules on every step. They are not optional.

- Build only what this plan specifies. Do not add features, screens, settings, abstractions, or configuration that this plan does not list.
- Do not over-engineer. Do not introduce a generic framework, plugin system, dependency-injection layer, event bus, or "future-proof" abstraction for a one-time operation.
- Do not add libraries that are not named in this plan. If a step seems to need a new dependency, stop and surface it before installing it.
- Match the existing code. Before writing a new function, read the current web implementation named in this plan and preserve its exact names, field names, constants, thresholds, and behavior.
- Move shared logic by extraction, not rewrite. When this plan says move a function to `packages/core`, copy the existing implementation, change imports, and keep the logic identical. Do not "improve" it.
- Do not add comments, JSDoc, or type annotations to code that is moved unchanged. Keep the original comments only.
- Do not add error handling for conditions that cannot occur. Validate only at the system boundaries this plan names: API responses, persisted cache reads, and untrusted Airtable/CSV input.
- Do not add defensive fallbacks, retries, or logging beyond what the named source already does and what this plan requests.
- Keep diffs tight. Each step touches only the files that step names. Do not reformat untouched files. Do not perform drive-by refactors.
- Do not delete or rewrite unfamiliar files. If a file's purpose is unclear, surface it instead of removing it.
- Do not run production builds (`next build`, release `expo prebuild`, EAS production builds) unless the active step explicitly requires it.
- When a step is ambiguous, stop and ask. Do not guess names, contracts, or behavior. This plan lists resolved decisions and verification items; treat any new ambiguity as a blocker.
- Prefer the smallest correct change. Clean, direct, minimal code wins over clever code.

## Open Questions And Porting Contention Ledger

Every item in this section exists because the current PWA wrapper gets behavior from the browser, WKWebView/TWA, Next.js, or DOM libraries that do not transfer directly to React Native. Items marked `OPEN` must be resolved before implementation starts. Items marked `DECIDED` are not open for implementation-time invention.

### Open Questions

#### OQ-01: AI Response Markdown

Status: `OPEN`

Current PWA/web behavior: `web/components/ChatContent.tsx` renders assistant text through Streamdown via `components/ai-elements/message.tsx`. Streamdown outputs DOM elements and supports markdown links.

React Native contention: Streamdown is not a React Native renderer. Native chat needs markdown text, links, code-ish formatting, and custom `/places/{id}` handling without DOM click delegation.

Evidence:

- [`react-native-markdown-display` describes itself as a React Native markdown renderer that uses native components, not a WebView, and exposes `onLinkPress`/custom rules for link behavior](https://www.npmjs.com/package/react-native-markdown-display).
- [React Native `Text` supports nested text and text styling for a small custom renderer if we choose to render only the current subset ourselves](https://reactnative.dev/docs/text).
- [AI SDK UI stream protocol docs show the assistant content arrives as text parts, so native rendering only needs to render the streamed text content, not execute server-side AI logic](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol).

Options:

- A. Add [`react-native-markdown-display`](https://www.npmjs.com/package/react-native-markdown-display) and override link rendering.
- B. Write a minimal native renderer using React Native [`Text`](https://reactnative.dev/docs/text) for the subset currently used in AI output.
- C. Add a [Next.js Route Handler](https://nextjs.org/docs/app/getting-started/route-handlers) endpoint that returns a parsed markdown AST; this would use the app's existing parser but is not backed by a required external platform capability.

Recommended default: A, if the new dependency is approved. B only if avoiding a new dependency is more important than using a maintained parser. C is rejected for parity because it creates extra backend shape for the same content.

Blocks: Chat parity.

#### OQ-02: AI Streaming Parser

Status: `OPEN`

Current PWA/web behavior: Web uses `@ai-sdk/react` `useChat()` plus `DefaultChatTransport` against `/api/chat`, and the browser consumes `streamText().toUIMessageStreamResponse()` automatically.

React Native contention: React Native cannot rely on DOM-oriented AI elements. It must either parse the Vercel AI SDK UI message stream itself or use a native-specific endpoint.

Evidence:

- [AI SDK stream protocol docs define the UI message/data stream as Server-Sent Events with `text-start`, `text-delta`, `text-end`, `finish`, `abort`, and `[DONE]` parts](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol).
- [MDN documents `ReadableStream.getReader()` as the standard API for consuming streamed chunks](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/getReader).
- [AI SDK docs also document a text stream protocol for plain text deltas if a native adapter endpoint becomes necessary](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol#text-stream-protocol).

Options:

- A. Implement `mobile/lib/chat/ui-message-stream.ts` that consumes [`fetch().body.getReader()`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/getReader), decodes [AI SDK event-stream lines](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol), and mutates native chat state.
- B. Add `/api/chat/native` returning [AI SDK text stream protocol](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol#text-stream-protocol) deltas.

Recommended default: A first. B is allowed only if a physical iOS development build proves the current stream cannot be consumed reliably.

Blocks: Chat parity.

#### OQ-03: About And Legal Surfaces

Status: `OPEN`

Current PWA/web behavior: The PWA displays `/about` and `/legal` as in-app web routes inside the wrapper.

React Native contention: Opening the public web pages in the system browser is simpler but no longer feels like the same in-app surface. Rebuilding the content natively duplicates static copy but preserves app parity.

Evidence:

- [Expo Router creates native, file-based screens from the `app` directory and makes screens deep-linkable](https://docs.expo.dev/router/introduction/).
- [`expo-web-browser` `openBrowserAsync` opens external web pages in SFSafariViewController on iOS and Chrome Custom Tabs on Android](https://docs.expo.dev/versions/latest/sdk/webbrowser/#webbrowseropenbrowserasyncurl-browserparams).

Options:

- A. Implement native About and Legal screens with [Expo Router](https://docs.expo.dev/router/introduction/) and the same card/accordion/list content, and open only external policy/article links in the browser.
- B. Keep browser handoff to `/about` and `/legal` through [`expo-web-browser`](https://docs.expo.dev/versions/latest/sdk/webbrowser/#webbrowseropenbrowserasyncurl-browserparams).

Recommended default: A for stricter parity. B only if maintaining one source of legal/about copy is preferred over in-app parity.

Blocks: More tab, store-review parity.

#### OQ-04: iOS Universal-Link Path Scope

Status: `OPEN`

Current PWA/web behavior: Current website has app-owned routes `/`, `/map`, `/chat`, `/contribute`, `/about`, `/legal`, and `/places/{id}`. The PWA wrapper simply loads the URL in the web shell.

React Native contention: Expo universal links require `associatedDomains` plus `apple-app-site-association`. The AASA path scope must be explicit.

Evidence:

- [Expo iOS Universal Links docs require an `apple-app-site-association` file in `/.well-known`, `ios.associatedDomains`, and HTTPS hosting](https://docs.expo.dev/linking/ios-universal-links/).
- [Apple's `applinks` documentation defines the `details`, `appIDs`, and `components` structure for universal link path matching](https://developer.apple.com/documentation/bundleresources/applinks).
- [Expo Router docs state every screen is automatically deep-linkable, which supports opening app-owned routes directly once Associated Domains are configured](https://docs.expo.dev/router/introduction/).

Options:

- A. Open every app-owned route in the native app using [Expo Router deep links](https://docs.expo.dev/router/introduction/) and [iOS Universal Links](https://docs.expo.dev/linking/ios-universal-links/).
- B. Open only `/places/*` in native by scoping AASA [`components`](https://developer.apple.com/documentation/bundleresources/applinks) to place paths and leave other links in Safari.

Recommended default: A. Use all app-owned routes and exclude external Airtable, Termly, social, and map URLs.

Blocks: Deep links and App Store replacement.

#### OQ-05: Android In-Place Replacement Signing

Status: `OPEN`

Current PWA/web behavior: Current Android app is a PWABuilder TWA with package `com.charlottethirdplaces.app`; `web/public/.well-known/assetlinks.json` contains the current fingerprints.

React Native contention: The Expo AAB must update the existing Play Store app, and Android App Links must keep verifying after Play signs the replacement build.

Evidence:

- [Expo Android App Links docs require `android.intentFilters` with `autoVerify: true` plus a hosted `assetlinks.json`](https://docs.expo.dev/linking/android-app-links/).
- [The same Expo docs explain that SHA-256 fingerprints can come from EAS credentials or the Google Play Console and that `assetlinks.json` can include multiple fingerprints](https://docs.expo.dev/linking/android-app-links/#create-assetlinksjson-file).
- [Google Play App Signing docs explain the difference between upload keys and the Google-held app signing key, and note that API providers/app links need the app signing key fingerprint](https://support.google.com/googleplay/android-developer/answer/9842756).
- [Expo Submit Android docs describe submitting an Android production build to the Google Play Store through EAS Submit](https://docs.expo.dev/submit/android/).

Options:

- A. Preserve the existing Play Console app and [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756) certificate, configure [EAS Submit for Android](https://docs.expo.dev/submit/android/) for the same package, and update [`assetlinks.json`](https://docs.expo.dev/linking/android-app-links/#create-assetlinksjson-file) only if Play exposes a changed app-signing fingerprint.
- B. Create a new [Google Play Console app](https://play.google.com/console).

Recommended default: A. B is rejected because this is an in-place migration.

Blocks: Android release and app links.

#### OQ-06: Map Marker PNG Generation Tool

Status: `OPEN`

Current PWA/web behavior: Web markers are DOM/SVG/lucide composition inside Google Maps `AdvancedMarker`.

React Native contention: Native map markers must use image assets for performance; a script must rasterize one marker per `iconKey` plus featured. The generation dependency is not listed yet.

Evidence:

- [react-native-maps documents image-based markers through the `Marker` `image` prop and warns that custom marker views have performance implications](https://github.com/react-native-maps/react-native-maps#rendering-a-marker-with-a-custom-image).
- [Sharp supports SVG input and PNG output and is a high-performance Node image-processing library](https://sharp.pixelplumbing.com/).
- [react-native-maps compatibility docs state Fabric/New Architecture support starts at `1.26.1+` with React Native `>= 0.81.1`](https://github.com/react-native-maps/react-native-maps#compatibility).

Options:

- A. Add [`sharp`](https://sharp.pixelplumbing.com/) as a dev dependency and generate PNGs from SVG templates.
- B. Use [`node-canvas`](https://github.com/Automattic/node-canvas).
- C. Hand-maintain PNG assets for [`react-native-maps` image markers](https://github.com/react-native-maps/react-native-maps#rendering-a-marker-with-a-custom-image).

Recommended default: A. It is script-only, deterministic, and cross-platform enough for CI.

Blocks: Native map implementation.

#### OQ-07: NativeWind v5 Exact Install Surface

Status: `OPEN`

Current PWA/web behavior: The plan chooses NativeWind v5 plus `react-native-css`; current `mobile/src/global.css` is only template font variables.

React Native contention: NativeWind v5 is still presented by its docs as the v5/pre-release path, and React Native Reusables is not a single runtime package.

Evidence:

- [NativeWind v5 installation docs identify v5 as a pre-release and list the Expo install/setup steps for `nativewind`, `react-native-css`, Tailwind, PostCSS, Metro, and Lightning CSS override](https://www.nativewind.dev/v5/getting-started/installation).
- [React Native Reusables docs state it is not a component library, but a way to build your component library](https://reactnativereusables.com/docs).
- [React Native Reusables CLI docs provide `add` and `doctor` commands for copying component source files into the app](https://reactnativereusables.com/docs/cli).

Options:

- A. Pin the local skill's v5 packages and use the [React Native Reusables CLI](https://reactnativereusables.com/docs/cli) to add copied components.
- B. Fall back to [NativeWind v4 docs](https://www.nativewind.dev/docs).
- C. Hand-write all styling with React Native [`style` objects](https://reactnative.dev/docs/style).

Recommended default: A. B and C are rejected unless v5 setup fails in a minimal proof.

Blocks: Styling foundation.

#### OQ-08: Fixture Mode Runtime Implementation

Status: `OPEN`

Current PWA/web behavior: The plan says fixture mode uses bundled JSON and MSW handlers.

React Native contention: MSW is appropriate in Jest/integration tests, but native EAS/Maestro builds should not depend on a service-worker-style network interceptor.

Evidence:

- [MSW docs describe browser interception through the Service Worker API and Node.js interception for tests](https://mswjs.io/docs/).
- [EAS Workflows Maestro docs show E2E tests run against a built app artifact using Maestro flow files](https://docs.expo.dev/eas/workflows/examples/e2e-tests/).
- [Expo SQLite `kv-store` docs show an AsyncStorage-compatible persistent store for runtime cache data, separate from test request mocking](https://docs.expo.dev/versions/latest/sdk/sqlite/#key-value-storage).

Options:

- A. Runtime fixture mode branches inside `mobile/lib/api/client.ts` and returns bundled fixture JSON/responses; [MSW](https://mswjs.io/docs/) is used only in unit/integration tests.
- B. Attempt to run [MSW](https://mswjs.io/docs/) in the native app runtime.

Recommended default: A.

Blocks: Offline and Maestro testing.

#### OQ-09: npm Workspace Lockfile Strategy

Status: `OPEN`

Current PWA/web behavior: The repo currently has `web/package-lock.json` and `mobile/package-lock.json` but no repo-root `package.json`.

React Native contention: npm workspaces normally use one root `package-lock.json`; keeping nested lockfiles can make dependency resolution non-deterministic for shared packages.

Evidence:

- [npm workspaces docs define workspaces as nested packages managed from a single top-level root package and show `npm install` creating a root `package-lock.json`](https://docs.npmjs.com/cli/v10/using-npm/workspaces).
- [npm package-lock docs state `package-lock.json` describes a single dependency tree so teammates, deployments, and CI install the same dependencies](https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json).

Options:

- A. Root [`package-lock.json`](https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json) becomes the source of truth after workspace setup; nested lockfiles are removed in the workspace migration commit.
- B. Keep per-workspace lockfiles and never run root install, which conflicts with the [npm workspace root-install model](https://docs.npmjs.com/cli/v10/using-npm/workspaces).

Recommended default: A. It matches npm workspace behavior and keeps shared package linking deterministic.

Blocks: Workspace setup.

### Resolved Porting Contentions

| Area | Current PWA/Web Behavior | React Native Decision |
| --- | --- | --- |
| Primary screens | WKWebView/TWA loads Next.js pages. | Native app renders Home, Browse, Map, Chat, Place Detail, Photos, Contribute, About/Legal access, and More with React Native views. No `WebView`, `use dom`, or Expo DOM Components for primary surfaces. |
| Shared logic | Web imports local `web/lib/*` and `web/contexts/*`. | Platform-free logic moves to `packages/core`; React-only state moves to `packages/shared-react`; web and mobile import packages by workspace name. |
| Data source | Web reads Airtable or local CSV on the server through `web/lib/data-services.ts`. | Mobile calls versioned HTTP APIs only. It never imports Airtable, CSV, filesystem, Cosmos, Azure OpenAI, or server secrets. |
| Catalog cache | PWA depends on Next static output, Serwist, browser cache, and `/api/revalidate`. | Mobile uses TanStack Query with `expo-sqlite/kv-store` as the AsyncStorage-compatible persisted cache. No relational SQLite tables or Drizzle in the parity migration. |
| Photos offline | Serwist explicitly uses `NetworkOnly` for Azure photo blobs; browser HTTP cache is the only photo cache. | Native uses `expo-image` and OS HTTP cache only. No custom persistent photo download store in parity. Failed images are removed from visible rails/slides. |
| Forms | Contribute cards open Airtable embed URLs in the mobile browser context. | Native Contribute renders three native cards and opens the same Airtable URLs with browser handoff. No embedded form WebView and no native Airtable form rewrite. |
| External links | `ResponsiveLink` opens `_self` on mobile and `_blank` on desktop; iOS WKWebView has custom navigation policy for maps/social/external URLs. | Native uses a centralized external-link adapter: app-owned routes navigate through Expo Router; map/social/http(s) links open through `Linking` or `expo-web-browser`; mail/tel use `Linking.openURL`. |
| Share | Web uses `navigator.share` with clipboard fallback. | Native uses the platform share sheet first and clipboard fallback on failure. |
| Find Me | Browser geolocation requested only from the Find Me button. | Native requests foreground location only from the Find Me action, uses `Location.getLastKnownPositionAsync({ maxAge: 300000 })` first, then `Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })`. |
| Map renderer | Web uses `@vis.gl/react-google-maps` and Google Maps vector tiles. | Native uses `react-native-maps`: Apple Maps on iOS, Google Maps on Android. `expo-maps` is rejected for parity. |
| Marker rendering | Web renders custom DOM marker views. | Native renders generated PNG marker assets through `Marker` image props. No live React marker view tree in parity. |
| Dynamic hours tags | Web injects `Open Late` and `Open Early` client-side with Charlotte timezone. | Same logic moves unchanged to `packages/core` and runs over cached/native catalog data. |
| Hours Type | Web `QuickFacts` treats exact `hoursType === "Event Based"` specially only when `hours` is empty. | Native QuickFacts must implement the same condition. `Regular`, empty, and undefined values do not change rendering. |
| App promo UI | Web hides app-store banners inside the native wrapper using `useIsNativeApp` and CSS. | Native app never renders Get the App banners or native-app-detection UI. |
| Native starter | `mobile/` currently shows the Expo starter (`Welcome to Expo`) under `mobile/src/app`. | Starter route tree is deleted and replaced by the required `mobile/app` Expo Router tree. |

## Product Decision

Charlotte Third Places will have four explicit workspace areas:

1. `packages/core`: pure TypeScript domain, data, API contract, and business logic shared by web and mobile.
2. `packages/shared-react`: React-only, renderer-agnostic state and behavior shared by React DOM and React Native.
3. `web`: the existing Next.js web app for public web, SEO, shareable pages, legal pages, admin/web workflows, and server-side integrations. The former nested `charlotte-third-places` app folder has already been renamed to `web`.
4. `mobile`: the Expo/React Native app for iOS and Android app-store experiences.

The key split is shared logic, platform-specific rendering. The plan does not share DOM UI with React Native and does not render website pages inside the mobile app.

The repository uses npm workspaces after the web folder rename. `web`, `mobile`, `packages/core`, and `packages/shared-react` remain separate npm packages. The repo-root `package.json` exists only to coordinate workspace linking and shared install behavior.

## Non-Negotiable Constraints

- The React Native app ports the current live app first. The parity migration does not add user accounts, authentication, saved lists, billing, credits, subscriptions, push notifications, account deletion, local relational SQLite tables, and Drizzle.
- The mobile app renders primary interactive surfaces with native React Native views. It does not use `WebView`, `use dom`, Expo DOM Components, and embedded Next.js pages for Home, Random, Browse, Map, Chat, Places, Photos, Contribute, About, Legal, Settings, Payments, and Account.
- The mobile app does not import Airtable SDK, Cosmos DB SDK, Azure OpenAI SDK, filesystem modules, Next.js server code, server secrets, and direct database clients.
- The mobile app consumes typed HTTP APIs served by the Next.js app. A future backend service must preserve those same HTTP contracts.
- Shared business logic moves to `packages/core`. Shared React state moves to `packages/shared-react`. DOM rendering stays in `web`. Native rendering stays in `mobile`.
- All automated mobile tests use deterministic fixtures. API-bound automated tests use fixture-backed API responses. Automated tests do not depend on live Airtable production data.

## Bundle Identity And Store Transition

Charlotte Third Places is being entirely replaced with the React Native app in the App Store. The current PWA version uses `com.charlottethirdplaces.app` and is live in the App Store.

The Expo app uses the same iOS bundle identifier:

```text
com.charlottethirdplaces.app
```

Development builds use this PowerShell environment variable after EAS reports a capability syncing failure against the existing Apple App ID entitlements:

```powershell
$env:EXPO_NO_CAPABILITY_SYNC=1
npx eas-cli@latest build --profile development --platform ios
```

This disables automatic EAS capability syncing for the build command. It does not remove capabilities from the Apple Developer account, and it does not change the App Store Connect app record.

Production replacement must keep the existing App Store Connect app record. Do not delete, remove, and archive the existing App Store Connect app record to "free" the bundle ID. Apple locks a bundle ID to an app record after a build has been uploaded, and removing the app record can make that bundle ID unavailable for reuse.

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

12. Treat any production build error that says the provisioning profile does not support Associated Domains and any production build error that says the provisioning profile does not include `com.apple.developer.associated-domains` as a failed capability procedure. Correct the App ID capability list, remove the EAS-stored App Store provisioning profile again, then rerun the production build. Do not upload a binary from a build that reports entitlement/provisioning errors.

## Completed Web App Folder Rename

The nested Next.js application folder has been renamed from `charlotte-third-places` to `web`.

The Vercel project Root Directory has also been updated to `web`. Keep that setting unchanged.

Previous local structure:

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

Completed rename command:

```powershell
Rename-Item -Path .\charlotte-third-places -NewName web
```

Repository references that pointed at the old nested app folder were updated as part of the rename cleanup. Verified reference groups include:

- GitHub Actions paths in `.github/workflows/unit-tests.yml` and `.github/workflows/e2e-tests.yml`, including `cache-dependency-path`, coverage artifacts, Playwright report artifacts, and test result artifacts.
- `.github/copilot-instructions.md`, which identifies `web/` as the main Next.js application directory.
- `.github/instructions/theme-color-sync.instructions.md`, whose `applyTo` pattern points at `web/components/ThemeColorSync.tsx`, `web/styles/globals.css`, `web/app/manifest.webmanifest`, and `web/app/layout.tsx`.
- `.github/agents/place-types-specialist.md`, whose target files point at `web/lib/place-type-config.ts` and `web/components/Icons.tsx`.
- Root `README.md` media paths that point at `web/media/...`.
- Documentation paths in `docs/testing.md`, `docs/ai.md`, `docs/user-lists-plan.md`, and this document.
- Any scripts, task definitions, and command examples that run Next.js commands from the app folder now point at `web`.

The Next.js package `name` field stays `charlotte-third-places`. The rename changes the filesystem app folder name, not the product name, npm package identity, Expo slug, bundle identifier, and public domain.

Vercel project root directory setting:

```text
https://vercel.com/segun-akinyemis-projects/charlotte-third-places/settings/build-and-deployment
```

Current Vercel Root Directory:

```text
web
```

Do not change this back to the old nested folder name.

## npm Workspace Setup

Create a repo-root `package.json` at `c:\GitHub\charlotte-third-places\package.json`. This file is private workspace coordination only. It does not replace `web/package.json` and does not replace `mobile/package.json`.

Required root `package.json` contents:

```json
{
  "private": true,
  "workspaces": [
    "web",
    "mobile",
    "packages/*"
  ]
}
```

Workspace package responsibilities:

- `web/package.json`: owns Next.js, web scripts, web dependencies, and web deployment behavior.
- `mobile/package.json`: owns Expo, native scripts, native dependencies, and EAS build behavior.
- `packages/core/package.json`: owns pure TypeScript shared domain code.
- `packages/shared-react/package.json`: owns React-only shared state.
- root `package.json`: owns workspace membership only. Do not add app-specific dependencies to the root package.

Package names:

- `packages/core/package.json` name: `@charlotte-third-places/core`.
- `packages/shared-react/package.json` name: `@charlotte-third-places/shared-react`.

`web` and `mobile` import shared code through package names, not relative paths into `../packages`.

```ts
import { Place, filterPlaces } from "@charlotte-third-places/core";
import { FilterProvider } from "@charlotte-third-places/shared-react";
```

Do not use `npm link`. Do not copy shared source into `web` or `mobile`. npm workspaces provide the local symlinks.

## Current Codebase Facts

These facts were verified from the current repository and must drive the implementation plan.

### Existing Web Routes

- `web/app/page.tsx`: current Home route. It fetches places server-side and renders `components/HomePageClient.tsx`.
- `web/app/map/page.tsx`: current Map route. It fetches places server-side, wraps the page in `contexts/FilterContext.tsx`, and renders `components/PlaceMap.tsx`.
- `web/app/chat/page.tsx`: current Chat route. It renders `components/ChatContent.tsx` in page mode.
- `web/app/places/[id]/page.tsx`: current Place Detail route. It resolves a place by Airtable record ID and renders `components/PlacePageClient.tsx`.
- `web/app/contribute/page.tsx`: current Contribute route. It renders three native web cards that open Airtable form URLs.
- `web/app/about/page.tsx`: current About route.
- `web/app/legal/page.tsx`: current Legal route.
- `web/app/~offline/page.tsx`: current web PWA offline fallback route.

### Existing API Routes

- `web/app/api/places/route.ts`: current compatibility endpoint. It returns raw `Place[]` from `getPlaces()`. It declares `export const dynamic = "force-static"`. Status 200 on success, 500 on error.
- `web/app/api/places/[id]/route.ts`: current compatibility endpoint. It returns one raw `Place` from `getPlaceById(id)`. Missing records return a JSON 404. It declares `export const dynamic = "force-static"`, `export const dynamicParams = true`, and a `generateStaticParams()` that pre-generates routes for all known `place.recordId` values. Status 200 on success, 404 when not found, 500 on error.
- `web/app/api/chat/route.ts`: current streaming AI chat endpoint used by `components/ChatContent.tsx`. It declares `export const maxDuration = 30` and runs on the default Node.js runtime. See the AI Chat Contract section for the full request/response and RAG behavior.
- `web/app/api/revalidate/route.ts`: current ISR/cache invalidation endpoint for the web app. Static `/api/places` output is rebuilt through this route, not through time-based revalidation.

These endpoints are not speculative. They are the current compatibility surface.

### Existing Data Source

`web/lib/data-services.ts` currently owns data loading:

- Development data source: `web/local-data/Charlotte Third Places-Production.csv`.
- Production data source: Airtable base `apptV6h58vA4jhWFg`, table `Charlotte Third Places`, view `Production`.
- Environment override: `FORCE_PRODUCTION_DATA=true` forces Airtable data while local development normally reads CSV.
- Public server functions: `getPlaces(): Promise<Place[]>` and `getPlaceById(id: string): Promise<Place | undefined>`.
- Pure helper currently mixed into the server file and already exported: `parsePlacePhotoManifests(value: unknown): PlacePhoto[]`.
- Private record mapper currently mixed into the server file and not exported: `mapRecordToPlace`. The CSV reader `getPlacesFromCSV` is also private and not exported.
- Hours fields currently mapped by `mapRecordToPlace`: `hours: getField("Hours")` and `hoursType: getField("Hours Type")`.
- Airtable `Hours` values are parsed as a JSON array when present. CSV `Hours` values are parsed through the same JSON-array path. Missing or malformed `Hours` values become `[]`.
- Current local CSV data uses `Hours Type = Regular` for all rows. The UI also supports `Hours Type = Event Based` as an explicit special case when no concrete weekly hours are available.
- Server-only imports in this file: `fs`, `path`, `airtable`, `csv-parser`, `strip-bom-stream`, and `parse`/`parseISO`/`isValid` from `date-fns`.
- Environment variables read in this file: `AIRTABLE_PERSONAL_ACCESS_TOKEN`, `FORCE_PRODUCTION_DATA` (checked `=== 'true'`), and `NODE_ENV` (checked `=== 'development'`).

Server-only parts of this file stay server-only. Only `parsePlacePhotoManifests` is pure and movable. `mapRecordToPlace` parsing logic that is pure (string/date normalization) is re-created in `packages/core` as the place normalizer; the Airtable/CSV I/O stays in `web`.

## Resolved Mobile Implementation Decisions

These decisions were made after auditing the current codebase. The implementing agent must follow them and must not reopen them without a new explicit product decision.

1. npm workspaces are used. After the nested Next.js folder is renamed to `web`, create a private repo-root `package.json` at `c:\GitHub\charlotte-third-places\package.json` with workspaces for `web`, `mobile`, and `packages/*`. This root file does not replace `web/package.json` or `mobile/package.json`.
2. Mobile routes live at `mobile/app`, not `mobile/src/app`. The current Expo starter routes in `mobile/src/app` are removed during the route-tree replacement.
3. Mobile UI uses NativeWind v5 and React Native Reusables-derived copied components for parity surfaces. React Native Reusables is added through its CLI component copy workflow, not treated as a single runtime component package. The current Expo template `@expo/ui` component pattern is not used for the parity app UI.
4. Production mobile API origin is `https://www.charlottethirdplaces.com`.
5. Develop mobile API origin is `https://charlotte-third-places-git-develop-segun-akinyemis-projects.vercel.app`.
6. Mobile Chat calls the existing web-hosted `/api/chat` endpoint. The mobile app does not create a separate chat backend for the parity migration.
7. Shared `Place` app semantics are preserved: string flag fields stay strings, `createdDate` and `lastModifiedDate` are `Date` objects in app code, and HTTP transports dates as ISO strings that are parsed by core validators/normalizers.
8. Mobile catalog cache behavior matches the current web freshness model: fetch fresh on app launch when online, keep the last successful catalog for offline launch, and never clear visible cached data because a refetch fails.
9. Android Google Maps SDK key is provided through an EAS secret named `GOOGLE_MAPS_API_KEY`, read by `mobile/app.config.ts`, and injected into Android map config. iOS uses Apple Maps through `react-native-maps` and does not require a Google Maps key.
10. Associated Domains verification is an implementation task. The implementation must verify `apple-app-site-association` for both `https://www.charlottethirdplaces.com/.well-known/apple-app-site-association` and `https://charlottethirdplaces.com/.well-known/apple-app-site-association`.
11. Native UI icons use Expo-managed React Native Vector Icons through `@expo/vector-icons`. Native map markers use generated PNG assets, not live React icon components.
12. Native map marker PNG assets are generated from core place type metadata by a script. Assets are produced at 1x, 2x, and 3x densities under `mobile/assets/map-markers/`.
13. Fixture mode is required. `EXPO_PUBLIC_MOBILE_DATA_MODE=fixture` makes the built app read bundled fixture catalog data and fixture chat responses; Maestro does not depend on network or live Airtable data. The exact runtime/test mocking split is governed by OQ-08, with runtime fixture branching in `mobile/lib/api/client.ts` as the recommended default and MSW limited to unit/integration tests.
14. Native external links use browser handoff through Expo/browser/linking APIs. Native sharing uses the native share sheet first and falls back to clipboard on failure.
15. Native photo galleries silently remove failed images from rails and slides. If all photos fail, the native surface shows a single empty state.
16. Mobile fonts are bundled local assets loaded with `expo-font`. The source archives currently sit in `fonts/`: `fonts/Inter-4.1.zip`, `fonts/IBM_Plex_Sans.zip`, and `fonts/IBM_Plex_Sans,JetBrains_Mono.zip`.

## Implementation Verification Items

The following items are not product decisions. They are required verification steps during implementation.

- Confirm real `Place.photos[].display` and `Place.photos[].thumbnail` URLs load in a physical iOS build through `expo-image`. The current website allows remote images from `thirdplacesdata.blob.core.windows.net`, and service-worker photo requests are network-only.
- Confirm both associated-domain hosts return valid Apple AASA JSON with the App ID for `com.charlottethirdplaces.app` before the Real iOS Gate passes.
- Confirm the EAS secret `GOOGLE_MAPS_API_KEY` is present before Android map validation.
- Confirm the generated marker PNG set contains one marker for every core `iconKey` plus the featured marker.
- Confirm bundled fixture mode works with airplane mode enabled before running Maestro offline flows.

## Verified Source Inventory

Every symbol, constant, and behavior below was read from the current `charlotte-third-places` source. The implementing agent treats these as exact. It must not rename, round, or reinterpret them.

### `lib/types.ts`

- `PlacePhoto` = `{ display: string; thumbnail: string }`.
- `Place` has exactly these fields: `recordId`, `name`, `operational`, `type: string[]`, `size`, `tags: string[]`, `neighborhood`, `address`, `purchaseRequired`, `parking: string[]`, `freeWiFi`, `hasCinnamonRolls`, `hasReviews`, `featured: boolean`, `description`, `website`, `tiktok`, `instagram`, `youtube`, `facebook`, `twitter`, `linkedIn`, `googleMapsPlaceId`, `googleMapsProfileURL`, `appleMapsProfileURL`, `photos: PlacePhoto[]`, `comments`, `hours: string[]`, `hoursType?: string`, `latitude: number`, `longitude: number`, `createdDate: Date`, `lastModifiedDate: Date`.
- `PlaceDocument` and `ChunkDocument` are Cosmos-shaped types with optional `embedding?: number[]` and `similarityScore?: number`. They are server/AI types. They are moved to `packages/core` as types only; mobile never instantiates them.
- `SortField` enum: `Name`, `DateAdded`, `LastModified`. `SortDirection` enum: `Ascending`, `Descending`. `SortOption` = `{ field: SortField; direction: SortDirection }`. `DEFAULT_SORT_OPTION` = `{ field: SortField.DateAdded, direction: SortDirection.Descending }`.

### `lib/filters.ts`

- `FILTER_SENTINEL = 'all'`.
- `FILTER_DEFS` has exactly 9 entries in this order: `name`, `neighborhood`, `type`, `tags`, `parking`, `freeWiFi`, `purchaseRequired`, `size`, `hasCinnamonRolls`. `neighborhood` has `fixedMatchMode: 'or'`. `type` has `defaultMatchMode: 'or'`. `tags` defaults to AND. `parking` allowedValues `['Free','Paid']`. `freeWiFi` allowedValues `['Yes','No']`. `size` allowedValues `['Small','Medium','Large']`. `hasCinnamonRolls` allowedValues `['Yes','No','Sometimes']`.
- `SORT_DEFS` has exactly these keys: `name-asc`, `name-desc`, `createdDate-asc`, `createdDate-desc`, `lastModifiedDate-asc`, `lastModifiedDate-desc`. `SORT_USES_MOBILE_PICKER = true`.
- Functions to move unchanged: `placeMatchesFilters(place: Place, filters: FilterConfig): boolean`, `filterPlaces(places: Place[], filters: FilterConfig): Place[]`, `sortPlaces(places: Place[], sortOption: SortOption): Place[]`.
- Also export from this module and move: `FilterValueType`, `MatchMode`, `FilterOption`, `FilterDefinition`, `FilterKey`, `FilterConfig`, `DEFAULT_FILTER_CONFIG`, `FILTER_DEFINITION_MAP`, `MOBILE_PICKER_FIELDS`, `MOBILE_CHIP_FIELDS`, `DESKTOP_PICKER_FIELDS`, `MULTI_SELECT_FIELDS`, `SortDefinition`.

### `lib/hours.ts`

- Constants: `CHARLOTTE_TIMEZONE = "America/New_York"`, `OPEN_LATE_THRESHOLD_HOUR = 22`, `OPEN_EARLY_THRESHOLD_HOUR = 7`, `OPENING_OR_CLOSING_SOON_MINUTES = 60`, and `DAYS` Sunday-first.
- It uses native `Intl.DateTimeFormat` only. It does not import `date-fns`. It has no DOM usage.
- Dynamic tags: `injectDynamicTags` adds `Open Late` when closing hour `>= 22` and `Open Early` when opening hour `<= 7`, computed once per batch with a single `getCharlotteTimeNow()` snapshot.
- Hours status union: `{ state: "open"; closesAt }`, `{ state: "closing-soon"; closesAt }`, `{ state: "opening-soon"; opensAt }`, `{ state: "closed"; opensAt: string | null }`, `{ state: "closed-today"; opensAt: string | null }`, `{ state: "unknown" }`.
- `getHoursStatus(hours)` creates a fresh Charlotte time snapshot. Batch callers must use one `getCharlotteTimeNow()` snapshot and pass it to the `*At` helpers.
- `isPlaceOpenNow(hours, time)` returns `true` only for `open` and `closing-soon`. `opening-soon`, `closed`, `closed-today`, and `unknown` are not open.
- Exported helpers include `getCharlotteTimeNow`, `getHoursStatus`, `getHoursStatusAt`, `isPlaceOpenNow`, `isOpenLate`, `isOpenEarly`, `isOpenLateAt`, `isOpenEarlyAt`, `injectDynamicTags`, and the low-level parsers `parseHour24`, `parseTimeToMinutes`, `getClosingHour`, `getOpeningHour`, `getCurrentDayInCharlotte`, `getDayTimeRange`. Move these exports unchanged.

### `lib/fonts.ts`

- Website fonts are loaded through `next/font/google`.
- `fontSans = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans', display: 'swap' })`.
- `fontMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })`.
- `fontCard = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-card', display: 'swap' })`.
- `app/layout.tsx` applies `fontSans.className` on `<html>` and `fontSans.variable` plus `fontCard.variable` on `<body>`.
- `styles/globals.css` defines `@utility card-font { font-family: var(--font-card); }`; `components/PlaceCard.tsx` uses `card-font`, so native place cards use IBM Plex Sans.
- No `.ttf`, `.otf`, `.woff`, or `.woff2` font files are committed under current web or mobile assets. Mobile font files come from the zip archives in `fonts/` listed in the Mobile Font Assets section.

### `lib/utils.ts`

- Exports `cn`, `normalizeTextForSearch`, `shuffleArray`, `shuffleArrayNoAdjacentDuplicates`. Only `cn` depends on Tailwind merging; the other three move to `packages/core`. No DOM usage.

### `lib/parsing.ts`

- Exports `parseAirtableMarkdown(markdown: string): ParsedMarkdown` and `parseAirtableMarkdown(markdown: string, options: { plain: true }): { plainText: string }`. No DOM dependency. `PlaceCard` uses the `{ plain: true }` form for description previews. Node types: `paragraph`, `text`, `bold`, `italic`, `strikethrough`, `link`, `linebreak`. This module moves to `packages/core` so native description rendering uses the same AST.

### `lib/place-type-config.ts`

- `PlaceTypeConfig` = `{ icon: React.ComponentType<any>; emoji: string; mapColor: string }`. Because `icon` is a React component, this file cannot move to core unchanged. Core owns `{ type, iconKey, emoji, mapColor }` metadata; the React `icon` mapping stays platform-side.
- `placeTypeConfig` defines a fixed set of place types, each with a unique hex `mapColor`. Fallbacks: `FALLBACK_ICON = Icons.queen`, `FALLBACK_EMOJI = "\uD83E\uDD37\uD83C\uDFFE"`, `FALLBACK_COLOR = "#3B82F6"`.
- Exported helpers: `getPlaceTypeIcon`, `getPlaceTypeEmoji`, `getPlaceTypeColor`, `getAllMapColors`. The color helpers (minus the React icon) move to core; the icon helper stays platform-side.
- Map color rule: the map uses the configured `mapColor`; when a type resolves to the default `#3B82F6`, the web map derives a stable hash color from a 19-entry palette. The native map must reproduce this exact featured/default/hash behavior.

### `contexts/FilterContext.tsx`

- Exports 7 contexts and 7 hooks: `FilterDataContext`/`useFilterData`, `FiltersContext`/`useFilters`, `QuickSearchContext`/`useQuickSearch`, `SortContext`/`useSort`, `OpenNowContext`/`useOpenNow`, `PlacesContext`/`usePlaces`, `FilterActionsContext`/`useFilterActions`.
- Internal `FilterState` = `{ filters: FilterConfig; quickFilterText: string; sortOption: SortOption; openNow: boolean }`. Reducer actions: `SET_FILTERS`, `SET_QUICK_SEARCH`, `SET_SORT`, `SET_OPEN_NOW`, `RESET_ALL`.
- No DOM, `window`, or Next APIs. It moves to `packages/shared-react` unchanged.
- `openNowCount` recomputes on `[places, filters, quickFilterText]` and counts places passing search + filters that are open now, using one `getCharlotteTimeNow()` snapshot. `getDistinctValues` is backed by a `distinctValuesCache` keyed by `FilterKey`, rebuilt only when `places` changes, applying `accessor`, allowed-value allowlists, and `predefinedOrder`. The native implementation must preserve this caching to avoid the INP regression noted in the source comments.

### `contexts/ModalContext.tsx`

- Surfaces: `place` (`hideAskAI?`), `photos`, `chat` (`initialMessage?`). Actions: `pushPlace(place, { hideAskAI? })`, `pushPhotos(place)`, `pushChat(place, initialMessage?)`, `pop()`, `popTo(id)`, `closeAll()`.
- Web specifics that stay in `web`: `ChatModal` is `next/dynamic` with `ssr: false` and a spinner; `PlaceModal` and `PhotosModal` are static imports; `preloadModalChunks()` uses `requestIdleCallback`. Navigation uses `window.history.pushState`, `back()`, `go(-n)`, and a `popstate` listener that restores `surfaceStack` from history state. Surfaces render at `zIndex = 50 + index * 10`. Ask AI shows only when `!hideAskAI` and no chat surface is below.
- The shared part that moves to `packages/shared-react` is the surface types, the stack reducer, and the action contract. The native provider re-implements stack navigation with Expo Router/native primitives, not `window.history`.

### `components/PlaceHighlights.tsx`

- 8 highlight definitions with exact tags and priorities: `featured` (priority 1, badge + ribbon + gradient), `comingSoon` (priority 2, `operational === 'Coming Soon'`, badge + ribbon + gradient), `christian` (priority 3, tag `Christian`, badge), and badge-only `habesha` (`Habesha`), `blackOwned` (`Black Owned`), `french` (`French`), `veteranOwned` (`Veteran Owned`), `cinnamonRoll` (`hasCinnamonRolls` in `['Yes','TRUE','true']`).
- Tag matching is case-insensitive trimmed against `place.tags`. Badge order: unprioritized first in definition order, then prioritized appended sorted descending so priority 1 is rightmost. Ribbon/gradient provider is the matched definition with the lowest numeric priority. Core returns these as descriptors; web/native map descriptors to styles and icons.

### `components/PlaceCard.tsx`

- Description preview uses `parseAirtableMarkdown(place.description, { plain: true })`. Type overflow uses a character-budget heuristic, not DOM measurement: `MAX_VISIBLE_WIDTH_CHARS = 35`, `MIN_TYPES = 2`, `MORE_INDICATOR_CHARS = 8`. The native card reproduces this exact `+N more` math.
- Buttons: Chat shows when not Coming Soon; Photos shows only when `place.photos.length > 0`; Info always shows. Web icons used: `Icons.chat`, `Icons.photoGallery`, `Icons.infoCircle`. Card is `React.memo` with a field-list comparator (`recordId, name, description, neighborhood, size, freeWiFi, purchaseRequired, featured, hasCinnamonRolls, hasReviews, operational, type, tags, photos, parking`).

### `components/PlaceMap.tsx`

- Web map constants the native map must mirror: default center `{ lat: 35.23075539296459, lng: -80.83165532446358 }`, default zoom `11`, `SHOW_LABELS_ZOOM = 12`, `MAX_LABELS_SHOWN = 30`, featured marker color `#f59e0b`, Find Me success zoom `14`, geolocation options `{ enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }`.
- Fallback marker palette has exactly these 19 colors, in order: `#FB923C`, `#14B8A6`, `#6366F1`, `#EC4899`, `#84CC16`, `#F59E0B`, `#D946EF`, `#F43F5E`, `#06B6D4`, `#8B5CF6`, `#10B981`, `#FBBF24`, `#DC2626`, `#22C55E`, `#3B82F6`, `#F472B6`, `#A3E635`, `#2DD4BF`, `#E879F9`. The hash algorithm initializes `hash = 0`, then for each character runs `hash = charCode + ((hash << 5) - hash)`, then uses `Math.abs(hash) % typeColorPalette.length`.
- The web map listens for a `userLocationFound` custom DOM event from a separate mobile Find Me button; that DOM-event bridge is web-only and is not ported. Native Find Me calls `expo-location` directly.

### `components/QuickFacts.tsx`

- `QuickFactsProps` includes `hours?: string[]` and `hoursType?: string`.
- The Hours row renders when `hours.length > 0` or when `hoursType === "Event Based"`.
- When `hours.length === 0` and `hoursType === "Event Based"`, the Hours row value is exactly `Event Based` in muted text.
- When `hours.length === 0` and `hoursType !== "Event Based"`, the Hours row is hidden.
- When `hours.length > 0`, `HoursValue` calls `getHoursStatus(hours)` and renders the real-time status badge plus expandable weekly hours. `hoursType` does not override normal status rendering when hours exist.
- `hoursType` values other than the exact string `Event Based` do not change rendering. `Regular`, empty, and undefined values behave the same when `hours.length === 0`: the Hours row is hidden.
- Expanded weekly hours abbreviate day labels on mobile (`Sun`, `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`) and show full stored lines on desktop.

### Current `mobile` App Facts

- `mobile/package.json` currently uses Expo `~56.0.12`, React `19.2.3`, React Native `0.85.3`, Expo Router `~56.2.11`, `expo-image`, `expo-web-browser`, `expo-symbols`, `@expo/ui`, React Native Reanimated `4.3.1`, and no NativeWind/TanStack Query/react-native-maps/Jest/MSW/Maestro dependencies yet.
- `mobile/app.json` currently uses `scheme: "charlotte-third-places"`, iOS bundle identifier `com.charlottethirdplaces.app`, `userInterfaceStyle: "automatic"`, and no `ios.associatedDomains` entry yet. The implementation must add the associated domains from this plan.
- `mobile/eas.json` currently has `development`, `preview`, and `production` profiles only. Add an `e2e-test` profile for fixture-mode Maestro builds.
- Current Expo starter route files live under `mobile/src/app/_layout.tsx`, `mobile/src/app/index.tsx`, and `mobile/src/app/explore.tsx`. The parity app moves routes to root `mobile/app` and removes the starter `src/app` route tree.

### `components/HomePageClient.tsx`

- Random/feed exclusion list is exactly `["Starbucks", "Panera"]`, applied as a case-insensitive name regex, only to the feed and the Random action, never to the full Browse list.
- Total count heading text is `Explore {places.length} Third Places in Charlotte`, sourced from `usePlaces()`. Mobile instant actions are Random, Map, Chat, Browse. The web Random/Browse buttons scroll to sections; native Random/Browse navigate within the Home tab.

### `components/ResponsivePlaceCards.tsx`

- Desktop renders `InfiniteMovingCards`, a custom CSS-animation marquee (no carousel library) that ignores filters and shows 100 random places with a shuffle action. Mobile renders `CardCarousel` built on the shadcn `components/ui/carousel` (Embla) with options `{ loop: true, align: "center", skipSnaps: false, dragFree: false, startIndex }`, respecting filters/search/sort. The native Home feed reproduces the mobile `CardCarousel` behavior, not the desktop marquee.

### `components/PlaceListWithFilters.tsx` and `components/DataTable.tsx`

- Open Now is pre-filtered in `PlaceListWithFilters` before `DataTable`. `DataTable` applies, in order: quick search (`normalizeTextForSearch(place.name)`), `placeMatchesFilters`, then `sortPlaces`. Coming Soon count is `places.filter(p => p.operational === 'Coming Soon').length` and is always shown.
- The web list virtualizes with `@tanstack/react-virtual` (`useVirtualizer`, `ROW_HEIGHT = 219`, `overscan: 3`) and uses responsive column counts by width (1/2/3/4/5). The native Browse list uses `FlashList` (single column on phones) and is not required to reproduce the desktop multi-column grid.

## AI Chat Contract

The mobile Chat screen must talk to the existing chat endpoint over HTTPS and must not re-implement RAG, embeddings, or Cosmos access on the client.

Verified facts about `app/api/chat/route.ts` and `lib/ai/*`:

- Runtime: default Node.js runtime. `export const maxDuration = 30`. The route aborts near 28 seconds to stay under the limit.
- Request body: `{ messages: Array<{ role: 'user' | 'assistant'; parts?: Array<{ type: 'text'; text: string }> }>, placeId?: string }`. The latest user message is read from `parts[]`.
- Model: `gpt-4.1-mini` via `@ai-sdk/azure` (`createAzure`, deployment-based URLs, API version `2024-05-01-preview`). Embedding model `text-embedding-3-small` (1536 dims).
- Environment variables (server-only, never in the mobile bundle): `FOUNDRY_API_KEY`, `COSMOS_DB_CONNECTION_STRING`.
- System prompt: `SYSTEM_PROMPT` in `lib/ai/prompts.ts`. Context is built by `createContextMessage()`. RAG is orchestrated by `performRAG()` in `lib/ai/rag.ts`, backed by Cosmos vector search in `lib/ai/cosmos.ts`, with neighborhood/tag detection driven by the generated `lib/ai/airtable-generated-data.ts`.
- Response: streamed `UIMessage` output from the Vercel AI SDK `streamText().toUIMessageStreamResponse()`.

Mobile chat requirements:

- The mobile client sends the same `{ messages, placeId? }` body to the production `/api/chat` origin and consumes the streamed response.
- Place-scoped chat sends `placeId` (the Airtable `recordId`). General chat omits `placeId`.
- Internal `/places/{id}` links in AI output are intercepted and open a native place surface with `hideAskAI: true`. The same-place link renders as non-clickable emphasis. A failed place fetch appends an assistant error message and preserves the session.
- The mobile app does not import `@azure/cosmos`, `@ai-sdk/azure`, `lib/ai/*`, or any AI secret. All AI work stays server-side behind `/api/chat`.


## Target Repository Layout

```text
charlotte-third-places/
  package.json
  fonts/
    Inter-4.1.zip
    IBM_Plex_Sans.zip
    IBM_Plex_Sans,JetBrains_Mono.zip
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
          hours.ts
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
      fonts/
      map-markers/
```

`packages/core` and `packages/shared-react` are separate because `packages/core` must not import React. Shared React state belongs in `packages/shared-react`, not core.

## Code Reuse Classification

Every migration task must classify source code using this table before moving and rewriting it.

| Classification | Rule | Examples |
| --- | --- | --- |
| Shared pure core | Runs without React, DOM, Next.js, Expo, native APIs, Tailwind, shadcn, and secrets | `Place`, `SortOption`, filter definitions, filtering predicates, sort logic, hours parsing, text normalization |
| Shared React state | Imports `react` only and has no renderer-specific API | `FilterProvider`, filter reducer, filter hooks, modal surface stack action contract |
| Shared contract with platform adapters | Same behavior, different rendering/runtime implementation | modal stack provider, place type icons, place highlights, share action, external links |
| Web-only | Requires DOM, Next.js, Radix/shadcn DOM primitives, `window`, `document`, CSS media queries, browser history | `DataTable`, `PlaceModal`, `PhotosModal`, web `ModalProvider`, `FilterDrawer`, `FilterSidebar` |
| Native-only | Requires Expo or React Native APIs | Expo Router routes, native tabs/stacks, native map, `expo-image`, native share sheet, native offline storage |

## `packages/core` Requirements

`packages/core` is pure TypeScript. It must not import:

- `react`
- `react-dom`
- `react-native`
- `next`
- `expo`
- Tailwind and shadcn code
- icon components
- `window`, `document`, `navigator`, `localStorage`, IndexedDB, and Service Worker APIs
- SecureStore, SQLite, FileSystem, Location, Share, and native platform APIs
- Airtable SDK
- Cosmos DB SDK
- Azure OpenAI SDK
- `fs`, `path`, `csv-parser`, and `strip-bom-stream`
- server secrets and environment-specific configuration

Move these current concepts into `packages/core`:

- From `web/lib/types.ts`: `PlacePhoto`, `Place`, `PlaceDocument`, `ChunkDocument`, `SortField`, `SortDirection`, `SortOption`, `DEFAULT_SORT_OPTION`.
- From `web/lib/filters.ts`: `FILTER_SENTINEL`, `FilterValueType`, `MatchMode`, `FilterOption`, `FilterDefinition`, `FILTER_DEFS`, `FilterKey`, `FilterConfig`, `DEFAULT_FILTER_CONFIG`, `FILTER_DEFINITION_MAP`, `MOBILE_PICKER_FIELDS`, `MOBILE_CHIP_FIELDS`, `DESKTOP_PICKER_FIELDS`, `MULTI_SELECT_FIELDS`, `SORT_DEFS`, `SORT_USES_MOBILE_PICKER`, `placeMatchesFilters`, `filterPlaces`, `sortPlaces`.
- From `web/lib/hours.ts`: `CharlotteTime`, `HoursStatus`, `getCharlotteTimeNow`, `getHoursStatus`, `isPlaceOpenNow`, `injectDynamicTags`, `isOpenLate`, `isOpenEarly`, parsing helpers, Charlotte timezone constants, dynamic tag thresholds.
- From `web/lib/utils.ts`: `normalizeTextForSearch`, `shuffleArray`, `shuffleArrayNoAdjacentDuplicates`.
- From `web/lib/data-services.ts`: `parsePlacePhotoManifests(value)` after removing server imports.
- From `web/lib/place-type-config.ts`: place type labels, emoji values, marker colors, semantic icon keys, fallback marker metadata.
- From `web/components/PlaceHighlights.tsx`: pure highlight predicates, priority ordering, semantic highlight descriptors.

Do not move `cn()` to core. `cn()` depends on Tailwind class merging and belongs in platform UI utility packages.

## Runtime Validation Decision

The current Next.js app already lists `zod` as a direct dependency, but first-party source currently does not define app-owned Zod schemas for the catalog. Current runtime validation is mostly ad hoc parsing in `data-services.ts`.

Zod is a TypeScript-first runtime validation library. TypeScript checks code at compile time. Zod checks untrusted data at runtime. It is needed at boundaries where Airtable, CSV, and HTTP JSON enter the application.

Use Zod in `packages/core` only for untrusted data boundaries:

- normalized Airtable/CSV place payloads
- `GET /api/places` compatibility response during migration
- `GET /api/places/[id]` compatibility response during migration
- `GET /api/v1/places` response envelope
- `GET /api/v1/places/[id]` response envelope
- `POST /api/chat` request payloads
- future public mutation payloads after those features exist

Do not create Zod schemas for every internal UI type. Do not validate local component state with Zod unless that state crosses a network/storage/persistence boundary.

Required validator files:

```text
packages/core/src/places/schemas.ts
packages/core/src/filters/schemas.ts
packages/core/src/api/contracts.ts
```

The `Place` TypeScript type and the `PlaceSchema` runtime validator must agree. API routes must validate outbound data before returning it to mobile. Mobile must validate API responses before storing them in the persisted query cache.

## Shared React State Requirements

`web/contexts/FilterContext.tsx` is reusable as React state because it imports React and shared helper functions but does not depend on DOM APIs. It must be lifted into `packages/shared-react`.

Move these pieces into `packages/shared-react`:

- `FilterState`
- `FilterAction`
- `initialState`
- `filterReducer`
- `FilterDataContext`
- `FiltersContext`
- `QuickSearchContext`
- `SortContext`
- `OpenNowContext`
- `PlacesContext`
- `FilterActionsContext`
- `FilterProvider`
- `useFilterData`
- `useFilters`
- `useQuickSearch`
- `useSort`
- `useOpenNow`
- `usePlaces`
- `useFilterActions`

Both web and mobile must import filter state from `packages/shared-react`. The mobile app must not create a separate native-only filter reducer.

The UI that consumes filter state remains platform-specific:

- Web filter UI remains in `web/components/FilterSidebar.tsx`, `web/components/FilterDrawer.tsx`, `web/components/MobileQuickFilters.tsx`, `web/components/FilterUtilities.tsx`, `web/components/VirtualizedSelect.tsx`, and `web/components/SearchablePickerModal.tsx`.
- Mobile filter UI is implemented in `mobile/features/filters/` and consumes the shared contexts from `packages/shared-react` plus filter metadata from `packages/core`.
- Browse and Map share one `FilterProvider` state tree in the mobile app. A filter applied from Browse filters Map markers. A filter applied from Map filters Browse results.

## Modal Surface Stack Requirements

`web/contexts/ModalContext.tsx` cannot be moved wholesale because it imports Next dynamic, web modal components, DOM loading states, and writes to `window.history`.

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

`web/lib/place-type-config.ts` imports `components/Icons.tsx`, so it cannot move unchanged into core.

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

`web/components/PlaceHighlights.tsx` mixes pure highlight rules with JSX icons and Tailwind classes. It cannot move unchanged.

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
- `cinnamonRoll`: `hasCinnamonRolls` matches one of `Yes`, `TRUE`, and `true`, badge only.

Web adapter maps descriptors to Tailwind classes and web icons. Native adapter maps descriptors to NativeWind classes/native styles and native icons. The ordering of badges must match current web behavior: unprioritized badges first in definition order, prioritized badges sorted descending so priority 1 ends rightmost.

## API Boundary

The mobile app consumes HTTP APIs. It never talks directly to Airtable, CSV files, Cosmos DB, Azure OpenAI, and server secrets.

Preserve the current endpoints:

- `GET /api/places`: compatibility endpoint returning raw `Place[]`.
- `GET /api/places/[id]`: compatibility endpoint returning a raw `Place`. Missing records return 404.
- `POST /api/chat`: streaming chat endpoint.

Add versioned endpoints for the mobile implementation:

- `GET /api/v1/places`: returns a typed envelope.
- `GET /api/v1/places/[id]`: returns a typed envelope for a single place.

Mobile must use the versioned endpoints. Existing web code keeps using server functions and compatibility endpoints during the extraction. New cross-platform clients use versioned endpoints.

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
- Drizzle: TypeScript ORM/query builder/migration layer that sits on top of SQLite and future SQL databases. Drizzle does not replace TanStack Query.

Parity migration decision:

1. Install and use `@tanstack/react-query`.
2. Install and use `@tanstack/react-query-persist-client`.
3. Install and use `@tanstack/query-async-storage-persister`.
4. Install and use `expo-sqlite` for `expo-sqlite/kv-store` as the AsyncStorage-compatible persistence backend.
5. Install and use a network state integration such as `@react-native-community/netinfo` for online/offline state.
6. Do not create `places`, `photos`, `tags`, and `filters` SQLite tables during the parity migration.
7. Do not add Drizzle during the parity migration.

Mobile query behavior:

- On every app launch while online, refetch `GET /api/v1/places` from the configured API origin.
- Keep rendering the last successful catalog while the launch refetch is in flight.
- If launch refetch fails, keep the last successful catalog visible and show an offline/error state.
- Persist the last successful catalog through TanStack Query persistence backed by `expo-sqlite/kv-store`.
- Do not enforce a time-based cache expiration during the parity migration. The persisted catalog remains usable until a newer successful response replaces it or the user clears app storage.
- Pull-to-refresh triggers the same catalog refetch and never clears visible cached data on failure.
- Reconnect triggers a catalog refetch and keeps visible cached data until a newer valid response replaces it.

Mobile API origin configuration:

- Production builds use `EXPO_PUBLIC_API_BASE_URL=https://www.charlottethirdplaces.com`.
- Develop builds use `EXPO_PUBLIC_API_BASE_URL=https://charlotte-third-places-git-develop-segun-akinyemis-projects.vercel.app`.
- Fixture builds set `EXPO_PUBLIC_MOBILE_DATA_MODE=fixture` and do not call the network for catalog or chat fixtures.
- The API client trims trailing slashes from `EXPO_PUBLIC_API_BASE_URL` before appending `/api/v1/places`, `/api/v1/places/[id]`, and `/api/chat`.

Professional offline behavior for the parity migration means:

- After one successful online launch, the app can cold-launch offline and show the last successful catalog.
- Place detail works offline for places already present in the cached catalog.
- Filters, quick search, sort, Open Now, dynamic tags, and card rendering work over the cached catalog.
- The app shows an explicit offline state when offline.
- Pull-to-refresh attempts to refetch and reports failure without clearing cached data.
- Reconnect triggers refetch of stale queries.

SQLite tables and Drizzle become required only when a later feature adds local relational ownership: offline saved lists, offline user mutations, queued writes, conflict resolution, full offline full-text search, and catalog size/performance that cannot be handled by persisted JSON plus in-memory shared filters.

## Mobile Styling Stack

Use NativeWind v5 as the styling foundation and React Native Reusables-derived copied components as the component layer.

This decision intentionally follows the local `expo-tailwind-setup` skill instead of the general Expo UI preference for inline styles because this migration requires exact visual parity with an existing Tailwind/shadcn web app.

Required mobile styling stack:

- NativeWind v5
- React Native Reusables CLI-added component source files
- `react-native-css` per the local Expo Tailwind setup guidance
- `tailwind-merge` and `clsx` in the native UI utility layer
- Expo font loading for exact local Inter, IBM Plex Sans, and JetBrains Mono font assets

Do not add a dependency named `react-native-reusables`. React Native Reusables provides a CLI and registry for adding component source files to the app. The copied files live under `mobile/components/ui/` and are app-owned after they are added.

Port these web tokens from `web/styles/globals.css` into the native theme.

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

### Mobile Font Assets

The website uses `next/font/google` in `web/lib/fonts.ts`. The mobile app cannot use `next/font`, so it bundles local font files and loads them with `expo-font` at app startup.

Current downloaded font archives:

```text
fonts/Inter-4.1.zip
fonts/IBM_Plex_Sans.zip
fonts/IBM_Plex_Sans,JetBrains_Mono.zip
```

Required font preparation steps:

1. Create `mobile/assets/fonts/`.
2. Create a temporary extraction folder outside runtime assets, such as `.tmp-font-extract/` at the repo root.
3. Unzip `fonts/Inter-4.1.zip`, `fonts/IBM_Plex_Sans.zip`, and `fonts/IBM_Plex_Sans,JetBrains_Mono.zip` into `.tmp-font-extract/`.
4. Copy only the required `.ttf` or `.otf` files into `mobile/assets/fonts/`.
5. Rename copied files to stable app-owned names.
6. Delete `.tmp-font-extract/` after copying.
7. Do not reference `.zip` files from app code. Do not leave extracted temporary font folders under `mobile/assets/`.

Required mobile font files:

```text
mobile/assets/fonts/Inter-Regular.ttf
mobile/assets/fonts/Inter-Medium.ttf
mobile/assets/fonts/Inter-SemiBold.ttf
mobile/assets/fonts/Inter-Bold.ttf
mobile/assets/fonts/IBMPlexSans-Regular.ttf
mobile/assets/fonts/IBMPlexSans-Bold.ttf
mobile/assets/fonts/JetBrainsMono-Regular.ttf
mobile/assets/fonts/JetBrainsMono-Bold.ttf
```

Mobile font family mapping:

- default app text: `Inter`
- medium text: `Inter-Medium`
- semibold text: `Inter-SemiBold`
- bold text: `Inter-Bold`
- place cards: `IBMPlexSans-Regular` and `IBMPlexSans-Bold`
- code/mono UI: `JetBrainsMono-Regular` and `JetBrainsMono-Bold`

`mobile` must load all eight font files before rendering the primary route tree. The startup loading state uses the existing Expo splash screen and does not show placeholder text with system fonts.

## Mobile Testing Strategy

The mobile app must have automated test parity with the current web app. The current web app uses Vitest for unit/component tests and Playwright for user-flow E2E tests. The mobile app uses a React Native test stack with the same coverage intent.

Required mobile test stack:

- Unit test runner: Jest with `jest-expo`.
- Component and screen tests: `@testing-library/react-native`.
- Expo Router integration tests: `expo-router/testing-library`.
- API boundary mocks: MSW.
- End-to-end user flows: Maestro against a built app artifact.
- Non-default fallback: Detox. Detox is introduced only after a written technical exception identifies a flow Maestro cannot automate.

Required `mobile/package.json` scripts:

```json
{
  "scripts": {
    "test:unit": "jest --watchAll",
    "test:unit:run": "jest --runInBand",
    "test:e2e:mobile": "maestro test .maestro"
  }
}
```

Required mobile test dependencies:

```powershell
cd mobile
npx expo install jest-expo jest @types/jest "--" --dev
npx expo install @testing-library/react-native "--" --dev
npm install --save-dev msw
```

Required Jest configuration:

- Create `mobile/jest.config.js` and set `preset: "jest-expo"` there.
- Add `jest` to the `compilerOptions.types` array in `mobile/tsconfig.json`.
- Keep test files outside `mobile/app`. Expo Router route files live in `mobile/app`; tests live in `mobile/__tests__`.
- Use `expo-router/testing-library` for route tests that need an in-memory route tree and `initialUrl`.

Required mobile test data strategy:

- Core unit tests import deterministic fixtures from `packages/core/src/__fixtures__/`.
- Mobile component, route, and Maestro tests import deterministic fixtures from `mobile/__tests__/fixtures/`.
- Component and route integration tests use MSW handlers that return deterministic `/api/v1/places`, `/api/v1/places/[id]`, and `/api/chat` responses.
- Maestro E2E builds set `EXPO_PUBLIC_MOBILE_DATA_MODE=fixture` in the EAS `e2e-test` build profile. The mobile app reads bundled fixture data when that value is `fixture`. Maestro tests do not call live Airtable production data.
- Manual QA and production monitoring are the only places where production Airtable data is used for mobile validation.

Required mobile test coverage:

1. Core unit tests cover filters, match modes, sorting, featured-first ordering, text normalization, hours, dynamic tags, place type metadata, highlight descriptors, photo manifest parsing, and API validators.
2. Shared React state tests cover `FilterProvider`, `openNowCount`, distinct-value caching, reset behavior, and modal surface stack reducer/actions.
3. Component tests cover PlaceCard, native filter controls, Place Detail content, photo disclosure, Chat prompt/input states, Contribute cards, and offline banner states.
4. Expo Router integration tests cover tabs, `/places/[id]`, modal photo/chat routes, and deep-link route parsing.
5. Maestro E2E tests cover app launch, Home rendering, Browse filters, Map marker tap opening Place Detail, Chat prompt submission, Place Detail share/action rendering, Contribute external target selection, offline launch with cached catalog, and reconnect refetch.

Required Maestro files:

```text
mobile/.maestro/home.yml
mobile/.maestro/browse-filters.yml
mobile/.maestro/map-place-open.yml
mobile/.maestro/chat.yml
mobile/.maestro/place-detail.yml
mobile/.maestro/contribute.yml
mobile/.maestro/offline-cache.yml
```

EAS Workflows must add a mobile E2E job after the mobile E2E build profile exists. The EAS build profile for E2E creates an Android `.apk` and an iOS simulator `.app` that Maestro can install. The workflow uses Maestro flow paths under `mobile/.maestro/`.

## Native Map Strategy

The native map renderer is `react-native-maps`. The mobile app does not use `expo-maps` for the parity migration.

Current web `PlaceMap.tsx` cannot be exported directly as native code. It depends on `@vis.gl/react-google-maps`, `google.maps.*` types, browser geolocation, DOM marker composition, shadcn buttons, Tailwind DOM classes, and browser events.

Shareable map logic moves to `packages/core`:

- `placeMatchesFilters`
- `normalizeTextForSearch`
- `isPlaceOpenNow`
- `getCharlotteTimeNow`
- shared place type map colors
- marker view-model construction: `recordId`, coordinate, title, featured flag, type color, semantic icon key, label text, label eligibility
- label rules: zoom threshold `12`, max visible labels `30`, label truncation at `20` characters
- Charlotte center: `{ latitude: 35.23075539296459, longitude: -80.83165532446358 }`

Native map renderer decision:

- Install the Expo-compatible `react-native-maps` package with `npx expo install react-native-maps` from `mobile/`.
- Reject any resolved `react-native-maps` version below `1.26.1` because Fabric/New Architecture support starts at `1.26.1`.
- Keep React Native pinned at the current `0.85.3` until an Expo SDK upgrade changes it through the documented Expo upgrade process.
- Use Apple Maps on iOS through `react-native-maps` platform defaults.
- Use Google Maps on Android through `react-native-maps` platform defaults.
- Use `expo-location` for foreground-only location reads.

Decision rationale:

- Current `react-native-maps` upstream documentation and npm package documentation state Fabric/New Architecture support for `react-native-maps` `1.26.1+` with React Native `>= 0.81.1`.
- The mobile app currently uses React Native `0.85.3`, so the older Reddit thread claiming no New Architecture support is stale for this project.
- `expo-maps` is first-party, but the Expo docs mark it as alpha.
- `expo-maps` supports Apple Maps on iOS and Google Maps on Android. It does not support Google Maps on iOS.
- Expo Maps iOS marker and annotation click callbacks are documented as iOS `18.0+`. The parity requirement needs marker tap-to-open-place across supported iPhones, so that version gate blocks exact parity.
- Functional parity is the requirement. Base tile parity with the web Google map is not required.

Native map implementation requirements:

1. Add `react-native-maps` with `npx expo install react-native-maps` from `mobile/`.
2. Add `expo-location` with `npx expo install expo-location` from `mobile/`.
3. Convert `mobile/app.json` to `mobile/app.config.ts` before adding secret-backed Android map configuration.
4. Add the iOS foreground location copy through the `expo-location` config plugin.
5. Read `process.env.GOOGLE_MAPS_API_KEY` in `mobile/app.config.ts` and inject it into Android Google Maps configuration. Do not commit the key.
6. Do not request location on app launch.
7. Request foreground location only when the user taps Find Me.
8. Use `Location.getLastKnownPositionAsync({ maxAge: 300000 })` first for a fast cached response, then use `Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })` when no suitable cached position exists.
9. Render markers from the shared marker view-model, not raw `Place` objects inside the native map component.
10. Use generated image-based marker assets through the `Marker` image prop. Store generated assets under `mobile/assets/map-markers/`. Generate one regular marker asset per semantic place type key plus one featured marker asset. Do not use custom React marker views in the parity implementation.
11. Marker press calls the shared native modal action to open the place surface.
12. The Find Me success path sets a user marker, pans to user location, and uses the native equivalent of web zoom `14`.
13. The map shows labels at zoom `12` and higher, caps labels at `30`, and truncates labels after `20` characters.
14. Open Now, quick search, and all filter state come from the shared mobile `FilterProvider`, so Browse and Map stay synchronized.

Native marker asset requirements:

- Add `mobile/scripts/generate-map-markers.ts`.
- The script imports place type metadata from `@charlotte-third-places/core` after core metadata exists.
- The script writes marker PNGs to `mobile/assets/map-markers/`.
- File naming pattern: `{iconKey}.png`, `{iconKey}@2x.png`, `{iconKey}@3x.png`.
- Featured marker naming pattern: `featured.png`, `featured@2x.png`, `featured@3x.png`.
- The script uses the exact shared marker colors, featured marker color `#f59e0b`, fallback color `#3B82F6`, and the shared 19-color hash fallback.
- The script fails when two place types resolve to the same `iconKey` and would overwrite the same marker asset.

## Native Icon Strategy

Mobile UI icons use `@expo/vector-icons`, installed from `mobile/` with:

```powershell
npx expo install @expo/vector-icons
```

The mobile icon adapter lives in `mobile/lib/icons.tsx` and maps core `iconKey` values to named icons from `@expo/vector-icons` icon families. Feature components import from the mobile icon adapter only. They do not import directly from `@expo/vector-icons`.

The web icon adapter remains `web/components/Icons.tsx`. Core never imports icon components.

Map marker glyphs are generated PNG assets. The map component does not render `@expo/vector-icons` components inside markers during the parity migration.

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
- Use `FlashList` from `@shopify/flash-list` for native list virtualization. Install it from `mobile/` with `npx expo install @shopify/flash-list`. The virtualized list must keep smooth scrolling with the full current catalog.

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
- Quick facts include address, neighborhood, size, purchase required, parking, free Wi-Fi, cinnamon rolls, hours, tags, and social links.
- Quick facts pass both `place.hours` and `place.hoursType` to the native QuickFacts equivalent.
- Native Hours row behavior must match web `QuickFacts`: render `Event Based` when `hours` is empty and `hoursType === "Event Based"`; hide the Hours row when `hours` is empty and `hoursType` is not `Event Based`; render live status and expandable weekly hours when `hours` has entries.
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
- Web zoom-dependent labels are reproduced using native marker labels. Native implementation must cap visible labels at 30 and only show labels when zoom is greater than or equal to the native equivalent of web zoom 12.

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

Native app parity requires About and Legal access from the More tab. The final surface behavior is governed by OQ-03 until that question is resolved.

Requirements that apply to both OQ-03 options:

- More renders native list rows for About and Legal.
- About and Legal must not use `WebView`, `use dom`, Expo DOM Components, or embedded Next.js pages.
- External links inside About and Legal content use the centralized native external-link adapter.
- Termly policy links open outside the app.

If OQ-03 resolves to strict native parity:

- `mobile/features/more/about-screen.tsx` renders the current About FAQ and project copy as native text, accordion rows, and external-link buttons.
- `mobile/features/more/legal-screen.tsx` renders the current Legal policy cards as native cards that open Termly links externally.
- The More tab navigates to these native screens through Expo Router.

If OQ-03 resolves to browser handoff:

- Selecting About opens `https://www.charlottethirdplaces.com/about` in the platform browser.
- Selecting Legal opens `https://www.charlottethirdplaces.com/legal` in the platform browser.
- The handoff is documented as a deliberate maintenance tradeoff, not an implementation shortcut.

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

## Complete File Change Map

This section is the implementation inventory. It maps the required code changes; it does not authorize implementation yet. The implementing agent must touch only the files named here unless a compile or test failure proves one additional adjacent file is required.

### Root Workspace Files

| Path | Action | Required Work |
| --- | --- | --- |
| `package.json` | Add | Create the private workspace file exactly as specified in npm Workspace Setup. Do not add app dependencies here. |
| `package-lock.json` | Add after OQ-09 is resolved to the recommended default | Generate from a root `npm install` after shared packages and workspace dependencies exist. Root lockfile becomes the source of truth. |
| `web/package-lock.json` | Delete after OQ-09 is resolved to the recommended default | Remove when root lockfile becomes authoritative. |
| `mobile/package-lock.json` | Delete after OQ-09 is resolved to the recommended default | Remove when root lockfile becomes authoritative. |
| `fonts/` | Keep | Keep the three zip archives as source artifacts. Do not import zip files from app code. |

### Shared Package Files To Add

`packages/core` is pure TypeScript. It contains no React, DOM, Next.js, Expo, React Native, Tailwind, icons, server secrets, Airtable SDK, Cosmos SDK, Azure SDK, filesystem code, or native APIs.

| Path | Action | Required Work |
| --- | --- | --- |
| `packages/core/package.json` | Add | Name `@charlotte-third-places/core`; expose `src/index.ts`; depend on `zod`; include `test`, `test:run`, and `typecheck` scripts once package tests exist. |
| `packages/core/tsconfig.json` | Add | Strict TypeScript config with declaration output. It must not include DOM-only libs beyond what the moved code truly needs for `Intl`. |
| `packages/core/src/index.ts` | Add | Barrel export public types, filters, hours, text, arrays, place metadata, highlights, API contracts, and API client helpers. |
| `packages/core/src/places/types.ts` | Add from `web/lib/types.ts` | Move `PlacePhoto`, `Place`, `PlaceDocument`, `ChunkDocument`, `SortField`, `SortDirection`, `SortOption`, and `DEFAULT_SORT_OPTION`. Preserve `hours: string[]` and `hoursType?: string`. |
| `packages/core/src/places/schemas.ts` | Add | Define Zod schemas for untrusted `Place` payloads, `PlacePhoto`, wire dates, `hours`, and optional `hoursType`. The schema must parse `createdDate` and `lastModifiedDate` from ISO strings at HTTP/storage boundaries and keep `Date` objects in app code. |
| `packages/core/src/places/normalize.ts` | Add | Re-create only the pure normalization from `mapRecordToPlace`: string arrays, booleans, dates, numeric coordinates, `Hours` JSON array, `Hours Type`, and photo manifests. No Airtable, CSV, `fs`, or `path` imports. |
| `packages/core/src/places/photo-manifests.ts` | Add from `web/lib/data-services.ts` | Move `parsePlacePhotoManifests(value: unknown): PlacePhoto[]`. Preserve silent filtering of malformed entries and `[]` fallback. |
| `packages/core/src/places/place-type-metadata.ts` | Add from `web/lib/place-type-config.ts` | Replace React icon components with `{ type, iconKey, emoji, mapColor }`. Preserve every place type, emoji, map color, fallback color `#3B82F6`, fallback emoji, and fallback icon key. |
| `packages/core/src/places/highlights.ts` | Add from `web/components/PlaceHighlights.tsx` | Move only pure predicates, priorities, ordering, labels, aria labels, and semantic tokens. Replace JSX icons/classes/gradients with `iconKey`, `badgeToken`, `ribbonToken`, and `gradientToken`. Preserve badge ordering: unprioritized first, prioritized appended sorted descending so priority 1 is rightmost. |
| `packages/core/src/filters/definitions.ts` | Add from `web/lib/filters.ts` | Move filter constants, types, `FILTER_DEFS`, `DEFAULT_FILTER_CONFIG`, maps, field sets, `SORT_DEFS`, and `SORT_USES_MOBILE_PICKER`. |
| `packages/core/src/filters/predicates.ts` | Add from `web/lib/filters.ts` | Move `placeMatchesFilters` and `filterPlaces` unchanged except imports. |
| `packages/core/src/filters/sorting.ts` | Add from `web/lib/filters.ts` | Move `sortPlaces` unchanged except imports. Featured-first behavior stays mandatory. |
| `packages/core/src/hours/hours.ts` | Add from `web/lib/hours.ts` | Move `CharlotteTime`, `HoursStatus`, all constants, parsers, status helpers, `isPlaceOpenNow`, `injectDynamicTags`, and exported `*At` helpers unchanged. |
| `packages/core/src/text/normalize.ts` | Add from `web/lib/utils.ts` | Move `normalizeTextForSearch` unchanged. |
| `packages/core/src/text/airtable-markdown.ts` | Add from `web/lib/parsing.ts` | Move `parseAirtableMarkdown`, `ParsedMarkdown`, and `ParsedMarkdownNode` unchanged. Native description rendering consumes this AST. |
| `packages/core/src/arrays/shuffle.ts` | Add from `web/lib/utils.ts` | Move `shuffleArray` and `shuffleArrayNoAdjacentDuplicates` unchanged. |
| `packages/core/src/map/marker-view-model.ts` | Add | Build marker view models from `Place`: `recordId`, coordinate, title, featured flag, resolved type color, icon key, label text, and label eligibility. Preserve Charlotte center, label threshold `12`, label cap `30`, label truncation `20`, featured color `#f59e0b`, fallback `#3B82F6`, and the 19-color hash palette. |
| `packages/core/src/api/contracts.ts` | Add | Define `PlacesResponse`, `PlaceResponse`, chat request schema, and schema version `1`. |
| `packages/core/src/api/client.ts` | Add | Provide platform-neutral URL builders and response validators. Do not import `fetch`; platform clients pass raw JSON through validators. |
| `packages/core/src/__fixtures__/places.ts` | Add | Minimal deterministic catalog covering featured, coming soon, event-based hours, normal hours, empty photos, failed-photo URLs, multiple types, every chip filter, and dynamic tags. |

`packages/shared-react` may import React and `@charlotte-third-places/core`. It must not import React DOM, React Native, Next.js, Expo, browser history, native navigation, shadcn, or platform UI.

| Path | Action | Required Work |
| --- | --- | --- |
| `packages/shared-react/package.json` | Add | Name `@charlotte-third-places/shared-react`; depend on `react` as a peer dependency and `@charlotte-third-places/core` as a workspace dependency. |
| `packages/shared-react/tsconfig.json` | Add | Strict TypeScript config for React source. |
| `packages/shared-react/src/index.ts` | Add | Barrel export filter state and modal surface stack contracts. |
| `packages/shared-react/src/filters/filter-provider.tsx` | Add from `web/contexts/FilterContext.tsx` | Move `FilterProvider`, granular contexts, hooks, distinct value caching, `openNowCount`, reducer, and actions. Preserve the cache rebuild rule: distinct values rebuild only when `places` changes. |
| `packages/shared-react/src/filters/reducer.ts` | Add from `web/contexts/FilterContext.tsx` | Move `FilterState`, `FilterAction`, `initialState`, and `filterReducer`. |
| `packages/shared-react/src/filters/hooks.ts` | Add from `web/contexts/FilterContext.tsx` | Export `useFilterData`, `useFilters`, `useQuickSearch`, `useSort`, `useOpenNow`, `usePlaces`, and `useFilterActions`. |
| `packages/shared-react/src/modals/types.ts` | Add from `web/contexts/ModalContext.tsx` | Move `SurfaceKind`, `Surface`, `PushPlaceOptions`, and `ModalActions` contract. |
| `packages/shared-react/src/modals/surface-stack.ts` | Add | Pure reducer/actions for push/pop/popTo/closeAll. Native and web providers wrap this with platform back behavior. |

### Existing Web Files To Update

The Next.js app remains the website and server integration host. Web behavior must pass existing tests after each extraction step.

| Path | Action | Required Work |
| --- | --- | --- |
| `web/package.json` | Update | Add workspace dependencies for `@charlotte-third-places/core` and `@charlotte-third-places/shared-react`. Keep Next.js, Airtable, Cosmos, AI, shadcn, and web-only dependencies here. |
| `web/tsconfig.json` | Update | Ensure TypeScript can resolve workspace package exports. Do not point web imports into `../packages/*/src` by relative path. |
| `web/lib/types.ts` | Replace with adapter | Re-export moved types from `@charlotte-third-places/core`. Keep no duplicate `Place` definition. |
| `web/lib/filters.ts` | Replace with adapter | Re-export moved filters and sort helpers from core. |
| `web/lib/hours.ts` | Replace with adapter | Re-export moved hours helpers from core. |
| `web/lib/parsing.ts` | Replace with adapter | Re-export `parseAirtableMarkdown` and markdown types from core. |
| `web/lib/utils.ts` | Update | Keep `cn()` in web. Re-export `normalizeTextForSearch`, `shuffleArray`, and `shuffleArrayNoAdjacentDuplicates` from core. |
| `web/lib/place-type-config.ts` | Refactor adapter | Import core place type metadata and map `iconKey` to `Icons.*`. Preserve public helpers `getPlaceTypeIcon`, `getPlaceTypeEmoji`, `getPlaceTypeColor`, and `getAllMapColors`. |
| `web/components/PlaceHighlights.tsx` | Refactor adapter | Import core highlight descriptors and map semantic tokens to existing JSX icons, Tailwind classes, ribbons, and gradients. Preserve exported `getPlaceHighlights` and `listHighlightKeys` contract for web callers or update callers in the same edit. |
| `web/contexts/FilterContext.tsx` | Replace with adapter | Re-export `FilterProvider` and filter hooks from `@charlotte-third-places/shared-react`, or keep a thin wrapper only if web tests require the same module path. |
| `web/contexts/ModalContext.tsx` | Refactor adapter | Keep `window.history`, `next/dynamic`, `PlaceModal`, `PhotosModal`, and `ChatModal` in web. Import shared modal types/reducer from `packages/shared-react`. Preserve history snapshot behavior and `newId()` behavior. |
| `web/lib/data-services.ts` | Update | Keep server I/O, Airtable SDK, CSV parsing, `fs`, `path`, and env handling. Import core `Place`, `PlacePhoto`, `parsePlacePhotoManifests`, and pure normalizers. Preserve `hours: getField("Hours")` and `hoursType: getField("Hours Type")`. |
| `web/app/api/places/route.ts` | Update only if imports change | Preserve current compatibility response shape `Place[]`, `dynamic = "force-static"`, and 500 error behavior. |
| `web/app/api/places/[id]/route.ts` | Update only if imports change | Preserve raw `Place` response, 404 JSON, `dynamic = "force-static"`, `dynamicParams = true`, and `generateStaticParams`. |
| `web/app/api/v1/places/route.ts` | Add | Return `PlacesResponse` envelope with `schemaVersion: 1`, `generatedAt`, `source`, `totalCount`, and validated `places`. Use `PlaceSchema`/`PlacesResponseSchema` before returning. |
| `web/app/api/v1/places/[id]/route.ts` | Add | Return `PlaceResponse` envelope with `schemaVersion: 1`, `generatedAt`, and validated `place`; preserve 404 behavior for missing records. |
| `web/app/api/chat/route.ts` | Update only for schemas | Keep server-side RAG and streaming. Validate request with the core chat schema if added; do not change response format unless OQ-02 resolves to a native adapter endpoint. |
| `web/public/.well-known/apple-app-site-association` | Add after OQ-04 | Serve extensionless JSON for both apex and `www` hosts. Recommended app ID is `99D8WCTX5D.com.charlottethirdplaces.app`. Scope recommended app-owned paths: `/`, `/map`, `/chat`, `/contribute`, `/about`, `/legal`, and `/places/*`. |
| `web/public/.well-known/assetlinks.json` | Update after OQ-05 | Preserve current fingerprints. Add any new Play App Signing fingerprint only if the existing Play Console app-signing fingerprint changes or Expo development App Links need a separate debug/internal fingerprint. |
| `web/next.config.mjs` | Verify | Keep apex redirect exemption for `/.well-known/*`; AASA and assetlinks must not redirect. |
| `web/styles/globals.css` | No extraction delete | Remains the web source of truth for tokens. Mobile copies token values into its own NativeWind setup; web CSS stays in web. |
| `web/components/ThemeColorSync.tsx` | No mobile move | Remains web/PWA-only. Native status/splash colors are handled by Expo config and native theme code. |
| `web/components/ai-elements/*` | No mobile move | DOM/chat UI remains web-only. Native chat builds separate components and parser. |
| `web/components/ui/*` | No mobile move | shadcn/Radix DOM primitives remain web-only. Mobile creates React Native Reusables-derived equivalents only for used primitives. |
| `web/components/AirtableForm.tsx` | No mobile move | Web-only iframes stay web. Native Contribute opens Airtable form URLs externally. |
| `web/components/DataTable.tsx` | No mobile move | Web virtualization stays web. Native Browse uses FlashList. |
| `web/components/FilterDrawer.tsx`, `web/components/FilterSidebar.tsx`, `web/components/FilterUtilities.tsx`, `web/components/SearchablePickerModal.tsx`, `web/components/VirtualizedSelect.tsx`, `web/components/VirtualizedPickerModal.tsx`, `web/components/MobileQuickFilters.tsx` | No mobile move | Web filter UI stays web. Mobile filter UI consumes shared state and core filter metadata. |
| `web/components/MainNavigation.tsx`, `web/components/MobileNavigation.tsx`, `web/components/SiteHeader.tsx`, `web/components/SiteFooter.tsx` | No mobile move | Web chrome stays web. Native tabs and More screen replace mobile web navigation. |

### Mobile Starter Files To Delete Or Move

The current mobile app is an Expo starter. The implementation replaces it; it does not gradually adapt starter screens.

| Path | Action | Required Work |
| --- | --- | --- |
| `mobile/src/app/_layout.tsx` | Delete | Replaced by `mobile/app/_layout.tsx`. |
| `mobile/src/app/index.tsx` | Delete | Template `Welcome to Expo` screen is not reused. |
| `mobile/src/app/explore.tsx` | Delete | Template explore screen is not reused. |
| `mobile/src/components/animated-icon.tsx`, `mobile/src/components/animated-icon.web.tsx`, `mobile/src/components/animated-icon.module.css` | Delete | Template animation is not reused. |
| `mobile/src/components/app-tabs.tsx`, `mobile/src/components/app-tabs.web.tsx` | Delete | Template tab bar is replaced by Expo Router `(tabs)/_layout.tsx`. |
| `mobile/src/components/hint-row.tsx`, `mobile/src/components/web-badge.tsx`, `mobile/src/components/ui/collapsible.tsx` | Delete | Template helper UI is not reused. |
| `mobile/src/hooks/use-color-scheme.web.ts` | Delete | Web-specific mobile starter hook is not needed for native parity. |
| `mobile/scripts/reset-project.js` | Delete | Remove after route replacement; remove `reset-project` script from `mobile/package.json`. |
| `mobile/src/components/themed-text.tsx`, `mobile/src/components/themed-view.tsx`, `mobile/src/components/external-link.tsx` | Move/adapt | Move to root mobile folders only if still useful after NativeWind/Reusables setup. They must not preserve template visual tokens. |
| `mobile/src/hooks/use-color-scheme.ts`, `mobile/src/hooks/use-theme.ts` | Move/adapt | Move to `mobile/hooks/` or replace with native theme helpers. No web variant. |
| `mobile/src/constants/theme.ts` | Move/adapt | Move to `mobile/styles/theme.ts` or `mobile/constants/theme.ts` and replace template colors with web token equivalents. |
| `mobile/src/global.css` | Move/adapt | Move to `mobile/styles/globals.css` and expand with NativeWind v5/Tailwind v4 theme imports and web token values. |

### Mobile Configuration Files To Update Or Add

| Path | Action | Required Work |
| --- | --- | --- |
| `mobile/package.json` | Update | Remove `reset-project`. Add scripts `test:unit`, `test:unit:run`, and `test:e2e:mobile`. Add workspace dependency `@charlotte-third-places/core` and `@charlotte-third-places/shared-react`. Add named native dependencies from this plan only. |
| `mobile/app.json` | Replace with `mobile/app.config.ts` | Convert before map/associated-domain work. Preserve `name`, `slug`, `owner`, `scheme`, `ios.bundleIdentifier`, `android.adaptiveIcon`, `experiments.typedRoutes`, `experiments.reactCompiler`, and `extra.eas.projectId`. Add Associated Domains, Expo plugins, Android Google Maps key injection, splash/theme colors, and font plugin config. |
| `mobile/app.config.ts` | Add | Read `process.env.GOOGLE_MAPS_API_KEY` for Android maps. Configure `expo-font`, `expo-splash-screen`, `expo-location`, `expo-router`, and `react-native-maps` as required. Do not commit secrets. |
| `mobile/eas.json` | Update | Add `e2e-test` profile with `withoutCredentials: true`, `ios.simulator: true`, `android.buildType: "apk"`, and `EXPO_PUBLIC_MOBILE_DATA_MODE=fixture`. Keep production `autoIncrement`. |
| `mobile/tsconfig.json` | Update | After deleting `src/`, change `@/*` from `./src/*` to the chosen root source paths. If feature code lives outside `app`, aliases must include `./components/*`, `./features/*`, `./hooks/*`, `./lib/*`, and `./styles/*` through a single `./*` root alias or explicit aliases. |
| `mobile/metro.config.js` | Add | Configure NativeWind v5 with `withNativewind`, `inlineVariables: false`, and `globalClassNamePolyfill: false`. |
| `mobile/postcss.config.mjs` | Add | Configure `@tailwindcss/postcss`. |
| `mobile/styles/globals.css` | Add | Use NativeWind v5/Tailwind v4 CSS-first setup. Port light/dark tokens from `web/styles/globals.css`. |
| `mobile/tw/index.tsx` | Add | Add `react-native-css` wrappers for `View`, `Text`, `Pressable`, `ScrollView`, `TextInput`, `Link`, and animated scroll views so `className` maps to native style props. |
| `mobile/jest.config.js` | Add | Use `preset: "jest-expo"`; keep tests outside `mobile/app`. |
| `mobile/.maestro/*.yml` | Add | Add exactly the seven Maestro flows listed in Mobile Testing Strategy. |
| `mobile/.eas/workflows/e2e-test-android.yml`, `mobile/.eas/workflows/e2e-test-ios.yml` | Add after EAS profile exists | Build with `e2e-test` and run the listed Maestro flows through EAS Workflows. |

### Mobile Dependency Commands

Run commands from `mobile/` after the workspace package files exist. Do not install these at the repo root.

```powershell
npx expo install react-native-maps expo-location expo-sqlite @shopify/flash-list @expo/vector-icons expo-clipboard expo-haptics
npx expo install tailwindcss@^4 nativewind@5.0.0-preview.2 react-native-css@0.0.0-nightly.5ce6396 @tailwindcss/postcss tailwind-merge clsx
npm install @tanstack/react-query @tanstack/react-query-persist-client @tanstack/query-async-storage-persister @react-native-community/netinfo
npm install --save-dev msw sharp
npx expo install jest-expo jest @types/jest "--" --dev
npx expo install @testing-library/react-native "--" --dev
```

React Native Reusables is added with its CLI, not by pretending it is a single runtime package:

```powershell
npx @react-native-reusables/cli@latest add button badge card dialog sheet input separator tabs textarea accordion scroll-area tooltip
npx @react-native-reusables/cli@latest doctor
```

If OQ-01 resolves to `react-native-markdown-display`, add it from `mobile/`:

```powershell
npm install react-native-markdown-display
```

Do not add `@react-native-async-storage/async-storage` for catalog persistence during parity. The TanStack async persister receives `Storage` imported from `expo-sqlite/kv-store`.

### Mobile Files To Add

| Path | Action | Required Work |
| --- | --- | --- |
| `mobile/app/_layout.tsx` | Add | Root stack layout. Initialize splash handling, providers, query persistence, native modal provider, theme provider, and route stack. Do not fetch catalog directly in route files. |
| `mobile/app/(tabs)/_layout.tsx` | Add | Bottom tab layout with five tabs: Home, Map, Chat, Contribute, More. Labels match current mobile navigation except About becomes More so About and Legal both fit. |
| `mobile/app/(tabs)/index.tsx` | Add | Home route with count heading, intro copy, instant actions, Random/feed carousel, and Browse section below, matching current mobile web behavior. |
| `mobile/app/(tabs)/map.tsx` | Add | Native map route consuming shared filter state and map marker view models. |
| `mobile/app/(tabs)/chat.tsx` | Add | General chat route using native chat components and `/api/chat`. |
| `mobile/app/(tabs)/contribute.tsx` | Add | Native Contribute cards with the three exact Airtable URLs and button labels. |
| `mobile/app/(tabs)/more.tsx` | Add | Native list rows for About and Legal. Final behavior depends on OQ-03. |
| `mobile/app/places/[id].tsx` | Add | Deep-linkable native place detail route by Airtable `recordId`; resolves from cached catalog first, then `/api/v1/places/[id]` online. |
| `mobile/app/modals/photos.tsx` | Add | Native photos surface preserving place-under-photos back behavior. |
| `mobile/app/modals/chat.tsx` | Add | Native place-scoped chat surface preserving initial message support and `hideAskAI` loop prevention. |
| `mobile/app/+not-found.tsx` | Add | Native not-found route for invalid deep links. |
| `mobile/lib/api/client.ts` | Add | Builds API URLs from `EXPO_PUBLIC_API_BASE_URL`, trims trailing slash, validates with core schemas, and branches to bundled fixtures when `EXPO_PUBLIC_MOBILE_DATA_MODE === "fixture"`. |
| `mobile/lib/api/query-client.ts` | Add | Creates TanStack Query client with no time-based expiration for persisted catalog during parity. |
| `mobile/lib/api/persisted-query-provider.tsx` | Add | Uses `PersistQueryClientProvider` and `createAsyncStoragePersister({ storage: Storage })` where `Storage` is from `expo-sqlite/kv-store`. |
| `mobile/lib/api/use-places-query.ts` | Add | Fetches `/api/v1/places`, returns validated `Place[]`, preserves last successful data while refetching or offline. |
| `mobile/lib/network.ts` | Add | Wires `@react-native-community/netinfo` to query online/offline state and reconnect refetch. |
| `mobile/lib/external-links.ts` | Add | Centralizes app route detection, external browser handoff, `Linking.openURL`, maps/social/mail/tel handling, and app-owned route navigation. |
| `mobile/lib/share.ts` | Add | Native share sheet first, clipboard fallback on failure. |
| `mobile/lib/icons.tsx` | Add | Mobile icon adapter. Feature components import only this file for UI icons. Core imports no icons. |
| `mobile/lib/chat/ui-message-stream.ts` | Add after OQ-02 | Consumes `/api/chat` event stream, decodes AI SDK UIMessage events, supports abort, preserves history on errors. |
| `mobile/lib/chat/markdown.tsx` | Add after OQ-01 | Native markdown renderer or wrapper. Must override internal place links and same-place self-reference rendering. |
| `mobile/features/home/home-screen.tsx` | Add | Home content implementation with Random/feed and Browse section. |
| `mobile/features/browse/browse-list.tsx` | Add | FlashList-based native Browse list applying quick search, filters, Open Now, and sort in the same order as web. |
| `mobile/features/filters/*` | Add | Native filter controls consuming shared contexts and core metadata. Picker fields and chip fields follow `FILTER_DEFS`. |
| `mobile/features/places/place-card.tsx` | Add | Native PlaceCard preserving visible fields, highlight badges, deterministic type overflow math, neighborhood overflow behavior, Chat/Photos/Info actions, and tap-to-detail. |
| `mobile/features/places/place-detail.tsx` | Add | Native Place Detail preserving `PlaceContent` behavior, QuickFacts, actions, description, comments, metadata, Ask AI, and photo disclosure. |
| `mobile/features/places/quick-facts.tsx` | Add | Native QuickFacts preserving `YesNoBadge`, `InfoTag`, social links, hours status, `Event Based` handling, and expandable weekly hours. |
| `mobile/features/photos/photos-viewer.tsx` | Add | Native photo gallery preserving display/thumbnail usage, failed-image removal, source disclosure, empty state, and back behavior. |
| `mobile/features/map/map-screen.tsx` | Add | Native MapView wrapper, overlays, Open Now, Find Me, user marker, label cap, and marker press behavior. |
| `mobile/features/chat/chat-screen.tsx` | Add | Native ChatContent equivalent with starter prompts, place prompts, Prompt Library, clear, stop, copy, streaming, errors, and internal place link behavior. |
| `mobile/features/contribute/contribute-screen.tsx` | Add | Three native cards and external browser handoff. |
| `mobile/features/more/about-screen.tsx`, `mobile/features/more/legal-screen.tsx` | Add after OQ-03 | Native About/Legal content if OQ-03 resolves to strict native parity. |
| `mobile/assets/fonts/*` | Add | Eight extracted font files with stable names listed in Mobile Font Assets. |
| `mobile/assets/map-markers/*` | Add generated | One `{iconKey}.png`, `{iconKey}@2x.png`, `{iconKey}@3x.png` for each core icon key plus featured assets. |
| `mobile/scripts/extract-fonts.ps1` | Add | Extract from `fonts/*.zip` to `.tmp-font-extract/`, copy/rename required font files, delete temp folder, fail if any required font is missing. |
| `mobile/scripts/generate-map-markers.ts` | Add after OQ-06 | Generate marker PNG assets from core metadata. Fail on duplicate `iconKey` output names. |
| `mobile/__tests__/fixtures/*` | Add | Deterministic mobile fixture JSON and chat fixture streams. |
| `mobile/__tests__/**/*.test.tsx` | Add | Tests for routes, components, query client fixture mode, offline banner, chat states, filters, map view models, and place detail. |

### Web Test Files To Update Or Move

| Path | Action | Required Work |
| --- | --- | --- |
| `web/__tests__/lib/types.test.ts`, `filters.test.ts`, `hours.test.ts`, `utils.test.ts`, `parsing.test.ts`, `place-type-config.test.ts` | Split or update imports | Core logic tests move to `packages/core`; web adapter tests remain for web-specific icon/class mapping. |
| `web/__tests__/contexts/FilterContext.test.tsx` | Move or duplicate | Shared provider behavior tests move to `packages/shared-react`; web keeps only adapter/provider integration tests if needed. |
| `web/__tests__/contexts/ModalContext.test.tsx` | Split | Pure surface-stack reducer tests move to `packages/shared-react`; browser history/rendering tests stay in web. |
| `web/__tests__/components/*` | Keep/update imports | Component behavior stays web. Update imports after adapters are introduced. |
| `web/e2e/*.spec.ts` | Keep | E2E continues to validate website/PWA behavior. Add no mobile expectations here. |

### AASA Recommended Content After OQ-04

Use the same extensionless JSON at `web/public/.well-known/apple-app-site-association` for both `charlottethirdplaces.com` and `www.charlottethirdplaces.com`. Do not include a `.json` extension. Do not redirect this path.

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["99D8WCTX5D.com.charlottethirdplaces.app"],
        "components": [
          { "/": "/" },
          { "/": "/map" },
          { "/": "/chat" },
          { "/": "/contribute" },
          { "/": "/about" },
          { "/": "/legal" },
          { "/": "/places/*" }
        ]
      }
    ]
  }
}
```

## Implementation Order

Before step 1, resolve every `OPEN` item in the Open Questions And Porting Contention Ledger. The recommended defaults in that ledger are the implementation baseline unless the user explicitly chooses another listed option.

1. Create the repo-root private npm workspace `package.json` with workspaces `web`, `mobile`, and `packages/*`.
2. Create `packages/core` and `packages/shared-react` with their own package files.
3. Move platform-free types into `packages/core`.
4. Move filter definitions, predicates, sort logic, text normalization, and hours logic into `packages/core`.
5. Add Zod runtime validators at data/API boundaries only.
6. Split place type config into core metadata and web/native icon adapters.
7. Split place highlights into core rules and web/native render adapters.
8. Move FilterContext into `packages/shared-react`.
9. Extract modal surface stack contract into shared code and keep platform providers separate.
10. Update the existing Next.js app imports so all current web tests and behavior continue to pass.
11. Preserve existing `/api/places`, `/api/places/[id]`, and `/api/chat` compatibility behavior.
12. Add `/api/v1/places` and `/api/v1/places/[id]` typed envelope endpoints for mobile.
13. Configure mobile NativeWind v5, React Native Reusables-derived copied UI components, local fonts, tokens, and shared icon adapters.
14. Prepare mobile font assets from `fonts/Inter-4.1.zip`, `fonts/IBM_Plex_Sans.zip`, and `fonts/IBM_Plex_Sans,JetBrains_Mono.zip`.
15. Configure TanStack Query with persisted cache using `expo-sqlite/kv-store`.
16. Configure Jest, `jest-expo`, React Native Testing Library, Expo Router testing utilities, MSW, and Maestro.
17. Convert `mobile/app.json` to `mobile/app.config.ts` and configure `GOOGLE_MAPS_API_KEY`, Associated Domains, `react-native-maps`, `expo-location`, and the shared map marker view-model.
18. Generate native map marker assets.
19. Replace Expo starter screens with the required `mobile/app` route tree.
20. Implement Home, Browse, and Place Card parity.
21. Implement Place Detail and Photos parity.
22. Implement Map parity with `react-native-maps`.
23. Implement Chat parity.
24. Implement Contribute, More, About, and Legal access parity.
25. Validate offline cold launch after one successful online launch.
26. Validate mobile unit, integration, router, and Maestro E2E tests.
27. Validate on a physical iPhone development build.
28. Validate Android after iOS parity is stable.
29. Update the repository instruction files listed in Repository Instruction Updates to match the new folder layout and the new mobile architecture.

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
- hours parsing
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

Existing web tests for filters, hours, modal context, place cards, and performance must pass after shared-code extraction.

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

### Mobile Testing Gate

The mobile app must define these scripts in `mobile/package.json`:

- `npm run test:unit`
- `npm run test:unit:run`
- `npm run test:e2e:mobile`

Required test suites:

- Jest core tests for shared filters, sorting, hours, dynamic tags, place metadata, highlights, and API validators.
- React Native Testing Library component tests for PlaceCard, filter controls, Place Detail, Chat prompt states, Contribute cards, and offline banner states.
- Expo Router integration tests for tab routes, `/places/[id]`, modal routes, and deep-link route parsing.
- MSW-backed API integration tests for `/api/v1/places`, `/api/v1/places/[id]`, and `/api/chat` client behavior.
- Maestro flows in `mobile/.maestro/` for launch, Browse filters, Map marker-to-place, Chat, Place Detail, Contribute, and offline cache behavior.

Mobile automated tests use deterministic fixtures. They do not call live Airtable production data.

### Repository Instruction Gate

After the folder rename and the shared-package extraction land, the repository instruction files must describe the new reality. Fail the gate if any instruction file still points at the old nested `charlotte-third-places/` app path, or if the mobile instruction file does not mention the shared packages, the mobile testing stack, and the native map stack.

### Native Map Gate

The mobile app must use `react-native-maps` and `expo-location` for the parity migration.

Fail the gate if the implementation:

- uses `expo-maps` for the parity migration
- uses Google Maps on iOS for tile parity
- requests location on app launch
- builds markers directly from raw `Place` objects inside the map component
- keeps map filters separate from Browse filters
- renders labels beyond the shared cap of `30`
- renders labels before zoom `12`
- uploads a build where marker tap does not open the native place surface

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
- marker tap opens native place detail
- map zoom and pan remain smooth with 30 visible labels
- Apple Maps base tiles render on iOS through `react-native-maps`
- share sheet
- chat streaming
- internal chat place links
- external links
- Maestro E2E flow passes on the iOS development build
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

## Repository Instruction Updates

The folder rename and the monorepo extraction change facts that the `.github` instruction and agent files assert. Those files must be updated in the same effort so future agent runs are not misled. The implementing agent updates exactly the files below and changes only the facts named. It does not rewrite unrelated guidance.

### `.github/copilot-instructions.md`

- Keep the directory-structure section aligned with the current layout: `web/` is the Next.js app, `packages/core/` is platform-free TypeScript, `packages/shared-react/` is React-only shared state, and `mobile/` is the Expo app.
- Update the Key Files paths so `lib/data-services.ts`, `lib/types.ts`, `lib/utils.ts`, `styles/globals.css`, and `components.json` are listed under `web/`, and note that types, filters, hours, text utilities, place metadata, and highlight rules now live in `packages/core`.
- Update the Data Flow line so it no longer implies time-based ISR; static `/api/places` output is rebuilt through `/api/revalidate`.
- Add a short statement that the mobile app is a true Expo/React Native app that imports shared logic from `packages/core` and `packages/shared-react` and never accesses Airtable, Cosmos, or Azure OpenAI directly.

### `.github/instructions/theme-color-sync.instructions.md`

- Update the `applyTo` frontmatter so the web paths are rooted at `web/` instead of `charlotte-third-places/`: `web/components/ThemeColorSync.tsx`, `web/styles/globals.css`, `web/app/manifest.webmanifest`, `web/app/layout.tsx`. Keep the two iOS storyboard paths unchanged.
- Update any in-body references to `globals.css`, `ThemeColorSync.tsx`, `layout.tsx`, and `manifest.webmanifest` so they resolve under `web/`.

### `.github/agents/place-types-specialist.md`

- Keep referenced paths pointed at `web/lib/place-type-config.ts` and `web/components/Icons.tsx`.
- Add a note that place type `mapColor`/`emoji`/`iconKey` metadata now lives in `packages/core`, while the React `icon` mapping stays in `web/components/Icons.tsx` and the native icon adapter lives in `mobile`.

### `.github/instructions/mobile.instructions.md`

- Add that mobile feature code imports shared domain logic from `packages/core` (no React) and shared state from `packages/shared-react`, and must not duplicate filters, sorting, hours, or place metadata logic.
- Add that the mobile testing stack is Jest with `jest-expo`, React Native Testing Library, the Expo Router testing utilities, MSW for API mocks, and Maestro for E2E, and that the test scripts are `test:unit`, `test:unit:run`, and `test:e2e:mobile`.
- Add that native maps use `react-native-maps` (Apple Maps on iOS, Google Maps on Android) with `expo-location` for foreground-only Find Me, and that `expo-maps` is not used for the parity migration.
- Add that mobile never imports `@azure/cosmos`, `@ai-sdk/azure`, `lib/ai/*`, or any AI secret, and reaches AI only through the web-hosted `/api/chat` endpoint.

## Sources And Rationale

- Expo SQLite docs: persistent local SQL database, key-value storage, SQLCipher, FTS, Drizzle integration. <https://docs.expo.dev/versions/latest/sdk/sqlite/>
- TanStack Query docs: server-state fetching, caching, synchronization, retries, stale/fresh state, persistence. <https://tanstack.com/query/latest/docs/framework/react/overview>
- TanStack Query AsyncStorage persister docs. <https://tanstack.com/query/latest/docs/framework/react/plugins/createAsyncStoragePersister>
- Drizzle ORM overview and Expo SQLite integration. <https://orm.drizzle.team/docs/overview>, <https://orm.drizzle.team/docs/connect-expo-sqlite>
- NativeWind docs: Tailwind CSS styling workflow for React Native. <https://www.nativewind.dev/>
- React Native Reusables docs: shadcn/ui-style component layer for React Native. <https://reactnativereusables.com/>
- React Native Reusables CLI docs: component copy workflow and `doctor`. <https://reactnativereusables.com/docs/cli>
- Expo unit testing docs: Jest and `jest-expo` setup. <https://docs.expo.dev/develop/unit-testing/>
- Expo Router testing docs: `expo-router/testing-library`. <https://docs.expo.dev/router/reference/testing/>
- Expo EAS Workflows Maestro E2E docs. <https://docs.expo.dev/eas/workflows/examples/e2e-tests/>
- Maestro docs: mobile E2E flow automation. <https://docs.maestro.dev/>
- React Native Maps docs and package metadata. <https://github.com/react-native-maps/react-native-maps>, <https://www.npmjs.com/package/react-native-maps>
- Expo Maps docs: alpha status and platform map support. <https://docs.expo.dev/versions/latest/sdk/maps/>
- Expo Location docs: foreground location permission and current-position APIs. <https://docs.expo.dev/versions/latest/sdk/location/>
- Expo Font docs: config plugin and runtime font loading. <https://docs.expo.dev/versions/latest/sdk/font/>
- Expo SplashScreen docs: config plugin and `preventAutoHideAsync` startup control. <https://docs.expo.dev/versions/latest/sdk/splash-screen/>
- Expo Linking docs: deep links, app links, universal links, and outgoing links. <https://docs.expo.dev/linking/overview/>
- React Native New Architecture docs. <https://reactnative.dev/architecture/landing-page>
- Expo Router docs. <https://docs.expo.dev/router/introduction/>
- Shopify Engineering, "Five years of React Native at Shopify." <https://shopify.engineering/five-years-of-react-native-at-shopify>
- Shopify Engineering, "React Native is the Future of Mobile at Shopify." <https://shopify.engineering/react-native-future-mobile-shopify>
