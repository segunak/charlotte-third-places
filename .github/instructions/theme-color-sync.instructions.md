---
name: 'Theme Color Sync'
description: 'Keep ThemeColorSync, globals.css --background, viewport.themeColor, manifest theme_color, and LaunchScreen.storyboard consistent so the native iOS/Android status bar tint matches the web page background.'
applyTo: 'charlotte-third-places/components/ThemeColorSync.tsx,charlotte-third-places/styles/globals.css,charlotte-third-places/app/manifest.webmanifest,charlotte-third-places/app/layout.tsx,ios/src/Third Places/Base.lproj/LaunchScreen.storyboard'
---

# Theme Color Synchronization

The native iOS wrapper (`ios/src/Third Places/ViewController.swift`) uses KVO (Key-Value Observing — Apple's Foundation API that notifies observers when a property on an object changes) to watch `WKWebView.themeColor` and tints the status bar area to match the `<meta name="theme-color">` value emitted by the web app. Android TWA (Trusted Web Activity — Chrome's wrapper that lets a Progressive Web App run as a full-screen Android app) does the same. The iOS launch screen (`LaunchScreen.storyboard`) also uses the same background color so the splash-to-web transition is seamless. This means five values **must stay in sync** with the `--background` CSS (Cascading Style Sheets) variable:

1. **`styles/globals.css`**
   - `:root { --background: ... }` (light theme)
   - `.dark { --background: ... }` (dark theme)
2. **`components/ThemeColorSync.tsx`**
   - `LIGHT_BG` constant = hex of light `--background`
   - `DARK_BG` constant = hex of dark `--background`
3. **`app/layout.tsx`**
   - `viewport.themeColor` = hex of light `--background` (SSR fallback)
4. **`app/manifest.webmanifest`**
   - `theme_color` and `background_color` = hex of light `--background`
5. **`ios/src/Third Places/Base.lproj/LaunchScreen.storyboard`**
   - `<color key="backgroundColor" red="R" green="G" blue="B">` = RGB decimals of light `--background` (0.953, 0.980, 0.988 for `#F3FAFC`)

## Rules

- If you change `--background` in `globals.css`, update **all** of the values above to the matching hex. A mismatch causes the native status bar area to be a different color than the web page background.
- If you change the `LIGHT_BG` / `DARK_BG` constants in `ThemeColorSync.tsx`, update `--background` in `globals.css` and the other two files to match.
- Do **not** set `viewport.themeColor` to the primary/brand color — it controls the iOS/Android status bar background, not an accent color.
- Keep `LIGHT_BG` = hsl(190 60% 97%) ≈ `#F3FAFC` and `DARK_BG` = hsl(190 50% 9%) ≈ `#0B1F22` unless deliberately rebranding.
- Do **not** remove `<ThemeColorSync />` from `layout.tsx` — without it the meta tag stays frozen at the SSR (Server-Side Rendering) value and the status bar won't update when the user toggles dark mode via the in-app theme switch (`next-themes` uses `attribute="class"` with `enableSystem={false}`, so OS (operating system) `prefers-color-scheme` media queries do not apply here).
