import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock ResizeObserver for TanStack Virtual / virtualization libraries
// Must be a class constructor, not a mock function
class ResizeObserverMock {
  callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe = vi.fn((element: Element) => {
    // Immediately call with mock dimensions so virtualizer can calculate
    this.callback([{
      target: element,
      contentRect: { width: 800, height: 600 } as DOMRectReadOnly,
      borderBoxSize: [{ blockSize: 600, inlineSize: 800 }],
      contentBoxSize: [{ blockSize: 600, inlineSize: 800 }],
      devicePixelContentBoxSize: [{ blockSize: 600, inlineSize: 800 }],
    }], this as unknown as ResizeObserver)
  })
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

// Mock IntersectionObserver for useInView hook testing
class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []

  private callback: IntersectionObserverCallback
  private elements: Set<Element> = new Set()

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback
    if (options?.threshold) {
      this.thresholds = Array.isArray(options.threshold) ? options.threshold : [options.threshold]
    }
    if (options?.rootMargin) {
      this.rootMargin = options.rootMargin
    }
  }

  observe = vi.fn((element: Element) => {
    this.elements.add(element)
    // Immediately trigger as visible by default
    this.callback([{
      target: element,
      isIntersecting: true,
      intersectionRatio: 1,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: Date.now(),
    }], this)
  })

  unobserve = vi.fn((element: Element) => {
    this.elements.delete(element)
  })

  disconnect = vi.fn(() => {
    this.elements.clear()
  })

  takeRecords = vi.fn(() => [])
}
global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver

// Mock Element.prototype methods needed by TanStack Virtual
Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
  writable: true,
  value: vi.fn().mockReturnValue({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    bottom: 600,
    right: 800,
    x: 0,
    y: 0,
    toJSON: () => {},
  }),
})

// Mock scrollHeight and clientHeight for scroll containers
Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
  configurable: true,
  get() { return 2000 },
})

Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  get() { return 600 },
})

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Next.js image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />
  },
}))

// Mock Radix UI Popover for proper open/close testing in jsdom
// This ensures PopoverContent renders correctly based on open state
vi.mock('@radix-ui/react-popover', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>
  return {
    ...actual,
    // Re-export the actual components - they work fine in jsdom with our ResizeObserver mock
    // This mock is here to document that we've verified Radix Popover works in tests
  }
})

// Suppress console errors during tests (optional - can be removed if you want to see them)
// vi.spyOn(console, 'error').mockImplementation(() => {})
