import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GetTheAppCard } from '@/components/GetTheAppCard'

// Helper to mock matchMedia for useIsNativeApp
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

describe('GetTheAppCard', () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: originalMatchMedia,
    })
    if ('standalone' in window.navigator) {
      delete (window.navigator as Record<string, unknown>).standalone
    }
    vi.restoreAllMocks()
  })

  it('renders the card with the hide-in-native-app class in a regular browser', () => {
    mockMatchMedia(false)

    render(<GetTheAppCard />)

    // Heading renders
    expect(screen.getByText('Get the App')).toBeInTheDocument()

    // The Card wrapper should carry the hide-in-native-app class so CSS can
    // hide it inside native wrappers before the client hook fires.
    const heading = screen.getByText('Get the App')
    const card = heading.closest('.hide-in-native-app')
    expect(card).not.toBeNull()
    expect(card).not.toHaveClass('sm:hidden')
  })

  it('returns null inside a native app (standalone display-mode)', () => {
    mockMatchMedia(true)

    const { container } = render(<GetTheAppCard />)
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText('Get the App')).not.toBeInTheDocument()
  })
})
