---
name: 'Theme Color Sync'
description: 'Keep runtime UI background in sync across ThemeColorSync, globals.css --background, viewport.themeColor, and manifest theme_color. Launch/splash backgrounds (LaunchScreen.storyboard, manifest background_color) use brand cyan and are intentionally decoupled.'
applyTo: 'charlotte-third-places/components/ThemeColorSync.tsx,charlotte-third-places/styles/globals.css,charlotte-third-places/app/manifest.webmanifest,charlotte-third-places/app/layout.tsx,ios/src/Third Places/Base.lproj/LaunchScreen.storyboard'
---

# Theme Color Synchronization

There are **two distinct color surfaces** that must be kept consistent across the web, iOS, and Android shells:

1. **Runtime UI background** — the color behind the running web app. Drives the native status bar tint (iOS WKWebView KVO — Key-Value Observing — on `themeColor`; Android TWA — Trusted Web Activity — status bar). Must match the CSS `--background` variable so native chrome blends with the page.
2. **Launch / splash background** — the color shown briefly at cold-start, before the WebView paints. On iOS this is `LaunchScreen.storyboard`; on Android TWA and PWA installs this is the manifest `background_color`. Intentionally set to the brand cyan (`#00b2d6`) so the iOS AppIcon-to-launch-screen zoom transition is seamless and Android splash is brand-consistent.

These two surfaces are **decoupled on purpose**. Do not re-couple them.

## Runtime UI background — keep these in sync

Value: near-white `#F3FAFC` (light) / `#0B1F22` (dark).

1. **`styles/globals.css`**
   - `:root { --background: ... }` (light theme)
   - `.dark { --background: ... }` (dark theme)
2. **`components/ThemeColorSync.tsx`**
   - `LIGHT_BG` constant = hex of light `--background`
   - `DARK_BG` constant = hex of dark `--background`
3. **`app/layout.tsx`**
   - `viewport.themeColor` = hex of light `--background` (SSR — Server-Side Rendering — fallback)
4. **`app/manifest.webmanifest`**
   - `theme_color` = hex of light `--background` (NOT `background_color` — that's the splash color)

## Launch / splash background — keep these in sync

Value: brand cyan `#00b2d6` (RGB 0, 178, 214 → storyboard decimals 0, 0.698, 0.839). Matches the AppIcon background so the iOS icon-zoom flash blends into the launch screen.

1. **`ios/src/Third Places/Base.lproj/LaunchScreen.storyboard`**
   - `<color key="backgroundColor" red="0" green="0.698" blue="0.839" ...>` = RGB decimals of `#00b2d6`
2. **`app/manifest.webmanifest`**
   - `background_color` = `#00b2d6` (Android TWA splash + PWA install splash)

## Rules

- If you change `--background` in `globals.css`, update **all runtime-UI values** in the first section to the matching hex. A mismatch causes the native status bar area to be a different color than the web page background.
- If you change the `LIGHT_BG` / `DARK_BG` constants in `ThemeColorSync.tsx`, update `--background` in `globals.css` and the other runtime-UI files to match.
- **Never** set `theme_color` in the manifest to the splash cyan — it controls the running-app status bar, not the launch splash.
- **Never** set `viewport.themeColor` to the primary/brand color — same reason.
- Keep `LIGHT_BG` = hsl(190 60% 97%) ≈ `#F3FAFC` and `DARK_BG` = hsl(190 50% 9%) ≈ `#0B1F22` unless deliberately rebranding.
- If you rebrand (change the AppIcon background / primary cyan), update **both splash values** (storyboard RGB decimals and manifest `background_color`) to the new hex.
- The iOS launch screen image (`LaunchIcon.imageset`) uses `main-logo.png` (cyan square + white map-pin), not the detailed wordmark — the cyan square blends into the cyan launch background and only the pin shows.
- Do **not** remove `<ThemeColorSync />` from `layout.tsx` — without it the meta tag stays frozen at the SSR value and the status bar won't update when the user toggles dark mode via the in-app theme switch (`next-themes` uses `attribute="class"` with `enableSystem={false}`, so OS `prefers-color-scheme` media queries do not apply here).
- After changing `background_color` in `manifest.webmanifest`, the Android TWA splash only updates after a Play Console "Create patch" rollout that re-ingests the manifest.
