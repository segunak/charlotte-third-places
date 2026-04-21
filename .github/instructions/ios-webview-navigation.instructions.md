---
description: 'iOS WKWebView navigation policy and external URL handling. Use when: modifying how the iOS app opens external links, map links, Safari in-app browser behavior, or adding new URL scheme support.'
applyTo: 'ios/src/Third Places/WebView.swift,ios/src/Third Places/Settings.swift,ios/src/Third Places/Info.plist'
---

# iOS WebView Navigation Policy

## Architecture

The iOS app is a WKWebView wrapper. Navigation policy is in `WebView.swift` inside the `decidePolicyFor navigationAction` method.

### URL routing rules

| URL type | How matched | Behavior |
|----------|-------------|----------|
| `about:` scheme | `scheme == "about"` | Allowed in WebView |
| Blob / download | `shouldPerformDownload` or `scheme == "blob"` | Download handler |
| Auth origins | Host matches `authOrigins` array | Allowed in WebView + shows toolbar |
| Allowed origins | Host matches `allowedOrigins` array | Allowed in WebView (main content) |
| Synthetic navigations | `navigationType == .other`, `syntheticClickType == 0`, has target+source frame | Allowed (e.g., JS-driven navigations) |
| **Map URLs** | Host/path matching (see below) | `UIApplication.shared.open()` → native map app or Safari |
| Other `http`/`https` | Everything else | `SFSafariViewController` (in-app browser) |
| `tel:`, `mailto:` | Scheme check | `UIApplication.shared.open()` |
| File URLs | `isFileURL` | Download and open |

### Allowed origins (`Settings.swift`)

```swift
let allowedOrigins: [String] = ["www.charlottethirdplaces.com"]
let authOrigins: [String] = []
```

Also declared in `Info.plist` under `WKAppBoundDomains`.

## Map URL Detection

Map URLs are routed through `UIApplication.shared.open()` instead of `SFSafariViewController` so iOS triggers Universal Link handling — opening the native Apple Maps or Google Maps app if installed, or falling back to Safari (outside the app).

### Matched patterns (from official Google/Apple docs)

| Pattern | Example | Match logic |
|---------|---------|-------------|
| `maps.google.{TLD}` | `maps.google.com`, `maps.google.co.uk` | `host.hasPrefix("maps.google.")` |
| `(www.)google.{TLD}/maps` | `www.google.com/maps/place/...` | `host.contains("google.") && path.hasPrefix("/maps")` |
| `maps.app.goo.gl` | `maps.app.goo.gl/abc123` | `host == "maps.app.goo.gl"` |
| `goo.gl/maps` | `goo.gl/maps/abc123` | `host == "goo.gl" && path.hasPrefix("/maps")` |
| `maps.apple.com` | `maps.apple.com/?ll=35,-80&q=...` | `host == "maps.apple.com"` |

### Adding new external app patterns

To route a new URL type to its native app instead of `SFSafariViewController`:
1. Add a host/path check to the `isMapUrl` conditional in `WebView.swift`
2. The pattern should use `requestUrl.host` and `requestUrl.path` (not `absoluteString.contains`) for reliable matching
3. `UIApplication.shared.open(requestUrl)` hands the URL to iOS, which checks Universal Links and registered URL schemes

## Android (TWA)

The Android app is a Trusted Web Activity (Chrome wrapper). External link behavior is handled by Chrome's built-in Intent system — no custom code. Google Maps links automatically open the Google Maps app on Android. No equivalent of this file exists for Android.
