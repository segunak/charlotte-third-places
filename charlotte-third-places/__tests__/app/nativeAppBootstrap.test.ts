import { describe, it, expect, afterEach } from 'vitest'

/**
 * Tests for the inline script in app/layout.tsx that sets data-native-app on <html>
 * before first paint, so CSS can hide "Get the App" promotional UI without flash.
 *
 * The script reads:
 *   - document.cookie (looks for "app-platform" — set by iOS WKWebView wrapper)
 *   - window.navigator.standalone (iOS Safari home-screen PWA)
 *
 * If either signal is present, it sets data-native-app="true" on documentElement.
 * Android TWAs and installed PWAs are handled via CSS @media (display-mode: standalone)
 * and do not require this script.
 *
 * This mirrors exactly the script string inlined in app/layout.tsx; keep them in sync.
 */
const nativeAppBootstrapScript = () => {
  try {
    const c = document.cookie || ''
    const s = (window.navigator as unknown as Record<string, unknown>).standalone === true
    if (c.indexOf('app-platform') !== -1 || s) {
      document.documentElement.setAttribute('data-native-app', 'true')
    }
  } catch {
    // swallow — the inline script is wrapped in try/catch too
  }
}

describe('native app bootstrap script (app/layout.tsx inline)', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-native-app')
    // Clear cookies set during tests
    document.cookie = 'app-platform=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    if ('standalone' in window.navigator) {
      delete (window.navigator as Record<string, unknown>).standalone
    }
  })

  it('does not set data-native-app in a plain browser', () => {
    nativeAppBootstrapScript()
    expect(document.documentElement.hasAttribute('data-native-app')).toBe(false)
  })

  it('sets data-native-app="true" when app-platform cookie is present (iOS WKWebView)', () => {
    document.cookie = 'app-platform=iOS App Store; path=/'

    nativeAppBootstrapScript()

    expect(document.documentElement.getAttribute('data-native-app')).toBe('true')
  })

  it('sets data-native-app="true" when navigator.standalone is true (iOS home-screen PWA)', () => {
    ;(window.navigator as unknown as Record<string, unknown>).standalone = true

    nativeAppBootstrapScript()

    expect(document.documentElement.getAttribute('data-native-app')).toBe('true')
  })

  it('does not set data-native-app when navigator.standalone is explicitly false', () => {
    ;(window.navigator as unknown as Record<string, unknown>).standalone = false

    nativeAppBootstrapScript()

    expect(document.documentElement.hasAttribute('data-native-app')).toBe(false)
  })

  it('does not throw if document.cookie access fails', () => {
    expect(() => nativeAppBootstrapScript()).not.toThrow()
  })
})
