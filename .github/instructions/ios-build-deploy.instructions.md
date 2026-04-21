---
description: 'iOS build, versioning, and App Store deployment. Use when: working on the GitHub Actions iOS workflow, bumping versions, debugging TestFlight upload failures, or submitting to App Store Connect.'
applyTo: '.github/workflows/ios-build.yml,ios/src/Third Places.xcodeproj/project.pbxproj,ios/src/Third Places/Info.plist'
---

# iOS Build & Deployment

## Versioning

Two version numbers in `project.pbxproj`:

- **`MARKETING_VERSION`** (`CFBundleShortVersionString`) — user-facing App Store version. Apple **permanently closes** a version train once it's approved. You cannot upload new builds to a closed train. The GitHub Actions workflow auto-sets this to CalVer date format (`YYYY.M.D`) at build time, so it never needs manual bumping.
- **`CURRENT_PROJECT_VERSION`** (`CFBundleVersion`) — internal build number. Auto-set to `github.run_number` by the workflow. Must be unique per marketing version.

The values in `project.pbxproj` are defaults/placeholders — the workflow's `sed` commands overwrite both at build time.

## GitHub Actions Workflow (`ios-build.yml`)

- **Trigger**: `workflow_dispatch` (manual only)
- **Runner**: `macos-15`
- **Version step**: Sets `MARKETING_VERSION` from UTC date and `CURRENT_PROJECT_VERSION` from `github.run_number` via `sed` on `project.pbxproj`
- **Signing**: Creates a `.p12` from PEM key + certificate on macOS (Windows-created `.p12` files are incompatible). Uses `yukiarrr/ios-build-action` for the actual Xcode build.
- **Upload**: Calls `xcrun altool` directly (not `apple-actions/upload-testflight-build` — that action silently exits 0 on failure). The shell `run:` block properly fails red on upload errors.

### Required secrets

| Secret | Purpose |
|--------|---------|
| `IOS_DISTRIBUTION_KEY_BASE64` | Base64-encoded PEM private key |
| `IOS_DISTRIBUTION_PEM_BASE64` | Base64-encoded PEM certificate |
| `P12_PASSWORD` | Password for the generated .p12 |
| `MOBILEPROVISION_BASE64` | Base64-encoded provisioning profile |
| `TEAM_ID` | Apple Developer Team ID |
| `APPSTORE_ISSUER_ID` | App Store Connect API issuer ID |
| `APPSTORE_API_KEY_ID` | App Store Connect API key ID |
| `APPSTORE_API_PRIVATE_KEY` | App Store Connect API private key (.p8 content) |

## TestFlight & App Store Release Flow

1. Push to any branch + manually trigger workflow → builds and uploads to App Store Connect
2. Build appears in **TestFlight** (internal testing) within minutes — no review needed
3. **External TestFlight** testing: first build of a new version needs brief Beta App Review
4. **App Store release**: go to App Store Connect → create new version → select build → submit for full App Review
5. Once approved, that version train closes permanently — next builds must use a higher marketing version (handled automatically by CalVer)

## Common Failures

| Error | Cause | Fix |
|-------|-------|-----|
| "train version 'X' is closed for new build submissions" | Marketing version matches an already-approved release | Bump `MARKETING_VERSION` (or let CalVer workflow handle it) |
| "CFBundleShortVersionString must contain a higher version" | Same as above | Same fix |
| Upload step shows FAILED but workflow is green | Using `apple-actions/upload-testflight-build` which doesn't propagate exit codes | Use direct `xcrun altool` call in a `run:` block |
| `.p12` signing errors on macOS | `.p12` was created on Windows | Create `.p12` in the workflow on macOS using `openssl pkcs12` |

## iOS Launch Screen Caching

After changing `LaunchScreen.storyboard`, the old launch screen may persist on device. To clear:
1. Delete the app from the device
2. Reboot the device
3. Reinstall from TestFlight
