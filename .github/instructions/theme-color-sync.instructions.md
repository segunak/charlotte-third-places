---
name: 'Theme Color Sync'
description: 'Keep runtime UI background in sync across ThemeColorSync, globals.css --background, viewport.themeColor, and manifest theme_color. Launch/splash backgrounds (LaunchScreen.storyboard, Main.storyboard, manifest background_color) use brand cyan and are intentionally decoupled.'
applyTo: 'charlotte-third-places/components/ThemeColorSync.tsx,charlotte-third-places/styles/globals.css,charlotte-third-places/app/manifest.webmanifest,charlotte-third-places/app/layout.tsx,ios/src/Third Places/Base.lproj/LaunchScreen.storyboard,ios/src/Third Places/Base.lproj/Main.storyboard'
---

# Theme Color Synchronization

There are **two distinct color surfaces** that must be kept consistent across the web, iOS, and Android shells:

1. **Runtime UI background** — the color behind the running web app. Drives the native status bar tint (iOS WKWebView KVO on `themeColor`; Android TWA status bar). Must match the CSS `--background` variable so native chrome blends with the page.
2. **Launch / splash background** — the color shown briefly at cold-start before the WebView paints. On iOS this spans two storyboards plus the AppIcon zoom animation. On Android TWA and PWA installs this is the manifest `background_color`. Intentionally set to the brand cyan (`#00b2d6`) so the transition is seamless.

These two surfaces are **decoupled on purpose**. Do not re-couple them.

---

## Runtime UI background — keep these in sync

Value: near-white `#F3FAFC` (light) / `#0B1F22` (dark).

1. **`styles/globals.css`** — `:root { --background: ... }` and `.dark { --background: ... }`
2. **`components/ThemeColorSync.tsx`** — `LIGHT_BG` / `DARK_BG` constants
3. **`app/layout.tsx`** — `viewport.themeColor` (SSR fallback)
4. **`app/manifest.webmanifest`** — `theme_color` only (NOT `background_color`)

---

## Launch / splash background — keep these in sync

Value: brand cyan `#00b2d6` (RGB 0, 178, 214 → storyboard decimals `red="0" green="0.698" blue="0.839"`).

### Why this color?

On iOS, when a user taps the app icon, the system plays an **icon-zoom animation** — the AppIcon expands from the home screen to fill the display, then the launch screen renders. If the launch screen background matches the AppIcon background color, the zoom-to-launch transition is invisible — no jarring color flash. The same cyan is used on Android TWA for brand consistency.

### iOS cold-start sequence (5 layers)

Understanding the full iOS startup sequence is critical for a seamless splash. There are **five visual layers** that render in order. All must use the same background color, or the user sees a color flash between steps.

| Step | What renders | Where it's configured | Key detail |
|------|-------------|----------------------|------------|
| 1. **Icon zoom** | iOS system animation — AppIcon expands to fill screen | `AppIcon.appiconset` | System-controlled, cannot be changed at runtime |
| 2. **LaunchScreen.storyboard** | Static launch screen shown by iOS before app code runs | `ios/.../Base.lproj/LaunchScreen.storyboard` | `backgroundColor` on the root view; `LaunchIcon` imageView centered at 200×200pt |
| 3. **Main.storyboard root view** | The ViewController's root view, renders immediately when app code starts | `ios/.../Base.lproj/Main.storyboard` — `<color key="backgroundColor">` on view `id="8bC-Xf-vdC"` | Set to cyan explicitly (NOT `systemBackgroundColor`). KVO updates this at runtime to `themeColor` from the web page, so it adapts to light/dark mode. |
| 4. **Main.storyboard "Splash Background"** | Full-screen child view behind the loading UI | `ios/.../Base.lproj/Main.storyboard` — view `userLabel="Splash Background"` | Must have **NO explicit backgroundColor** (transparent). This view is never hidden, so if it has an opaque color it permanently paints over the root view and blocks KVO theme updates (causing a stuck status bar color). Transparent = shows root view = KVO works. |
| 5. **Main.storyboard "Loading View"** | Centered box containing `LaunchIcon` image + progress bar, visible while WKWebView loads | `ios/.../Base.lproj/Main.storyboard` — view `userLabel="Loading View"` | Logo should match LaunchScreen size (200×200pt); progress bar positioned below logo |
| 6. **Web page** | WKWebView finishes loading, `loadingView` is hidden, webview is shown | `ViewController.swift` `didFinish` handler | `view.backgroundColor` is updated via KVO to `themeColor` from the web page (near-white `#F3FAFC`) |

**Critical lessons learned:**
- The "Splash Background" view in Main.storyboard must be **transparent** (no explicit `backgroundColor`). It is never hidden at runtime — only its child "Loading View" is hidden when the page loads. If Splash Background has an opaque color, it permanently covers the root view in the status bar gap area, blocking KVO-driven theme updates. Transparent = inherits from root view = KVO works for light/dark mode.
- The **root view** (`id="8bC-Xf-vdC"`) must have an explicit cyan color (not `systemBackgroundColor` which is white). This provides the cyan during splash. After the page loads, KVO sets `view.backgroundColor = themeColor`, overriding the cyan with whatever color the web app emits (near-white for light, dark for dark mode).
- The `LaunchIcon` imageView in Main.storyboard was originally 64×64pt while LaunchScreen uses 200×200pt. Mismatched sizes cause the logo to visibly shrink between steps 2→5. Keep them the same.
- iOS storyboard `UIImageView` renders transparent PNG pixels as **white**, not as the parent view's background color. The `LaunchIcon` image (`main-logo.png`) must be **fully opaque** — flatten transparent areas by compositing onto a cyan `#00b2d6` canvas before adding to the asset catalog.
- iOS aggressively caches launch screens. After changing `LaunchScreen.storyboard`, you may need to delete the app, reboot the device, and reinstall to see changes.

### Files to update when changing the splash color

| File | What to change |
|------|---------------|
| `ios/.../Base.lproj/LaunchScreen.storyboard` | `<color key="backgroundColor" red="R" green="G" blue="B">` on the root view |
| `ios/.../Base.lproj/Main.storyboard` | `<color key="backgroundColor">` on the root view (`id="8bC-Xf-vdC"`) only. Do NOT add a color to "Splash Background" (`id="p0s-Fg-eGP"`) — it must stay transparent for KVO theme updates to work. |
| `ios/.../Assets.xcassets/LaunchIcon.imageset/main-logo.png` | Re-flatten: composite the source logo onto the new color as a solid canvas (PowerShell `System.Drawing` or equivalent). Must have zero transparency. |
| `app/manifest.webmanifest` | `background_color` value |

### Android TWA splash

Android TWA reads `background_color` from `manifest.webmanifest` at **APK build time** and bakes it into `res/` drawables. Changing the manifest value only takes effect after:
1. Merging to production and deploying via Vercel (so the live manifest is updated).
2. Going to **Google Play Console → Setup → Deep links (or TWA setup) → Create patch** to trigger a rebuild that re-ingests the manifest.
3. Rolling out the new version.

There is no way to update the Android splash without a Play Console patch + rollout.

---

## Rules

- If you change `--background` in `globals.css`, update **all runtime-UI values** to match. A mismatch causes the native status bar to be a different color than the web page.
- **Never** set `theme_color` in the manifest or `viewport.themeColor` to the splash/brand cyan — those control the running-app status bar, not the splash.
- Keep `LIGHT_BG` = `#F3FAFC` and `DARK_BG` = `#0B1F22` unless deliberately rebranding.
- If rebranding (changing the AppIcon background / primary cyan), update **all splash files** listed above, re-flatten the `main-logo.png`, and trigger both an iOS build and an Android Play Console patch.
- The iOS `LaunchIcon.imageset` must use `main-logo.png` (the opaque, cyan-background map-pin logo). On a cyan background the square edges are invisible; only the white pin shows.
- Do **not** remove `<ThemeColorSync />` from `layout.tsx` — without it the meta tag stays frozen at the SSR value and the status bar won't update on theme toggle (`next-themes` uses `attribute="class"` with `enableSystem={false}`).

---

## Deployment checklist for splash changes

### iOS
- [ ] Edit `LaunchScreen.storyboard` backgroundColor
- [ ] Edit `Main.storyboard` — root view backgroundColor AND "Splash Background" backgroundColor
- [ ] Re-flatten `main-logo.png` if the splash color changed
- [ ] Commit and push → GitHub Actions builds a new `.ipa`
- [ ] New TestFlight build appears → install and test (may need delete + reboot + reinstall due to iOS launch screen caching)
- [ ] Promote to App Store release

### Android
- [ ] Update `background_color` in `manifest.webmanifest`
- [ ] Merge to master → Vercel deploys to production
- [ ] Verify the live manifest at `https://www.charlottethirdplaces.com/manifest.webmanifest`
- [ ] Google Play Console → Setup → Deep links → **Create patch**
- [ ] Roll out new version via Play Console
