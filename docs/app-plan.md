# Charlotte Third Places — Mobile App Plan

Turn the existing Next.js website into an iOS and Android app using PWA + PWABuilder. No custom native code required for the initial release.

## Approach

Wrap the live website (`charlottethirdplaces.com`) in native app shells using PWABuilder. The website loads inside a WebView (iOS) or Trusted Web Activity (Android). All existing functionality — SSR, ISR, API routes, AI chat — continues working because the app loads the live URL.

### Why This Approach

- The site is SSR with ISR, API routes, and server components. Converting to a static export (required by Capacitor/Tauri) would break all of that.
- PWABuilder generates native wrapper projects from a PWA-enabled website. Google Play uses TWA (Chrome running the PWA full-screen). Apple App Store uses a Swift/WKWebView wrapper.
- Google Play approval is straightforward. Apple App Store is a gamble but the app has real content (404+ places, map, AI chat, filtering) which helps.

### Apple App Store Risks

Apple rejects apps under Guideline 4.2 (Minimum Functionality) if they're "just a website in a WebView." To improve approval odds:

- **Offline mode** via Serwist service worker — cached pages work without network
- **App Review Prompt** — native iOS `SKStoreReviewController` dialog after a few app launches
- **Branded splash screen** — custom launch screen with logo and tagline
- If Apple rejects, push notifications via FCM/APNs can be added to the Swift wrapper as a targeted fix

---

## Step 1: Link Manifest and Update Favicon Paths in layout.tsx

The web app manifest at `public/favicons/site.webmanifest` is already complete. The favicon images are generated and in `public/favicons/`. Two things remain:

### 1a. Add manifest link to layout.tsx

The manifest file exists but isn't linked from the page. Add it to the `metadata` export in `app/layout.tsx`:

```ts
// In the metadata export, add:
manifest: '/favicons/site.webmanifest',
```

### 1b. Update favicon paths in layout.tsx metadata

The current `icons` field in metadata still points to old paths. Update to point to the `/favicons/` directory:

```ts
icons: {
  icon: [
    { url: '/favicons/favicon.ico' },
    { url: '/favicons/favicon.svg', type: 'image/svg+xml' },
    { url: '/favicons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
  ],
  apple: '/favicons/apple-touch-icon.png',
},
```

### 1c. Add `applicationName` to metadata

```ts
applicationName: 'Charlotte Third Places',
```

This field is used by PWABuilder and some browsers for the installed app name.

---

## Step 2: Set Up Serwist for Offline Support

Serwist is a service worker library for Next.js that handles offline caching automatically. It pre-caches the app shell, runtime-caches visited pages, and shows a fallback page when offline.

### 2a. Install dependencies

```bash
cd charlotte-third-places
npm i @serwist/next
npm i -D serwist
```

### 2b. Wrap next.config.mjs with Serwist

Update `next.config.mjs` to wrap the config with `withSerwist`:

```js
import { spawnSync } from "node:child_process";
import withSerwistInit from "@serwist/next";

const revision = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ?? crypto.randomUUID();

const withSerwist = withSerwistInit({
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});

// Wrap existing config with withSerwist
export default withSerwist(withVercelToolbar()(nextConfig));
```

### 2c. Create the service worker at `app/sw.ts`

```ts
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
```

### 2d. Create the offline fallback page at `app/~offline/page.tsx`

A simple page shown when the user navigates to a page that isn't cached and they're offline. Style it to match the site's look and feel.

### 2e. Update tsconfig.json

Add to `compilerOptions`:

```json
{
  "compilerOptions": {
    "types": ["@serwist/next/typings"],
    "lib": ["webworker"]
  },
  "exclude": ["public/sw.js"]
}
```

### 2f. Update .gitignore

Add:

```
# Serwist
public/sw*
public/swe-worker*
```

---

## Step 3: Validate PWA

### 3a. Deploy to Vercel

Push the changes from steps 1-2 and let Vercel deploy.

### 3b. Run Lighthouse PWA Audit

1. Open `https://charlottethirdplaces.com` in Chrome
2. Open DevTools → Lighthouse tab
3. Check "Progressive Web App" category
4. Run audit
5. Verify all PWA checks pass (installability, service worker, manifest)

### 3c. Test Installability

- **Android Chrome**: Visit the site → tap the three-dot menu → "Add to Home Screen" or "Install app" prompt should appear
- **iOS Safari**: Visit the site → tap the share button → "Add to Home Screen" → verify it opens in standalone mode (no Safari chrome)

### 3d. Test Offline Mode

1. Install the PWA on a device
2. Browse a few pages (home, a place detail, about)
3. Enable airplane mode
4. Navigate to a previously visited page — it should load from cache
5. Navigate to a new page — the `~offline` fallback should appear

### 3e. Validate on PWABuilder

1. Visit [https://www.pwabuilder.com/](https://www.pwabuilder.com/)
2. Enter `https://charlottethirdplaces.com`
3. PWABuilder will scan the manifest, service worker, and security
4. Verify a passing score — this is the same tool used in steps 4 and 5 to generate the native packages

---

## Step 4: Package for Google Play (Android)

Google Play uses a Trusted Web Activity (TWA) — Chrome running the PWA full-screen without a URL bar. Effectively zero issues getting approved.

### 4a. Generate Android package from PWABuilder

1. On [https://www.pwabuilder.com/](https://www.pwabuilder.com/), after validating the URL, click **"Package for stores"**
2. Select **"Generate Package"** under the Android section
3. Configure the package metadata:
   - **Package ID**: `com.charlottethirdplaces.app` (or similar)
   - **App name**: Charlotte Third Places
   - **App version**: `1.0.0`
   - **Display mode**: Standalone
4. Click **"Download Package"** — this gives you a zip with a ready-to-build Android project

### 4b. Set up Digital Asset Links

**This must be done BEFORE the first Play Store upload.** If you skip this, users will see a URL bar in the app (the TWA won't trust your domain).

Create `public/.well-known/assetlinks.json` with the SHA-256 fingerprint of your signing key. PWABuilder provides this fingerprint in the generated package. The file format:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.charlottethirdplaces.app",
      "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT_FROM_PWABUILDER"]
    }
  }
]
```

Deploy this file to Vercel so it's accessible at `https://charlottethirdplaces.com/.well-known/assetlinks.json`.

### 4c. Upload to Google Play Console

1. Sign in at [https://play.google.com/console/](https://play.google.com/console/)
   - Requires a Google Play Developer account — **$25 one-time fee** to register at [https://play.google.com/console/signup](https://play.google.com/console/signup)
2. Create a new app
3. Fill in the store listing: title, description, screenshots, icon, feature graphic
4. Upload the AAB file from the PWABuilder-generated package under **Production > Create new release**
5. Complete the content rating questionnaire and data safety form
6. **Important**: Google requires a **14-day closed testing period with 20+ testers** before you can release to production. Set up a closed testing track first.

### 4d. Store Listing Assets Needed

- **App icon**: 512x512 PNG (use `public/favicons/web-app-manifest-512x512.png`)
- **Feature graphic**: 1024x500 PNG (landscape banner shown at top of store listing — needs to be created)
- **Screenshots**: At least 2, ideally 4-8, showing the homepage, map view, place detail, AI chat. Take these from a phone or emulator. Minimum 320px, maximum 3840px on any side.
- **Short description**: ≤80 characters. e.g. "Discover 400+ third places in Charlotte, NC"
- **Full description**: ≤4000 characters. Expand on what the app does, features, etc.

---

## Step 5: Package for Apple App Store (iOS)

PWABuilder generates a Swift project with WKWebView that loads the live website. Additional native features are added in Xcode.

### 5a. Prerequisites

- **macOS computer** with Xcode installed (supports iOS 17+)
- **Apple Developer account** — **$99/year** to register at [https://developer.apple.com/programs/enroll/](https://developer.apple.com/programs/enroll/)

### 5b. Generate iOS package from PWABuilder

1. On [https://www.pwabuilder.com/](https://www.pwabuilder.com/), click **"Package for stores"**
2. Select **"Generate Package"** under the iOS section
3. Note the **Bundle ID** (e.g. `com.charlottethirdplaces.app`) — you'll need this later
4. Click **"Download Package"**

### 5c. Build the iOS project

1. Unzip the downloaded package
2. Open a terminal in the `src` directory
3. Run `pod install` (install CocoaPods first with `brew install cocoapods` if needed)
4. Open the `.xcworkspace` file in Xcode (not the `.xcodeproj`)
5. Click **Product > Build** to verify it compiles
6. Click ▶️ to test in the iPhone simulator

### 5d. Add App Review Prompt

In the Swift project, find the view controller that loads the WebView. Add:

```swift
import StoreKit

// After the WebView has finished loading (e.g., in webView didFinish navigation):
// Increment a counter in UserDefaults, and after 3 launches:
if launchCount >= 3 {
    SKStoreReviewController.requestReview()
}
```

This shows the native iOS "Rate this app" dialog. Apple's system rate-limits it automatically.

### 5e. Set the splash/launch screen

Replace the default launch screen in the Xcode project with `app-splash-page.png`. In Xcode:

1. Open `Assets.xcassets`
2. Add the splash page image
3. Update the `LaunchScreen.storyboard` to use your image (or replace it entirely with a launch image set)

### 5f. Create Bundle ID on Apple Developer portal

1. Go to [https://developer.apple.com/account/](https://developer.apple.com/account/)
2. Select **Certificates, Identifiers & Profiles**
3. Select **Identifiers** → click **+**
4. Select **App IDs** → **App** type
5. Enter a description and the Bundle ID from step 5b
6. Enable **Associated Domains** capability
7. Click **Continue** → **Register**

### 5g. Create a Certificate Signing Request (CSR)

1. Open **Keychain Access** on Mac
2. Menu: **Keychain Access > Certificate Assistant > Request a Certificate from a Certificate Authority**
3. Enter your email and name, select **Saved to disk**
4. Save the `.certSigningRequest` file

### 5h. Create a Distribution Certificate

1. Back on [https://developer.apple.com/account/](https://developer.apple.com/account/) → **Certificates, Identifiers & Profiles**
2. Select **Certificates** → click **+**
3. Select **Apple Distribution** → **Continue**
4. Upload the CSR from the previous step
5. Download the `.cer` file
6. Double-click it to install in Keychain Access

### 5i. Create a Provisioning Profile

1. On the Apple Developer portal → **Profiles** → click **+**
2. Select **App Store Connect** under Distribution
3. Select the Bundle ID from step 5f
4. Select the certificate from step 5h
5. Name the profile and click **Generate**
6. Download the `.mobileprovision` file

### 5j. Configure Xcode signing

1. In Xcode, select the project in the navigator
2. Go to **Build Settings > Signing**
3. Set **Code Signing Identity (Release)** to **Apple Distribution**
4. Set **Code Signing Style (Release)** to **Manual**
5. Set **Development Team (Release)** to your Apple Developer team
6. Go to **Signing & Capabilities > Release** and select the provisioning profile

### 5k. Create App Reservation on App Store Connect

1. Go to [https://appstoreconnect.apple.com/](https://appstoreconnect.apple.com/)
2. Select **My Apps** → click **+** → **New App**
3. Platform: **iOS**
4. Name: **Charlotte Third Places**
5. Select the Bundle ID from step 5f
6. SKU: any unique string (e.g. `charlotte-third-places-001`)
7. Click **Create**

### 5l. Upload the app

1. In Xcode, select **Any iOS Device (arm64)** as the build target
2. Select **Product > Archive**
3. When archiving completes, select **Distribute App > App Store Connect > Upload**
4. Follow the prompts

### 5m. Submit for review

1. Go to [https://appstoreconnect.apple.com/](https://appstoreconnect.apple.com/) → your app
2. Fill in metadata: description, keywords, screenshots, app icon, category
3. Under **Build**, select the archive you just uploaded
4. Click **Submit for Review**
5. Typical review turnaround is 24-48 hours

### 5n. App Store Listing Assets Needed

- **App icon**: 1024x1024 PNG, no transparency, no rounded corners (iOS applies its own mask). Generate from the social media logo on a solid `#00b2d6` background.
- **Screenshots**: Required for each device size you support. At minimum, iPhone 6.7" display (1290x2796) and iPhone 6.5" display (1242x2688). Take screenshots of homepage, map view, place detail, AI chat.
- **Description**: What the app does, key features. Highlight: 400+ curated places, map view, AI recommendations, offline support.
- **Keywords**: charlotte, third places, coffee shops, cafes, libraries, study spots, remote work, queen city (100 character limit, comma-separated)
- **Category**: Primary: **Lifestyle**. Secondary: **Food & Drink** or **Travel**
- **Splash screen**: `app-splash-page.png` (already created)

---

## Asset Checklist

| Asset | Status | Location |
|---|---|---|
| App icon (favicons, all sizes) | Done | `public/favicons/` |
| Web app manifest | Done | `public/favicons/site.webmanifest` |
| Splash screen | Done | `public/app-splash-page.png` |
| Feature graphic (Google Play, 1024x500) | Not created | Needed for Play Store listing |
| Screenshots (phone) | Not created | Take from live site on mobile device |
| `assetlinks.json` (Android TWA) | Not created | Create after PWABuilder generates the fingerprint |

## Account Requirements

| Account | Cost | Link |
|---|---|---|
| Google Play Developer | $25 one-time | [https://play.google.com/console/signup](https://play.google.com/console/signup) |
| Apple Developer Program | $99/year | [https://developer.apple.com/programs/enroll/](https://developer.apple.com/programs/enroll/) |

## Key Links

- PWABuilder: [https://www.pwabuilder.com/](https://www.pwabuilder.com/)
- PWABuilder iOS docs: [https://docs.pwabuilder.com/#/builder/app-store](https://docs.pwabuilder.com/#/builder/app-store)
- PWABuilder Android docs: [https://docs.pwabuilder.com/#/builder/android](https://docs.pwabuilder.com/#/builder/android)
- Serwist Next.js docs: [https://serwist.pages.dev/docs/next/getting-started](https://serwist.pages.dev/docs/next/getting-started)
- Lighthouse: Built into Chrome DevTools (F12 → Lighthouse tab)
- Google Play Console: [https://play.google.com/console/](https://play.google.com/console/)
- App Store Connect: [https://appstoreconnect.apple.com/](https://appstoreconnect.apple.com/)
- Apple Developer Portal: [https://developer.apple.com/account/](https://developer.apple.com/account/)
- Favicon generator (used for icons): [https://realfavicongenerator.net/](https://realfavicongenerator.net/)

## If Apple Rejects

If Apple rejects under Guideline 4.2, the next step is adding native push notifications to the Swift wrapper via Firebase Cloud Messaging (FCM). This requires a Firebase account (free) and modifications to the PWABuilder-generated Swift project. The notification content would be "Check out this week's featured places" — leveraging the existing `featured` boolean on places in Airtable. This is documented separately if needed.
