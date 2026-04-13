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
- **Branded splash screen** — custom launch screen with logo and tagline (done — `app-splash-page.png`)
- If Apple rejects, push notifications via FCM/APNs can be added to the Swift wrapper as a targeted fix (Firebase scaffolding is commented out in the iOS project, ready to enable)

---

## Phase 1: Manual Prerequisites (You Do These)

Things to set up before any code changes.

### 1.1 Create developer accounts

| Account | Cost | Status |
|---|---|---|
| Google Play Developer | $25 one-time | Done |
| Apple Developer Program | $99/year | Done |

Both can be created from any browser on any OS. No Mac required — the iOS build and upload is handled by GitHub Actions (see Phase 3.7).

### 1.2 Create store listing assets

These are needed for both stores and can be prepared in advance.

| Asset | Spec | Status |
|---|---|---|
| App icon (all sizes) | Various sizes, already generated | Done — `public/favicons/` |
| Web app manifest | JSON manifest | Done — `app/manifest.webmanifest` |
| Splash screen | Launch screen image | Done — `public/app-splash-page.png` |
| Feature graphic (Google Play) | 1024x500 PNG, landscape banner | Done — `public/logos/google-play-banner.png` |
| App icon (Apple, 1024x1024) | 1024x1024 PNG, no transparency, no rounded corners | Done — `public/logos/apple-app-icon.png` |
| Screenshots (phone) | 5 screenshots: homepage, map, chat, contribute, about | Done — `public/screenshots/` |

**Screenshots**: Take these from a real phone in mobile view. Open each page on the live site, screenshot it. These same 5 images are used for Google Play, Apple App Store, and the manifest `screenshots` field (step 2.9).

**Google Play**: Min 320px, max 3840px on any side. Use the phone screenshots as-is.

**Apple App Store**: Required for each device size. At minimum: iPhone 6.7" (1290x2796) and iPhone 6.5" (1242x2688). Take the screenshots on an iPhone that matches one of these sizes, or resize them.

### 1.3 Write store listing copy

Prepare these text assets now so they're ready at submission time.

**Short description** (Google Play, ≤80 chars):
> Discover 400+ third places in Charlotte, NC

**Full description** (both stores, ≤4000 chars):
> Charlotte Third Places is a curated directory of 400+ third places in and around Charlotte, North Carolina — cafes, coffee shops, bookstores, bakeries, libraries, and more. Third places are spots outside of home and work where you can hang out, study, read, work remotely, meet friends, or just relax.
>
> Features:
> • Browse 400+ curated places with details on Wi-Fi, parking, size, hours, and whether a purchase is required
> • Interactive map view showing every place across the Charlotte area
> • AI-powered recommendations — describe what you're looking for and get personalized suggestions
> • Filter by neighborhood, type, tags, and more
> • Real-time open/closed status based on current hours
> • Offline support — previously visited pages load without internet
>
> Built and maintained by a Charlotte resident as a free community resource. Featured in The Charlotte Observer. Open source at github.com/segunak/charlotte-third-places.

**Keywords** (Apple, 100 char limit, comma-separated):
> charlotte, third places, coffee shops, cafes, libraries, study spots, remote work, queen city

**Category**: Primary: **Lifestyle**. Secondary: **Travel**

---

## Phase 2: Local Coding

All code changes to make the site PWA-ready. All steps are done.

### 2.1 Update metadata in layout.tsx — Done

Added `applicationName: 'Charlotte Third Places'` to the metadata export. Updated `icons` paths from root-level (`/favicon.ico`, etc.) to `/favicons/` directory.

> **Note**: No `manifest` field in the metadata export. Next.js handles this automatically via the `app/manifest.webmanifest` file convention.

### 2.2 Fix viewport themeColor — Done

Changed `themeColor` from `'white'` to `'#00b2d6'` to match the manifest. This affects the status bar color when the app runs in standalone mode.

### 2.3 Install Serwist (Turbopack) — Done

Using `@serwist/turbopack` (not `@serwist/next`) because Next.js 16 defaults to Turbopack. The webpack-based `@serwist/next` package doesn't work with Turbopack builds.

```bash
npm i -D @serwist/turbopack esbuild serwist
```

### 2.4 Wrap next.config.mjs with Serwist — Done

```js
import { withSerwist } from "@serwist/turbopack";
import { withVercelToolbar } from '@vercel/toolbar/plugins/next';

// ...nextConfig...

export default withSerwist(withVercelToolbar()(nextConfig));
```

### 2.5 Create Serwist route handler at `app/serwist/[path]/route.ts` — Done

The turbopack version uses a Next.js route handler instead of a webpack plugin to build and serve the service worker. This generates `/serwist/sw.js` at build time.

```ts
import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

const revision = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout ?? crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  swSrc: "app/sw.ts",
  useNativeEsbuild: true,
});
```

### 2.6 Create the service worker at `app/sw.ts` — Done

Uses `@serwist/turbopack/worker` imports (not `@serwist/next/worker`). Includes triple-slash references for webworker types scoped to this file only.

### 2.7 Create SerwistProvider at `app/serwist-provider.ts` — Done

Client component re-exporting `SerwistProvider` from `@serwist/turbopack/react`. Added to `layout.tsx` wrapping the body content, with `swUrl="/serwist/sw.js"`.

### 2.8 Create the offline fallback page at `app/~offline/page.tsx` — Done

Client component with "You're Offline" message and a "Try Again" button that calls `window.location.reload()`.

### 2.9 Update tsconfig.json — Done

Excluded `app/sw.ts` and `public/sw.js` from type checking. The service worker file uses `/// <reference no-default-lib="true" />` which conflicts with the main tsconfig — excluding it prevents the `window is not defined` error in other files.

> **Note**: Do NOT add `"webworker"` to the main tsconfig `lib` array. The service worker gets its webworker types via triple-slash references scoped to that file only.

### 2.10 Update .gitignore — Done

Added `public/sw*` and `public/swe-worker*`.

### 2.11 Add manifest `screenshots` — Done (earlier)

Already completed. Screenshots are in `public/screenshots/` and referenced in `app/manifest.webmanifest`.

### 2.12 Build verification — Done

`npm run build` passes with Turbopack. Service worker routes generated at `/serwist/sw.js` and `/serwist/sw.js.map`.

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

Take 5 screenshots from a phone in mobile view of the live site:
1. Homepage (`/`)
2. Map (`/map`)
3. AI Chat (`/chat`)
4. Contribute (`/contribute`)
5. About (`/about`)

Done. Screenshots are in `public/screenshots/` as `home-page-screenshot.png`, `map-page-screenshot.png`, `chat-page-screenshot.png`, `contribute-page-screenshot.png`, `about-page-screenshot.png`. These same files are referenced by the manifest `screenshots` field (step 2.9) and used for both store listings.

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
5. Complete the content rating questionnaire, data safety form, target audience, and privacy policy
6. Set age rating to `13+` and target audience to `Older Users` (required for PWAs/TWAs)

> **Note on testing requirements**: Google's 14-day closed testing requirement with 12 testers only applies to **personal developer accounts created after November 13, 2023**. Since this project uses an **organization account**, the testing requirement does not apply — you can publish directly to production.

#### 3.6d Update assetlinks.json after Google re-signs

**Important**: After uploading the AAB, Google Play re-signs your app with its own key. You must update `assetlinks.json` with the new SHA-256 fingerprint:

1. Go to Google Play Console → your app → Setup → App integrity → App signing tab
2. Copy the **SHA-256 certificate fingerprint** shown there
3. Add it to `public/.well-known/assetlinks.json` (keep the original PWABuilder fingerprint too — both are needed)
4. Deploy the updated file to Vercel

Without this step, the app will show a browser address bar instead of running full-screen.

#### 3.6e Save your signing key

The PWABuilder zip contains `signing.keystore` and `signing-key-info.txt`. Keep both in a safe place — you need them to publish future updates.

### 3.7 Package and deploy iOS (Apple App Store)

No Mac required. All portal work is browser-based, and the Xcode build runs on a GitHub Actions `macos-latest` runner.

#### Prerequisites

- **Apple Developer account** ($99/year, organization) — Done
- The iOS project lives at `ios/src/` in the existing repo: `github.com/segunak/charlotte-third-places`

#### 3.7a Generate iOS package from PWABuilder — Done

The PWABuilder-generated Swift project is already in `ios/src/` with:
- Bundle ID: `com.charlottethirdplaces.app`
- Scheme: `Third Places`
- Project: `Third Places.xcodeproj` / `Third Places.xcworkspace`

#### 3.7b Customize the Swift project — Done

All customizations completed from Windows using VS Code:
- **Splash screen**: Full-bleed `app-splash-page.png` via `LaunchScreen.storyboard` (image pins to all edges, `scaleAspectFill`)
- **App category**: Changed from `productivity` to `public.app-category.lifestyle` in `Info.plist`
- **Display name**: "Third Places" (fits under the home screen icon without truncation)
- **Firebase/push notifications**: All Firebase code commented out with re-enablement instructions. Can be uncommented if needed for Apple approval.
- **Capabilities**: Push notification entitlement (`aps-environment`) commented out in `Entitlements.plist` since Firebase is disabled

#### 3.7c Apple Developer Portal setup (all browser, no Mac)

Apple requires every app to be cryptographically signed. This proves the app came from you and hasn't been tampered with. Every iOS developer — solo or Fortune 500 — must do these steps. There is no alternative.

| Artifact | What it is | Why Apple requires it |
|---|---|---|
| Bundle ID | Unique app identifier (like a domain name for your app) | Tracks your app forever across all Apple systems |
| CSR | Certificate Signing Request — proves you own a private key | Standard PKI: your key stays on your machine, Apple signs the public part |
| Distribution Certificate | Apple's proof that you're an authorized developer | Without it, iOS refuses to run your app |
| Provisioning Profile | Links your cert + Bundle ID + entitlements together | Tells iOS "this app from this developer is allowed to run with these capabilities" |
| API Key (.p8) | Allows GitHub Actions to upload builds without your Apple ID password | Automated CI/CD authentication |

**Steps:**

1. **Create Bundle ID**: [developer.apple.com](https://developer.apple.com/account/) → Identifiers → + → App IDs → `com.charlottethirdplaces.app` → enable **Associated Domains** (Push Notifications can stay disabled since Firebase is commented out) → Register

2. **Create CSR from Windows** using OpenSSL:
   ```
   openssl req -nodes -newkey rsa:2048 -keyout ios_distribution.key -out ios_distribution.csr -subj "/emailAddress=you@email.com, CN=Your Name, C=US"
   ```
   This creates two files: a private key (`ios_distribution.key` — keep this safe, never share it) and a CSR (`ios_distribution.csr` — upload this to Apple).

3. **Create Distribution Certificate**: Developer portal → Certificates → + → **Apple Distribution** → upload the `.csr` from step 2 → download the `.cer` file

4. **Convert to .p12** (GitHub Actions needs this format for code signing):
   ```
   openssl x509 -in ios_distribution.cer -inform DER -out ios_distribution.pem -outform PEM
   openssl pkcs12 -export -out ios_distribution.p12 -inkey ios_distribution.key -in ios_distribution.pem
   ```
   You'll be prompted to set a password — remember it, you'll need it as a GitHub secret.

5. **Create Provisioning Profile**: Developer portal → Profiles → + → **App Store Connect** (under Distribution) → select your Bundle ID → select the certificate from step 3 → generate → download the `.mobileprovision` file

6. **Create App Store Connect API Key**: [appstoreconnect.apple.com](https://appstoreconnect.apple.com/) → Users and Access → Integrations → App Store Connect API → + → role: **App Manager** → download the `.p8` file (**can only be downloaded once** — save it immediately). Note the **Key ID** and **Issuer ID** shown on that page.

#### 3.7d Create App Reservation on App Store Connect

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com/) → My Apps → + → New App
2. Platform: iOS
3. Name: Charlotte Third Places
4. Bundle ID: from step 3.7a
5. SKU: `charlotte-third-places-001`

#### 3.7e Store GitHub Secrets

In the `segunak/charlotte-third-places` repo, go to Settings → Secrets and variables → Actions. Add:

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

Create `.github/workflows/ios-build.yml` in `segunak/charlotte-third-places`:

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
          cd ios/src
          pod install

      - name: Build and sign IPA
        uses: yukiarrr/ios-build-action@v1.12.0
        with:
          project-path: "ios/src/Third Places.xcodeproj"
          workspace-path: "ios/src/Third Places.xcworkspace"
          p12-base64: ${{ secrets.P12_BASE64 }}
          certificate-password: ${{ secrets.P12_PASSWORD }}
          mobileprovision-base64: ${{ secrets.MOBILEPROVISION_BASE64 }}
          code-signing-identity: "Apple Distribution"
          team-id: ${{ secrets.TEAM_ID }}
          export-method: app-store
          scheme: "Third Places"
          output-path: build/App.ipa

      - name: Upload to App Store Connect
        uses: apple-actions/upload-testflight-build@v4
        with:
          app-path: build/App.ipa
          issuer-id: ${{ secrets.APPSTORE_ISSUER_ID }}
          api-key-id: ${{ secrets.APPSTORE_API_KEY_ID }}
          api-private-key: ${{ secrets.APPSTORE_API_PRIVATE_KEY }}
```

#### 3.7g Run the workflow and test

1. Go to the GitHub repo → Actions → **"Build and Upload iOS App"** → **Run workflow**
2. The runner builds the IPA on macOS and uploads it to App Store Connect via API
3. The build automatically appears in **TestFlight** on App Store Connect
4. Install **TestFlight** on your iPhone → accept the invite → test the app
5. Verify: splash screen shows, pages load, offline mode works, tabs work, safe area looks right

#### 3.7h Fill metadata and submit for review

1. On [appstoreconnect.apple.com](https://appstoreconnect.apple.com/): go to your app
2. Fill in the store listing: description, keywords, screenshots, 1024x1024 icon, category (Lifestyle), privacy policy URL
3. Under **Build**, select the TestFlight build you just tested
4. **Important**: In Signing & Capabilities, disable any capabilities the app doesn't use. Since push notifications are commented out, make sure that capability is not enabled. Apple can reject apps that declare capabilities they don't use.
5. Click **Submit for Review**
6. Review turnaround: typically 24-48 hours

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

4. **`display_override` in manifest**: Not adding this. It enables "window controls overlay" which is a desktop Chrome feature that replaces the title bar with a custom web-rendered header. Irrelevant to this project — the app targets mobile.

5. **Old favicons at root level**: Confirmed — no `favicon.ico`, `favicon-16x16.png`, or `apple-touch-icon.png` exist at `public/`. The only files at the root of `public/` are `app-splash-page.png`, `blur.jpg`, `next.svg`, and `vercel.svg`. No cleanup needed.

6. **Manifest location**: The manifest was originally at `public/favicons/site.webmanifest` and needed a manual `manifest` field in the metadata export. It's now at `app/manifest.webmanifest`, which is the Next.js App Router file convention. Next.js automatically serves it and adds the `<link rel="manifest">` tag. PWABuilder follows this link tag to find the manifest.

7. **No Mac required for iOS**: The original plan assumed a physical Mac for Xcode. The entire iOS pipeline runs from Windows: CSR creation via `openssl`, portal setup in a browser, Xcode build on a GitHub Actions `macos-latest` runner via [`yukiarrr/ios-build-action`](https://github.com/yukiarrr/ios-build-action), and upload via [`Apple-Actions/upload-testflight-build`](https://github.com/Apple-Actions/upload-testflight-build). PWABuilder's own FAQ [confirms CI services as an alternative](https://docs.pwabuilder.com/#/builder/faq?id=ios).

8. **Google Play testing requirement doesn't apply**: The 14-day closed testing with 12 testers only applies to personal developer accounts created after November 13, 2023. Organization accounts can publish to production immediately.

9. **Adjust Capabilities step missing**: PWABuilder docs require disabling unused capabilities in Xcode's Signing & Capabilities tab before submission. Apple can reject apps that declare capabilities they don't use. Since Firebase/push is commented out, the push notification capability must not be enabled.

10. **Google Play re-signing**: After uploading the AAB, Google re-signs it with their own key. The `assetlinks.json` must be updated with Google's SHA-256 fingerprint (found in Play Console → App integrity → App signing), otherwise the app shows a browser address bar.

---

## Key Links

- PWABuilder: [https://www.pwabuilder.com/](https://www.pwabuilder.com/)
- PWABuilder iOS docs: [https://docs.pwabuilder.com/#/builder/app-store](https://docs.pwabuilder.com/#/builder/app-store)
- PWABuilder Android docs: [https://docs.pwabuilder.com/#/builder/android](https://docs.pwabuilder.com/#/builder/android)
- Serwist Turbopack docs: [https://serwist.pages.dev/docs/next/turbo](https://serwist.pages.dev/docs/next/turbo)
- Lighthouse: Built into Chrome DevTools (F12 → Lighthouse tab)
- Google Play Console: [https://play.google.com/console/](https://play.google.com/console/)
- App Store Connect: [https://appstoreconnect.apple.com/](https://appstoreconnect.apple.com/)
- Apple Developer Portal: [https://developer.apple.com/account/](https://developer.apple.com/account/)
- Favicon generator (used for icons): [https://realfavicongenerator.net/](https://realfavicongenerator.net/)

## After the Apps Are Live

Follow-up tasks to do once both apps are published on the stores.

1. **Add `itunes` metadata to `layout.tsx`** — shows a native "Get the app" smart banner at the top of iOS Safari when users visit the website. Requires the App Store ID (available after the iOS app is approved).

    ```ts
    itunes: { appId: 'YOUR_APP_STORE_ID' },
    ```

2. **Add `appLinks` metadata to `layout.tsx`** — tells Facebook, Twitter, and other social crawlers about the native apps so they can deep-link to them instead of the website.

   ```ts
   appLinks: {
     ios: { url: 'https://charlottethirdplaces.com', app_store_id: 'YOUR_APP_STORE_ID' },
     android: { package: 'com.charlottethirdplaces.app', app_name: 'Charlotte Third Places' },
     web: { url: 'https://charlottethirdplaces.com', should_fallback: true },
   },
   ```

3. **Add `category` metadata to `layout.tsx`** — sets the `<meta name="category">` tag for search engine categorization.

   ```ts
   category: 'lifestyle',
   ```

---

## If Apple Rejects

If Apple rejects under Guideline 4.2, the next step is adding native push notifications to the Swift wrapper via Firebase Cloud Messaging (FCM). This requires a Firebase account (free) and modifications to the PWABuilder-generated Swift project. The notification content would be "Check out this week's featured places" — leveraging the existing `featured` boolean on places in Airtable. This is documented separately if needed.
