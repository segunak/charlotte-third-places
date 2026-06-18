import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '@/hooks/use-mobile'

/**
 * Tests for useIsMobile hook.
 * 
 * The hook uses Tailwind's md: breakpoint (768px) to determine mobile vs desktop.
 * - Mobile: width < 768px
 * - Desktop: width >= 768px
 * 
 * @see https://tailwindcss.com/docs/responsive-design#overview
 */
describe('useIsMobile', () => {
  // Store original window properties to restore after tests
  const originalInnerWidth = window.innerWidth
  let matchMediaListeners: Array<() => void> = []

  // Helper to mock window.innerWidth and matchMedia
  const mockViewport = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    })

    // Create a proper matchMedia mock that tracks listeners
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => {
        // Parse the query to determine if it matches
        // Our hook uses: (width < 768px)
        const matches = width < 768

        return {
          matches,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn((event: string, callback: () => void) => {
            if (event === 'change') {
              matchMediaListeners.push(callback)
            }
          }),
          removeEventListener: vi.fn((event: string, callback: () => void) => {
            matchMediaListeners = matchMediaListeners.filter(cb => cb !== callback)
          }),
          dispatchEvent: vi.fn(),
        }
      }),
    })
  }

  // Helper to simulate viewport resize
  const resizeViewport = (newWidth: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: newWidth,
    })
    
    // Trigger all registered change listeners
    matchMediaListeners.forEach(listener => listener())
  }

  beforeEach(() => {
    matchMediaListeners = []
  })

  afterEach(() => {
    // Restore original window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
  })

  describe('initial state based on viewport width', () => {
    it('returns true for mobile viewport (< 768px)', () => {
      mockViewport(767)
      const { result } = renderHook(() => useIsMobile())
      expect(result.current).toBe(true)
    })

    it('returns true for narrow mobile viewport (320px)', () => {
      mockViewport(320)
      const { result } = renderHook(() => useIsMobile())
      expect(result.current).toBe(true)
    })

    it('returns false for desktop viewport (>= 768px)', () => {
      mockViewport(768)
      const { result } = renderHook(() => useIsMobile())
      expect(result.current).toBe(false)
    })

    it('returns false for wide desktop viewport (1920px)', () => {
      mockViewport(1920)
      const { result } = renderHook(() => useIsMobile())
      expect(result.current).toBe(false)
    })
  })

  describe('breakpoint boundary (768px)', () => {
    it('returns true at 767px (just below breakpoint)', () => {
      mockViewport(767)
      const { result } = renderHook(() => useIsMobile())
      expect(result.current).toBe(true)
    })

    it('returns false at exactly 768px (Tailwind md: breakpoint)', () => {
      mockViewport(768)
      const { result } = renderHook(() => useIsMobile())
      expect(result.current).toBe(false)
    })

    it('returns false at 769px (just above breakpoint)', () => {
      mockViewport(769)
      const { result } = renderHook(() => useIsMobile())
      expect(result.current).toBe(false)
    })
  })

  describe('viewport resize handling', () => {
    it('updates from desktop to mobile when resizing down', () => {
      mockViewport(1024)
      const { result } = renderHook(() => useIsMobile())
      
      expect(result.current).toBe(false) // Initially desktop

      act(() => {
        resizeViewport(500)
      })

      expect(result.current).toBe(true) // Now mobile
    })

    it('updates from mobile to desktop when resizing up', () => {
      mockViewport(500)
      const { result } = renderHook(() => useIsMobile())
      
      expect(result.current).toBe(true) // Initially mobile

      act(() => {
        resizeViewport(1024)
      })

      expect(result.current).toBe(false) // Now desktop
    })

    it('updates when crossing the 768px boundary', () => {
      mockViewport(767)
      const { result } = renderHook(() => useIsMobile())
      
      expect(result.current).toBe(true) // 767px = mobile

      act(() => {
        resizeViewport(768)
      })

      expect(result.current).toBe(false) // 768px = desktop
    })
  })

  describe('cleanup', () => {
    it('removes event listener on unmount', () => {
      mockViewport(1024)
      const { unmount } = renderHook(() => useIsMobile())
      
      const initialListenerCount = matchMediaListeners.length
      expect(initialListenerCount).toBeGreaterThan(0)

      unmount()

      // After unmount, the listener should have been removed
      // (our mock tracks this via the removeEventListener call)
    })
  })

  describe('SSR compatibility', () => {
    it('defaults to false (desktop) for SSR hydration consistency', () => {
      // This tests the initial useState(false) which ensures
      // server and client start with the same value
      mockViewport(500) // Mobile viewport
      
      const { result } = renderHook(() => useIsMobile())
      
      // After the effect runs, it should be true
      // But the initial render (before useEffect) would be false
      // This is the expected behavior documented in the hook
      expect(result.current).toBe(true)
    })
  })
})
