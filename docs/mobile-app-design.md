# Mobile App Design And Architecture Plan

This document captures the current mobile architecture decision for Charlotte Third Places.

The final product direction is:

> One shared TypeScript domain core, a native Expo/React Native mobile app with no WebView on interactive surfaces, and the existing Next.js app serving web, SEO, shareable links, and web-first workflows.

This supersedes the older plan that treated the PWABuilder `WKWebView`/Trusted Web Activity apps as the long-term mobile foundation. The shipped PWA wrappers can remain available while the native app is built, and some web/PWA performance work remains useful, but the final mobile product is native React Native views, not a WebView wrapper.

## Executive Summary

Charlotte Third Places should become one product with three explicit layers:

1. `packages/core`: shared TypeScript domain logic consumed by web and mobile.
2. `charlotte-third-places`: the existing Next.js web app for public web, SEO, share links, admin, and web-specific UI.
3. `mobile`: a new Expo/React Native app for iOS and Android using native mobile views for every interactive surface.

The key architectural split is not "one UI everywhere." The split is shared logic and data, platform-specific rendering.

Shared code should include types, schemas, API contracts, pure mappers, business rules, formatting, auth/session helpers, and future credits/wallet logic. It should not include React DOM components, React Native screens, Tailwind, shadcn, Next.js server APIs, Expo APIs, or direct database clients.

Web UI remains React DOM plus Tailwind/shadcn. Mobile UI is React Native components plus native modules where the platform is the right tool. The mobile app does not use `use dom`, Expo DOM Components, or WebView for Home, Random, Browse, Map, Chat, Places, Lists, Auth, Settings, Payments, Account, or any other primary interactive flow.

## Product Decision

The long-term mobile product will be built with Expo and React Native, using React Native's New Architecture from the start. Expo is not an optional wrapper in this plan; it is the mobile app platform we are choosing.

The existing Next.js app remains the public website and web product. It continues to own:

- SEO and metadata
- public place pages
- shareable list links
- featured/public community pages
- legal pages
- admin workflows
- web-specific layouts and UI
- server-side integration with Airtable, PostgreSQL, Cosmos DB, and other server-only services

The native mobile app owns:

- iOS and Android app-store experiences
- native navigation stacks and tabs
- native modal/sheet behavior
- native list performance
- native map integration
- native share sheet
- native deep links
- native push notification registration and handling
- native secure storage
- native purchase flows and entitlements
- app-like offline and repeat-launch behavior

The shared core owns the product language and rules that both clients must agree on.

## Expo Platform Decision

The mobile app will use Expo and the current Expo ecosystem as the default way to build, test, ship, and maintain the native app.

This means:

- use the latest stable Expo SDK that is appropriate when implementation begins
- use Expo Router for mobile app routing, tabs, stacks, and deep-link structure
- use Expo development builds when native modules require capabilities beyond Expo Go
- use EAS Build for iOS and Android build pipelines unless a concrete repo-specific blocker appears
- use EAS Submit or an equivalent automated release path for App Store Connect and Google Play submissions
- use Expo config plugins for native configuration where possible
- use Expo Modules or custom native modules when the app needs platform capability that is not covered by maintained Expo/community packages
- prefer libraries that support React Native's New Architecture and Expo development builds
- keep Expo Go useful for early development where possible, but do not constrain architecture to Expo Go's limits

Expo is how we get the native app done without hand-maintaining separate raw iOS and Android projects as the primary workflow. When the app needs native capability, the answer is not to fall back to WebView; the answer is to use Expo's native-extension path, a compatible native module, or a small custom native module.

## Expo And Next.js Tooling Requirements

Implementation work should use the project-local Expo agent skills and MCP servers where relevant.

The Expo skills installed under `.github/skills` are part of the planned workflow. Before implementing or changing Expo-specific areas, consult the matching skill instead of relying on memory or generic React Native assumptions.

Use the Expo skills for:

- `building-native-ui`: native UI, Expo Router patterns, navigation, tabs, headers, controls, animations, storage, media, icons, and polished mobile interaction patterns
- `expo-ui`: native SwiftUI/Jetpack Compose-backed Expo UI surfaces where standard React Native components are not the right fit
- `native-data-fetching`: mobile API calls, caching, offline behavior, React Query/SWR decisions, and Expo Router loaders
- `expo-dev-client`: development builds, native capability testing, and TestFlight development-client workflows
- `expo-deployment`: App Store, Play Store, TestFlight, production build, submit, and metadata planning
- `expo-cicd-workflows`: EAS workflow YAML, CI/CD, build automation, and deployment automation
- `expo-module`: custom Expo native modules, native views, config plugins, lifecycle hooks, and native bridge work
- `expo-observe`: startup, route, launch, update, and interaction metrics through EAS Observe
- `eas-update-insights`: EAS Update health checks, rollout health, crash rates, install/launch counts, and OTA adoption
- `upgrading-expo`: Expo SDK upgrades, React Native New Architecture changes, React 19, React Compiler, and dependency migrations
- `add-app-clip`: future iOS App Clip work, AASA files, app clips, and smart app banner flows
- `expo-brownfield`: only if a future decision requires integrating Expo into an existing native wrapper during migration
- `expo-api-routes`: only if Expo Router API routes or EAS Hosting become part of a future mobile-supporting service

The `use-dom` skill exists in the repository, but it is explicitly not part of the final mobile app architecture. Do not use it for production mobile interactive surfaces. It may be read only to understand tradeoffs or to reject WebView/DOM approaches with evidence.

The workspace MCP configuration in `.vscode/mcp.json` is also part of the planned workflow:

- Use the Expo MCP server (`expo`, `https://mcp.expo.dev/mcp`) for Expo documentation, library guidance, build information, workflows, and TestFlight-related Expo tooling when working on the mobile app.
- Use the Next.js MCP server (`next-devtools`, `next-devtools-mcp@latest`) when changing or validating the existing Next.js app, especially App Router behavior, server/client boundaries, route behavior, and development diagnostics.
- Use the Airtable MCP server only when Airtable schema/data questions are relevant and credentials are available.
- Use the Microsoft Learn MCP server for Microsoft platform documentation when Azure, Microsoft identity, or related platform behavior is relevant.
- Use the Playwright MCP server for browser-level validation of the Next.js web app when visual or interaction checks are needed.

For Expo-specific implementation, prefer the Expo MCP server and Expo skills before generic web searches. For Next.js-specific implementation, prefer the Next.js MCP server before guessing about framework behavior. The intent is to build with current Expo and Next.js guidance, not stale assumptions.

## Why This Is The Correct Split

The product goal is not merely to package the website. The goal is an iOS-first consumer app that can eventually support thousands of users, accounts, lists, social sharing, push, local/offline state, deep links, credits or subscriptions, and fast interactive surfaces that feel like a professional mobile app.

Trying to share rendering across web and mobile usually produces the wrong compromise. Web components carry web assumptions. Native screens need native gestures, navigation, scroll behavior, sheet behavior, keyboard behavior, accessibility conventions, and platform-specific performance tuning.

The correct shared layer is the domain layer:

- what a place is
- how a catalog payload is shaped
- how filters and sorts work
- what a list can contain
- who can see a list
- what a share token means
- how auth/session payloads are represented
- what account deletion must clear
- how credits, wallet balances, and entitlements work later

The correct platform-specific layer is presentation and runtime integration:

- web renders with React DOM, Tailwind, and shadcn
- mobile renders with React Native views and native modules
- web uses browser storage and server components where appropriate
- mobile uses secure storage, native app lifecycle APIs, push APIs, purchase APIs, and real-device navigation behavior

This is how "one codebase" becomes real without pretending that web and native are the same runtime.

## Final Architecture

```text
charlotte-third-places/
  packages/
    core/
      package.json
      src/
        index.ts
        places/
        lists/
        auth/
        billing/
        api/
        validation/
        formatting/
  charlotte-third-places/
    app/
    components/
    lib/
    styles/
  mobile/
    app/
    components/
    features/
    lib/
    assets/
```

The exact folder names can change during implementation, but the boundary should not.

## Shared Core

`packages/core` is a pure TypeScript package. It must be boring, deterministic, and platform-safe.

It should include:

- `Place` and place-related types
- catalog manifest and catalog payload types
- Airtable/API-to-Place pure mappers where they do not require secrets or platform APIs
- place filtering, sorting, open-now, and label helpers
- list, list-entry, share-token, report, and featured-list types
- user and auth identity types
- API request and response envelopes
- Zod schemas for input/output validation
- route and deep-link parameter schemas
- auth/session payload helpers that are safe for clients
- permission and visibility rules
- future credits, wallet, purchases, and entitlement types
- future credit math and entitlement business rules
- formatting helpers shared by web and mobile

It must not import:

- `react`
- `react-dom`
- `react-native`
- `next`
- `expo`
- Tailwind or shadcn code
- browser-only APIs such as `window`, `document`, `localStorage`, or IndexedDB directly
- native-only APIs such as secure storage or push registration directly
- server-only database clients
- server secrets or environment-specific configuration

When core needs platform behavior, it should define interfaces or pure data contracts. The web and mobile apps provide platform implementations.

## Web App Responsibilities

The existing Next.js app remains the web application. It should consume `packages/core` for shared types, schemas, API clients, and pure business logic while keeping its own React DOM UI.

The web app owns:

- App Router pages and layouts
- server components
- static rendering and ISR behavior
- Vercel deployment
- SEO metadata
- sitemap and robots behavior
- public place pages
- shareable list pages
- public/featured community list pages
- legal pages
- admin interfaces
- web-specific chat UI
- Tailwind/shadcn/Radix components
- Serwist/PWA behavior for the website
- server-side Airtable, PostgreSQL, Cosmos DB, and other secret-backed integrations

The web app should not become React Native Web as part of this plan. There is no product reason to rewrite the public website into a lowest-common-denominator UI layer.

## Mobile App Responsibilities

The mobile app is a new Expo/React Native app. Expo is the primary app framework, tooling layer, build path, and native configuration system for the mobile product.

It should consume `packages/core` for shared types, schemas, API clients, and pure business logic while rendering native mobile screens.

The mobile app owns:

- Expo Router app structure
- native stacks and tabs
- native screen transitions
- native sheets and modals
- native cards and lists
- native map surface
- native image handling and caching strategy
- native share sheet
- native deep linking and universal/app links
- native secure storage
- native push registration and notification handling
- native purchase flows through StoreKit and Google Play Billing, likely via RevenueCat
- native app lifecycle behavior
- native offline/repeat-launch behavior
- native settings and account flows

The mobile app must not use WebView or DOM components for primary interactive surfaces.

Forbidden in final mobile interactive flows:

- `WebView`
- `use dom`
- Expo DOM Components
- rendering existing Next.js pages inside the app shell
- using web routes as the mobile UI for Home, Random, Browse, Map, Chat, Places, Lists, Auth, Settings, Payments, or Account

Temporary developer prototypes may be used locally if they speed up learning, but they are not part of the product architecture and should not become production surfaces.

## React Native New Architecture

React Native's New Architecture is the modern internal runtime foundation for React Native. It is not a visual design system and it does not automatically make an app fast.

It matters because it removes older architectural bottlenecks and gives the app better primitives for high-polish native experiences.

Important pieces:

- Fabric: the newer native renderer for React Native views.
- TurboModules: the newer system for native modules, including lazy loading and better JS/native contracts.
- Codegen: generated typed bindings between JavaScript/TypeScript and native code.
- JSI: JavaScript Interface, which lets JavaScript and native/C++ objects communicate without the old serialized bridge cost.
- Concurrent React support: support for modern React scheduling features, automatic batching, transitions, Suspense-compatible patterns, and more responsive update prioritization.

Practical expectations:

- Use an Expo/React Native version where the New Architecture is supported and enabled.
- Do not opt out unless a critical dependency blocks the app and no replacement exists.
- Choose libraries that are compatible with the New Architecture.
- Treat bridge-only or poorly maintained native libraries as architecture risks.
- Profile on real iPhones, not only simulators.
- Still design screens carefully. New Architecture enables better performance patterns, but it does not replace disciplined implementation.

## Native Code And Native Modules

React Native does not mean avoiding native code forever. Native escape hatches are expected.

Shopify's five-year React Native review is especially relevant here: React Native apps can be fast, TypeScript creates leverage, shared foundations matter, and native code is still crucial. Their framing is the right one for this project: think native and React Native, not native or React Native.

Use native modules or Expo config/plugins when the platform is the right tool for:

- push notifications
- purchases and subscriptions
- app intents and shortcuts
- widgets or Live Activities later
- background work
- secure storage
- deep links and universal links
- camera/media work if it becomes performance-sensitive
- platform-specific release, signing, and store requirements

The anti-goal is not native code. The anti-goal is WebView pretending to be native for the core app experience.

## Data And API Boundary

The Expo app should not talk directly to Airtable, PostgreSQL, Cosmos DB, or any secret-backed server resource.

The backend/API layer should expose typed, mobile-safe endpoints for:

- catalog sync
- place details
- auth/session
- current user
- lists
- list entries
- saved places
- share links
- reports and moderation flows
- featured lists
- account export
- account deletion
- push token registration
- future credits/wallet/entitlements

`packages/core` defines the contracts and schemas. The Next.js app or another backend service implements server-side behavior. The Expo app consumes those APIs.

## Auth And Account State

The native app must prove auth early, before account-heavy features are deeply built.

Required proof points:

- sign in on real iOS hardware
- callback/deep-link handling
- secure token or session storage
- session refresh
- sign out
- account deletion
- local state clearing after sign out or deletion
- web and mobile user identity matching the same backend user

WorkOS/AuthKit may remain the right auth provider, but it must be validated against native mobile flows rather than assumed from the web plan.

## Lists, Sharing, And Social Surfaces

The planned user-lists work should be reframed as shared backend contracts plus separate web and native clients.

Core/shared:

- list types
- visibility rules
- list item schemas
- share token schemas
- report payload schemas
- permission helpers
- mutation contracts

Web-specific:

- public share pages
- SEO for featured/public lists
- web admin tools
- web forms and dialogs

Mobile-specific:

- native list screens
- native save-to-list flow
- native reorder and edit interactions
- native share sheet
- native report/block flows
- native offline read behavior
- native deep links into lists and places

## Billing, Credits, And Entitlements

If credits, boosts, subscriptions, paid tiers, or other paid digital functionality unlock value inside the mobile app, the architecture must be app-store-native from the beginning.

Expected direction:

- StoreKit on iOS
- Google Play Billing on Android
- RevenueCat or equivalent to unify purchases and entitlements
- shared entitlement state in the backend
- shared entitlement types and business rules in `packages/core`
- web billing handled separately but mapped to the same backend entitlement model

Do not build a web-only credit model that later has to be patched into IAP rules.

## Current PWA/WKWebView/TWA Apps

The current PWABuilder iOS app and Android TWA are interim distribution channels.

They are useful because the app already ships today. They can remain available while the native app is rebuilt properly. They should not receive major new user-owned workflows unless those workflows are built against shared backend/core contracts that the native app will also consume.

The older PWA performance work still has value for:

- today's shipped app
- the public website
- catalog generation
- local/offline web behavior
- repeat launch stability
- reusable schema and catalog contracts

But it is no longer the final mobile app strategy.

## Near-Term Implementation Order

This plan should be implemented in deliberate slices.

1. Add workspace/package structure for `packages/core`.
2. Move shared `Place` and catalog types into core.
3. Add Zod schemas for place catalog payloads and API envelopes.
4. Split pure place mappers/filtering/sorting helpers into core while keeping server-only data access in Next.js.
5. Wire the Next.js app to consume core without changing user-facing web UI.
6. Scaffold the Expo/React Native mobile app with New Architecture enabled.
7. Add native navigation, native app shell, and a minimal native Home/Random screen.
8. Add catalog sync from typed backend/core contracts.
9. Add native Place detail screen or sheet.
10. Add auth proof on real iOS hardware.
11. Add one authenticated Save-to-List vertical slice.
12. Expand native screens for Browse, Map, Chat, Lists, Settings, and account flows.
13. Add push-token registration and notification handling.
14. Add purchase sandbox flow before any paid credits/subscriptions ship.
15. Replace store binaries only after parity and real-device verification.

## First Native Vertical Slice

The first Expo slice should be small but real. It should prove the architecture, not just render a demo screen.

Target slice:

- app boots on a physical iPhone
- New Architecture is enabled
- app imports `packages/core`
- app fetches or loads a catalog using core schemas
- Home/Random renders as native RN views
- Place detail opens through native navigation or a native sheet
- native scroll and gestures feel correct
- one auth flow works on device
- one Save-to-List mutation works against the shared backend contract
- sign out clears local mobile state

This slice is the proof that the shared-core/native-views boundary works.

## Verification Gates

### Shared Core Gate

`packages/core` must build and test without importing platform code.

Fail the gate if core imports:

- React rendering packages
- Next.js
- Expo
- React Native
- Tailwind/shadcn
- browser storage APIs directly
- native storage APIs directly
- direct database clients
- server secrets

### Web Gate

The Next.js app must continue to serve:

- homepage
- place pages
- map page
- chat page
- share links
- SEO metadata
- sitemap and robots
- legal pages
- admin workflows

The web app may import core, but its UI remains React DOM/Tailwind/shadcn.

### Mobile Gate

The Expo app must render every primary interactive surface with native React Native views.

Fail the gate if final mobile flows use:

- `WebView`
- `use dom`
- Expo DOM Components
- embedded Next.js pages for primary app screens

### Real iOS Gate

Test on physical iPhones for:

- cold launch
- repeat launch
- foreground/background restore
- native stack transitions
- tabs
- sheets/modals
- scroll performance
- list virtualization
- image loading
- deep links
- auth callback
- session persistence
- sign out
- account deletion
- share sheet
- offline repeat launch
- push token registration
- purchase sandbox flow when billing exists

### Store Policy Gate

Before release, validate:

- App Store account deletion requirement
- App Store UGC report/block/contact/moderation requirements if public user content ships
- social login equivalency requirements if third-party/social login is used
- StoreKit requirements for paid digital features
- Google Play Billing requirements for paid digital features
- privacy policy and data deletion language
- reviewer demo account or demo mode

## Non-Goals

- No WebView final mobile app.
- No Expo DOM Components in mobile interactive surfaces.
- No `use dom` in the mobile app.
- No shared rendering layer across web and mobile.
- No React Native Web rewrite of the public website.
- No Capacitor or NextNative migration as the final architecture.
- No direct mobile access to Airtable, PostgreSQL, Cosmos DB, or server secrets.
- No payment architecture that ignores StoreKit or Google Play Billing for in-app digital value.
- No major new account/list/payment workflow coupled only to the current PWABuilder wrapper.

## Sources And Rationale

- Shopify Engineering, "Five years of React Native at Shopify": React Native apps can be fast, TypeScript unlocks portability, native expertise still matters, native code remains crucial, and shared foundations create leverage. https://shopify.engineering/five-years-of-react-native-at-shopify
- Shopify Engineering, "React Native is the Future of Mobile at Shopify": strategic rationale for React Native as a serious mobile platform. https://shopify.engineering/react-native-future-mobile-shopify
- React Native, "About the New Architecture": explains Fabric, TurboModules, JSI, synchronous layout/effects, concurrent renderer support, and what enabling New Architecture does and does not guarantee. https://reactnative.dev/architecture/landing-page
- Expo Router docs: native app routing and deep-link-oriented app structure. https://docs.expo.dev/router/introduction/
- React Navigation native stack docs: native stack behavior through platform-native navigation primitives. https://reactnavigation.org/docs/native-stack-navigator/
- React Native Screens docs: native screen primitives used by navigation. https://docs.swmansion.com/react-native-screens/
- Apple App Store Review Guidelines: app-like functionality, WebKit requirement for web browsing apps, account deletion, UGC, login, and in-app purchase constraints. https://developer.apple.com/app-store/review/guidelines/
- Google Play Billing docs: Play Billing requirements and backend entitlement considerations for Android digital goods. https://developer.android.com/google/play/billing
- RevenueCat React Native docs: native mobile purchase integration path for shared entitlements. https://www.revenuecat.com/docs/getting-started/installation/reactnative
