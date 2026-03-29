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

## Phase 1: Manual Prerequisites (You Do These)

Things to set up before any code changes.

### 1.1 Create developer accounts

| Account | Cost | Link |
|---|---|---|
| Google Play Developer | $25 one-time | [https://play.google.com/console/signup](https://play.google.com/console/signup) |
| Apple Developer Program | $99/year | [https://developer.apple.com/programs/enroll/](https://developer.apple.com/programs/enroll/) |

Both can be created from any browser on any OS. No Mac required — the iOS build and upload is handled by GitHub Actions (see Phase 3.7).

### 1.2 Create store listing assets

These are needed for both stores and can be prepared in advance.

| Asset | Spec | Status |
|---|---|---|
| App icon (all sizes) | Various sizes, already generated | Done — `public/favicons/` |
| Web app manifest | JSON manifest | Done — `app/manifest.webmanifest` |
| Splash screen | Launch screen image | Done — `public/app-splash-page.png` |
| Feature graphic (Google Play) | 1024x500 PNG, landscape banner | Not created |
| App icon (Apple, 1024x1024) | 1024x1024 PNG, no transparency, no rounded corners. Generate from the social media logo on a solid `#00b2d6` background | Not created |
| Screenshots (phone) | At least 4-8 showing homepage, map, place detail, AI chat | Not created |

**Screenshots**: Take these from a real phone or emulator after the PWA code is deployed (Phase 3). But the feature graphic and 1024x1024 icon can be created now.

**Google Play screenshots**: Minimum 2, ideally 4-8. Min 320px, max 3840px on any side.

**Apple App Store screenshots**: Required for each device size. At minimum: iPhone 6.7" (1290x2796) and iPhone 6.5" (1242x2688).

### 1.3 Write store listing copy

Prepare these text assets now so they're ready at submission time.

**Short description** (Google Play, ≤80 chars):
> Discover 400+ third places in Charlotte, NC

**Full description** (both stores, ≤4000 chars):
> Expand on what the app does, key features. Highlight: 400+ curated places, map view, AI recommendations, offline support.

**Keywords** (Apple, 100 char limit, comma-separated):
> charlotte, third places, coffee shops, cafes, libraries, study spots, remote work, queen city

**Category**: Primary: **Lifestyle**. Secondary: **Food & Drink** or **Travel**

---

## Phase 2: Local Coding (We Do These Together)

All code changes to make the site PWA-ready. Do these in order.

### 2.1 Update metadata in layout.tsx

The manifest file is at `app/manifest.webmanifest`. Next.js automatically detects this file convention and adds `<link rel="manifest">` to the HTML head — no manual `manifest` field needed in the metadata export.

The favicon paths in `layout.tsx` still point to the old root-level locations instead of `/favicons/`.

**Add `applicationName` to the metadata export and update `icons` paths:**

```ts
export const metadata: Metadata = {
  applicationName: 'Charlotte Third Places',
  // ...existing fields...
  icons: {
    icon: [
      { url: '/favicons/favicon.ico' },
      { url: '/favicons/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: '/favicons/apple-touch-icon.png',
  },
  // ...rest of metadata...
}
```

`applicationName` is used by PWABuilder and some browsers for the installed app name.

> **Note**: Do NOT add a `manifest` field to the metadata export. Next.js handles this automatically via the `app/manifest.webmanifest` file convention. Adding it manually would create a duplicate link tag.

### 2.2 Fix viewport themeColor mismatch

The current `viewport` export in `layout.tsx` sets `themeColor: 'white'`, but the manifest uses `#00b2d6`. When the app runs in standalone mode, the OS uses the viewport theme color for the status bar. White looks wrong against the brand color.

**Update the viewport export:**

```ts
export const viewport: Viewport = {
  themeColor: '#00b2d6',
  viewportFit: 'cover',
}
```

### 2.3 Install Serwist

Serwist is a service worker library for Next.js. It pre-caches the app shell, runtime-caches visited pages, and shows a fallback page when offline.

```bash
cd charlotte-third-places
npm i @serwist/next
npm i -D serwist
```

### 2.4 Wrap next.config.mjs with Serwist

```js
import { spawnSync } from "node:child_process";
import withSerwistInit from "@serwist/next";
import { withVercelToolbar } from '@vercel/toolbar/plugins/next';

const revision = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ?? crypto.randomUUID();

const withSerwist = withSerwistInit({
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...existing config...
};

export default withSerwist(withVercelToolbar()(nextConfig));
```

### 2.5 Create the service worker at `app/sw.ts`

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

### 2.6 Create the offline fallback page at `app/~offline/page.tsx`

A simple branded page shown when the user navigates to a page that isn't cached and they're offline. Style it to match the site's look and feel — logo, "You're offline" message, and a retry button.

### 2.7 Update tsconfig.json

Add `"webworker"` to the `lib` array, add Serwist types, and exclude the generated service worker:

```json
{
  "compilerOptions": {
    "types": ["@serwist/next/typings"],
    "lib": ["dom", "dom.iterable", "esnext", "webworker"]
  },
  "exclude": ["node_modules", "public/sw.js"]
}
```

### 2.8 Update .gitignore

The service worker is generated at build time and shouldn't be committed:

```
# Serwist
public/sw*
public/swe-worker*
```

### 2.9 Add manifest `screenshots` for richer install prompts

Modern browsers (Chrome 120+) show a richer install UI when the manifest includes `screenshots`. Add to `app/manifest.webmanifest`:

```json
"screenshots": [
  {
    "src": "/screenshots/home-narrow.png",
    "sizes": "390x844",
    "type": "image/png",
    "form_factor": "narrow",
    "label": "Homepage showing curated third places in Charlotte"
  },
  {
    "src": "/screenshots/map-narrow.png",
    "sizes": "390x844",
    "type": "image/png",
    "form_factor": "narrow",
    "label": "Map view of all places"
  }
]
```

The actual screenshot files get created in Phase 1.2 and placed in `public/screenshots/`. This step just adds the manifest entries.

### 2.10 Local build verification

The service worker only runs in production builds, not `npm run dev`. Verify locally:

```bash
npm run build
npm run start
```

Then open `http://localhost:3000` in Chrome, open DevTools → Application tab:
- Verify the service worker is registered under "Service Workers"
- Verify the manifest is detected under "Manifest"
- Check the Console for any Serwist errors

---

## Phase 3: Post-Deployment (After Pushing to Vercel)

Push all Phase 2 changes and let Vercel deploy. Then do these steps sequentially.

### 3.1 Run Lighthouse PWA audit

1. Open `https://charlottethirdplaces.com` in Chrome
2. DevTools → Lighthouse tab → check "Progressive Web App"
3. Run audit
4. All PWA checks should pass (installability, service worker, manifest)

### 3.2 Test installability

- **Android Chrome**: Visit the site → three-dot menu → "Install app" prompt should appear
- **iOS Safari**: Visit the site → share button → "Add to Home Screen" → verify it opens in standalone mode (no Safari chrome)

### 3.3 Test offline mode

1. Install the PWA on a device
2. Browse a few pages (home, a place detail, about)
3. Enable airplane mode
4. Visit a previously viewed page — should load from cache
5. Visit a new page — the `~offline` fallback should appear

### 3.4 Validate on PWABuilder

1. Go to [https://www.pwabuilder.com/](https://www.pwabuilder.com/)
2. Enter `https://charlottethirdplaces.com`
3. Verify a passing score on manifest, service worker, and security

### 3.5 Take screenshots for store listings

Now that the PWA is live, take phone screenshots for both stores:
- Homepage
- Map view
- A place detail page
- AI chat
- Save as PNGs in the sizes listed in Phase 1.2

### 3.6 Package and deploy Android (Google Play)

#### 3.6a Generate Android package from PWABuilder

1. On PWABuilder, click **"Package for stores"** → Android → **"Generate Package"**
2. Config:
   - **Package ID**: `com.charlottethirdplaces.app`
   - **App name**: Charlotte Third Places
   - **App version**: `1.0.0`
   - **Display mode**: Standalone
3. Download the zip

#### 3.6b Set up Digital Asset Links

**Do this BEFORE uploading to Play Store.** Without it, the TWA shows a URL bar.

Create `public/.well-known/assetlinks.json` with the SHA-256 fingerprint from the PWABuilder-generated package:

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

Push this file to Vercel. Verify it's accessible at `https://charlottethirdplaces.com/.well-known/assetlinks.json`.

Note: Vercel serves files from `public/.well-known/` automatically. No routing config needed.

#### 3.6c Upload to Google Play Console

1. Sign in at [https://play.google.com/console/](https://play.google.com/console/)
2. Create a new app
3. Fill in the store listing (title, description, screenshots, icon, feature graphic)
4. Upload the AAB file under **Production > Create new release**
5. Complete the content rating questionnaire and data safety form
6. **Important**: Google requires a **14-day closed testing period with 20+ testers** before production release. Set up a closed testing track first.

### 3.7 Package and deploy iOS (Apple App Store)

No Mac required. All portal work is browser-based, and the Xcode build runs on a GitHub Actions `macos-latest` runner.

#### Prerequisites

- **Apple Developer account** ($99/year) — [enroll here](https://developer.apple.com/programs/enroll/)
- A GitHub repo to host the PWABuilder-generated iOS project and the CI workflow

#### 3.7a Generate iOS package from PWABuilder

1. On PWABuilder → **"Package for stores"** → iOS → **"Generate Package"**
2. Note the **Bundle ID** (e.g. `com.charlottethirdplaces.app`)
3. Download the zip

#### 3.7b Customize the Swift project (from Windows)

1. Unzip the package
2. Edit the Swift source files in any text editor (VS Code works fine)

**Add App Review Prompt** — find the WebView controller and add:

```swift
import StoreKit

// After the WebView finishes loading, increment a counter in UserDefaults.
// After 3 launches:
if launchCount >= 3 {
    SKStoreReviewController.requestReview()
}
```

**Set the splash image** — replace the image asset in `Assets.xcassets` with `app-splash-page.png`. The `.xcassets` folder is just a directory of JSON + image files, editable without Xcode. If the `LaunchScreen.storyboard` needs changes, it's an XML file that can be edited in a text editor.

3. Push the entire unzipped project to a GitHub repo (e.g. `charlotte-third-places-ios`)

#### 3.7c Apple Developer Portal setup (all browser, no Mac)

1. **Create Bundle ID**: [developer.apple.com](https://developer.apple.com/account/) → Identifiers → + → App IDs → enter Bundle ID → enable Associated Domains → Register

2. **Create CSR from Windows** using OpenSSL (no Keychain Access needed):
   ```
   openssl req -nodes -newkey rsa:2048 -keyout ios_distribution.key -out ios_distribution.csr -subj "/emailAddress=you@email.com, CN=Your Name, C=US"
   ```

3. **Create Distribution Certificate**: Developer portal → Certificates → + → Apple Distribution → upload the `.csr` from step 2 → download the `.cer` file

4. **Convert to .p12** (needed for GitHub Actions signing):
   ```
   openssl x509 -in ios_distribution.cer -inform DER -out ios_distribution.pem -outform PEM
   openssl pkcs12 -export -out ios_distribution.p12 -inkey ios_distribution.key -in ios_distribution.pem
   ```
   You'll set a password — remember it, you'll need it as a GitHub secret.

5. **Create Provisioning Profile**: Developer portal → Profiles → + → App Store Connect → select Bundle ID → select the certificate → generate → download the `.mobileprovision` file

6. **Create App Store Connect API Key**: [appstoreconnect.apple.com](https://appstoreconnect.apple.com/) → Users and Access → Integrations → App Store Connect API → + → role: **App Manager** → download the `.p8` file (can only be downloaded once). Note the **Key ID** and **Issuer ID**.

#### 3.7d Create App Reservation on App Store Connect

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com/) → My Apps → + → New App
2. Platform: iOS
3. Name: Charlotte Third Places
4. Bundle ID: from step 3.7a
5. SKU: `charlotte-third-places-001`

#### 3.7e Store GitHub Secrets

In the GitHub repo from step 3.7b, go to Settings → Secrets and variables → Actions. Add:

| Secret name | Value |
|---|---|
| `P12_BASE64` | Base64-encoded `.p12` file: `openssl base64 -in ios_distribution.p12 -A` |
| `P12_PASSWORD` | The password you set when creating the `.p12` |
| `MOBILEPROVISION_BASE64` | Base64-encoded `.mobileprovision`: `openssl base64 -in profile.mobileprovision -A` |
| `APPSTORE_API_PRIVATE_KEY` | Contents of the `.p8` file |
| `APPSTORE_API_KEY_ID` | Key ID from App Store Connect |
| `APPSTORE_ISSUER_ID` | Issuer ID from App Store Connect |
| `TEAM_ID` | Your Apple Developer Team ID (found in Membership details) |

> **Note on Windows**: If `openssl base64 -A` isn't available, use PowerShell:
> ```powershell
> [Convert]::ToBase64String([IO.File]::ReadAllBytes("ios_distribution.p12"))
> ```

#### 3.7f Create GitHub Actions workflow

Create `.github/workflows/ios-build.yml` in the iOS repo:

```yaml
name: Build and Upload iOS App

on:
  workflow_dispatch: # Manual trigger

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install CocoaPods dependencies
        run: |
          cd src
          pod install

      - name: Build and sign IPA
        uses: yukiarrr/ios-build-action@v1.12.0
        with:
          project-path: src/YourProject.xcodeproj
          workspace-path: src/YourProject.xcworkspace
          p12-base64: ${{ secrets.P12_BASE64 }}
          certificate-password: ${{ secrets.P12_PASSWORD }}
          mobileprovision-base64: ${{ secrets.MOBILEPROVISION_BASE64 }}
          code-signing-identity: "Apple Distribution"
          team-id: ${{ secrets.TEAM_ID }}
          export-method: app-store
          scheme: YourScheme
          output-path: build/App.ipa

      - name: Upload to App Store Connect
        uses: apple-actions/upload-testflight-build@v4
        with:
          app-path: build/App.ipa
          issuer-id: ${{ secrets.APPSTORE_ISSUER_ID }}
          api-key-id: ${{ secrets.APPSTORE_API_KEY_ID }}
          api-private-key: ${{ secrets.APPSTORE_API_PRIVATE_KEY }}
```

Replace `YourProject` and `YourScheme` with the actual names from the PWABuilder-generated Xcode project.

#### 3.7g Run the workflow and submit

1. Go to the GitHub repo → Actions → "Build and Upload iOS App" → **Run workflow**
2. The runner builds the IPA on macOS and uploads it to App Store Connect via API
3. On [appstoreconnect.apple.com](https://appstoreconnect.apple.com/): fill metadata (description, keywords, screenshots, icon, category) → select the build → **Submit for Review**
4. Review turnaround: 24-48 hours

#### 3.7h Test on a real device

The upload goes to TestFlight automatically. Install TestFlight on an iPhone, accept the invite, and test the app before submitting for App Store review.

#### How this works without a Mac

| Step | Runs on |
|---|---|
| Apple portal setup (Bundle ID, certs, profiles) | Browser (any OS) |
| CSR + .p12 creation | `openssl` on Windows |
| Swift code edits (review prompt, splash) | Text editor on Windows |
| Xcode build + signing | GitHub Actions `macos-latest` runner |
| Upload to App Store Connect | GitHub Actions via API |
| App Store Connect metadata + submit | Browser (any OS) |
| Testing the app | TestFlight on a physical iPhone |

---

## Things the Original Plan Was Missing

1. **Viewport `themeColor` mismatch**: `layout.tsx` has `themeColor: 'white'` but the manifest uses `#00b2d6`. In standalone mode the OS uses the viewport value for the status bar, so white looks wrong. Fixed in step 2.2.

2. **Manifest `screenshots` field**: Chrome 120+ shows a richer install UI (app-store-like bottom sheet with screenshots) when the manifest has a `screenshots` array. Without it, users get the minimal "Add to home screen" bar. Added in step 2.9.

3. **Local build verification step**: The service worker only generates during `npm run build`, not `npm run dev`. Without testing a production build locally first, you'd only discover issues after deploying. Added in step 2.10.

4. **`display_override` in manifest**: Could add `"display_override": ["standalone", "window-controls-overlay"]` for progressive enhancement on desktop. Not critical for mobile app stores — optional future improvement.

5. **Old favicons at root level**: The root `/favicon.ico`, `/favicon-16x16.png`, and `/apple-touch-icon.png` referenced in the current `layout.tsx` may or may not exist. After updating paths to `/favicons/`, the old root files become dead weight. Cleaning them up is optional but tidy.

6. **Manifest location**: The manifest was originally at `public/favicons/site.webmanifest` and needed a manual `manifest` field in the metadata export. It's now at `app/manifest.webmanifest`, which is the Next.js App Router file convention. Next.js automatically serves it and adds the `<link rel="manifest">` tag. PWABuilder follows this link tag to find the manifest.

7. **No Mac required for iOS**: The original plan assumed a physical Mac for Xcode. The entire iOS pipeline can run from Windows: CSR creation via `openssl`, portal setup in a browser, Xcode build on a GitHub Actions `macos-latest` runner via [`yukiarrr/ios-build-action`](https://github.com/yukiarrr/ios-build-action), and upload via [`Apple-Actions/upload-testflight-build`](https://github.com/Apple-Actions/upload-testflight-build). PWABuilder's own FAQ [confirms this approach](https://docs.pwabuilder.com/#/builder/faq?id=ios).

---

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
