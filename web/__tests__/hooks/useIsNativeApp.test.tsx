import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsNativeApp } from '@/hooks/useIsNativeApp'

describe('useIsNativeApp', () => {
  const originalMatchMedia = window.matchMedia
  let cookieDescriptor: PropertyDescriptor | undefined

  beforeEach(() => {
    cookieDescriptor = Object.getOwnPropertyDescriptor(document, 'cookie')
  })

  afterEach(() => {
    // Restore matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: originalMatchMedia,
    })

    // Restore cookie
    if (cookieDescriptor) {
      Object.defineProperty(document, 'cookie', cookieDescriptor)
    }

    // Restore navigator.standalone
    if ('standalone' in window.navigator) {
      delete (window.navigator as Record<string, unknown>).standalone
    }

    vi.restoreAllMocks()
  })

  const mockMatchMedia = (matches: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  }

  it('returns false in a regular browser (no native signals)', () => {
    mockMatchMedia(false)

    const { result } = renderHook(() => useIsNativeApp())
    expect(result.current).toBe(false)
  })

  it('returns true when display-mode is standalone', () => {
    mockMatchMedia(true)

    const { result } = renderHook(() => useIsNativeApp())
    expect(result.current).toBe(true)
  })

  it('returns true when app-platform cookie is set (iOS WKWebView)', () => {
    mockMatchMedia(false)
    // happy-dom supports document.cookie natively
    document.cookie = 'app-platform=iOS App Store'

    const { result } = renderHook(() => useIsNativeApp())
    expect(result.current).toBe(true)

    // Clean up cookie
    document.cookie = 'app-platform=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  it('returns true when navigator.standalone is true (iOS Safari PWA)', () => {
    mockMatchMedia(false)
    ;(window.navigator as unknown as Record<string, unknown>).standalone = true

    const { result } = renderHook(() => useIsNativeApp())
    expect(result.current).toBe(true)
  })

  it('returns false when navigator.standalone is false', () => {
    mockMatchMedia(false)
    ;(window.navigator as unknown as Record<string, unknown>).standalone = false

    const { result } = renderHook(() => useIsNativeApp())
    expect(result.current).toBe(false)
  })
})
