---
name: 'Theme Color Sync'
description: 'Keep runtime UI background in sync across ThemeColorSync, globals.css --background, viewport.themeColor, manifest.webmanifest, and splash backgrounds. Use when: changing theme colors, splash screens, or native wrapper backgrounds.'
applyTo: 'web/components/ThemeColorSync.tsx,web/styles/globals.css,web/app/manifest.webmanifest,web/app/layout.tsx,ios/src/Third Places/Base.lproj/LaunchScreen.storyboard,ios/src/Third Places/Base.lproj/Main.storyboard'
---

# Theme Color Synchronization

## Core Concept: Two Color Surfaces

There are two distinct color surfaces across web, iOS, and Android. They are **decoupled on purpose**.

1. **Runtime UI background** — the color behind the running web app. Drives the native status bar tint via iOS WKWebView KVO on `themeColor` and Android TWA. Must match the CSS `--background` variable so native chrome blends with the page.

2. **Launch / splash background** — the brief color at cold-start before the WebView paints. Should match the runtime light-mode background to avoid color flashes when the web page loads.

## Runtime UI background — what to keep in sync

If you change `--background` in `globals.css`, update **all** of these to the same value:

- `globals.css` — `:root { --background }` and `.dark { --background }`
- `ThemeColorSync.tsx` — `LIGHT_BG` and `DARK_BG` constants
- `layout.tsx` — `viewport.themeColor` (SSR fallback)
- `manifest.webmanifest` — `theme_color` only (NOT `background_color`)

A mismatch causes the native status bar to be a different color than the page.

## Launch / splash background — what to keep in sync

If you change the splash color, update **all** of these:

- `LaunchScreen.storyboard` — root view `backgroundColor`
- `Main.storyboard` — root view `backgroundColor` only
- `manifest.webmanifest` — `background_color`
- `LaunchIcon.imageset/main-logo.png` — re-flatten the transparent source logo onto the new color

## iOS Splash Architecture (hard-won knowledge)

These principles are critical and were discovered through painful iteration:

- **iOS has TWO storyboards in sequence**: `LaunchScreen.storyboard` (system-shown before app code runs) → `Main.storyboard` (app loading view with progress bar while WebView loads) → web page. Both need matching background colors.
- **Main.storyboard "Splash Background" view must have NO explicit backgroundColor.** This view is never hidden at runtime. If it has an opaque color, it permanently paints over the root view in the status bar gap, blocking KVO-driven theme updates (stuck status bar color). Keep it transparent so the root view shows through.
- **KVO handles runtime color changes.** The root view's `backgroundColor` starts as the splash color, then `ViewController.swift` updates it via KVO (`view.backgroundColor = themeColor`) when the web page's `<meta name="theme-color">` changes. This is how light/dark mode adaptation works.
- **iOS UIImageView in storyboards renders transparent PNG pixels as WHITE**, not as the parent view's background color. Any logo used in a storyboard must be fully opaque — flatten transparent areas onto the splash background color. A pre-flattened version is kept at `public/logos/main-logo-off-white-background.png`.
- **iOS aggressively caches launch screens.** After changing `LaunchScreen.storyboard`, you may need to delete the app, reboot the device, and reinstall to see changes.
- **Don't use `systemBackgroundColor`** for the root view — it's pure white `#FFFFFF`, which differs from the app's near-white theme background.

## Android TWA Splash

Android TWA reads `background_color` from `manifest.webmanifest` at **APK build time** and bakes it into drawables. Changes only take effect after merging to production, then doing a Play Console "Create patch" to rebuild the TWA.

## Rules

- **Never** set `theme_color` or `viewport.themeColor` to a brand/accent color — they control the running-app status bar, not the splash.
- **Don't remove `<ThemeColorSync />`** from `layout.tsx` — without it the meta tag stays frozen at the SSR value and the status bar won't update on theme toggle.
- `next-themes` uses `attribute="class"` with `enableSystem={false}`, so OS `prefers-color-scheme` media queries don't apply. Theme switching is JS-driven only.
