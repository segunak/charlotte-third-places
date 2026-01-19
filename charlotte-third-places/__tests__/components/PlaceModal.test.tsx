/**
 * PlaceModal Component Tests
 *
 * Tests for the PlaceModal component which displays place details
 * in a dialog modal overlay.
 *
 * Note: Many tests are simplified because the Dialog component from Radix UI
 * requires a portal and specific DOM setup that's difficult to fully test
 * in a unit test environment. For full modal testing, E2E tests are preferred.
 *
 * Key functionality tested:
 * - Modal visibility logic (returns null when closed)
 * - getPlaceHighlights integration for featured/opening soon
 * - Scroll hint arrow visibility (mobile-only feature)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import type { Place } from '@/lib/types'

// Track the mock return value so we can change it per test
let mockIsMobile = false

// Mock hooks
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockIsMobile,
}))

// Mock ModalContext
const mockShowPlacePhotos = vi.fn()
vi.mock('@/contexts/ModalContext', () => ({
  useModalContext: () => ({
    showPlacePhotos: mockShowPlacePhotos,
  }),
  useModalActions: () => ({
    showPlacePhotos: mockShowPlacePhotos,
  }),
}))

// Import after mocks
import { PlaceModal } from '@/components/PlaceModal'

/**
 * Factory function to create test Place objects
 */
function createMockPlace(overrides: Partial<Place> = {}): Place {
  return {
    recordId: 'rec123456',
    name: 'Test Coffee Shop',
    description: 'A cozy coffee shop in the heart of Charlotte.',
    address: '123 Main St, Charlotte, NC 28202',
    neighborhood: 'Uptown',
    latitude: 35.2271,
    longitude: -80.8431,
    type: ['Coffee Shop', 'Cafe'],
    size: 'Medium',
    purchaseRequired: 'Yes',
    parking: ['Street Parking'],
    freeWiFi: 'Yes',
    hasCinnamonRolls: 'No',
    hasReviews: 'No',
    googleMapsPlaceId: '',
    googleMapsProfileURL: 'https://maps.google.com/?cid=123',
    appleMapsProfileURL: 'https://maps.apple.com/?address=123',
    website: 'https://testcoffee.com',
    tiktok: '',
    instagram: '',
    youtube: '',
    facebook: '',
    twitter: '',
    linkedIn: '',
    tags: [],
    photos: [],
    comments: '',
    featured: false,
    operational: 'Open',
    createdDate: new Date('2024-01-01T00:00:00.000Z'),
    lastModifiedDate: new Date('2024-01-15T00:00:00.000Z'),
    ...overrides,
  }
}

describe('PlaceModal', () => {
  // Store original property descriptors to restore later
  let originalScrollHeight: PropertyDescriptor | undefined
  let originalClientHeight: PropertyDescriptor | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsMobile = false // Reset to desktop by default
    vi.useFakeTimers()

    // Mock scrollHeight and clientHeight on HTMLDivElement.prototype
    // so contentRef.current.scrollHeight > clientHeight returns true
    originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight')
    originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')

    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get: function () {
        return 2000 // Simulate scrollable content
      },
    })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get: function () {
        return 600 // Simulate visible viewport
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    // Restore original property descriptors
    if (originalScrollHeight) {
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', originalScrollHeight)
    }
    if (originalClientHeight) {
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', originalClientHeight)
    }
  })

  describe('Visibility Logic', () => {
    it('renders nothing when open is false', () => {
      const place = createMockPlace()
      const { container } = render(
        <PlaceModal place={place} open={false} onClose={vi.fn()} />
      )

      expect(container.textContent).toBe('')
    })

    it('renders nothing when place is null', () => {
      const { container } = render(
        <PlaceModal place={null} open={true} onClose={vi.fn()} />
      )

      expect(container.textContent).toBe('')
    })

    it('renders dialog content when open is true and place is provided', () => {
      const place = createMockPlace({ name: 'Visible Coffee Shop' })
      render(<PlaceModal place={place} open={true} onClose={vi.fn()} />)

      // The dialog should render and contain the place name
      expect(screen.getByText('Visible Coffee Shop')).toBeInTheDocument()
    })
  })

  describe('Place Information Display', () => {
    it('displays place name in the dialog', () => {
      const place = createMockPlace({ name: 'Amazing Cafe' })
      render(<PlaceModal place={place} open={true} onClose={vi.fn()} />)

      expect(screen.getByText('Amazing Cafe')).toBeInTheDocument()
    })

    it('displays place types in the dialog', () => {
      const place = createMockPlace({ type: ['Coffee Shop', 'Bakery'] })
      render(<PlaceModal place={place} open={true} onClose={vi.fn()} />)

      expect(screen.getByText('Coffee Shop, Bakery')).toBeInTheDocument()
    })
  })

  describe('Opening Soon Places', () => {
    it('does not show Ask AI button for Opening Soon places', () => {
      const place = createMockPlace({ operational: 'Opening Soon' })
      render(<PlaceModal place={place} open={true} onClose={vi.fn()} />)

      // The Ask AI button should not appear for Opening Soon places
      const askAIButtons = screen.queryAllByRole('button', { name: /ask ai/i })
      expect(askAIButtons.length).toBe(0)
    })
  })

  describe('Featured Places', () => {
    it('shows ribbon for featured places', () => {
      const place = createMockPlace({ featured: true })
      render(<PlaceModal place={place} open={true} onClose={vi.fn()} />)

      expect(screen.getByText('Featured')).toBeInTheDocument()
    })

    it('shows ribbon for Opening Soon places', () => {
      const place = createMockPlace({ operational: 'Opening Soon' })
      render(<PlaceModal place={place} open={true} onClose={vi.fn()} />)

      expect(screen.getByText('Opening Soon')).toBeInTheDocument()
    })
  })

  describe('Close Button', () => {
    it('renders Close buttons in the dialog', () => {
      const place = createMockPlace()
      render(<PlaceModal place={place} open={true} onClose={vi.fn()} />)

      // Dialog has at least one close mechanism
      const closeButtons = screen.getAllByRole('button', { name: /close/i })
      expect(closeButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Ask AI Button', () => {
    it('shows Ask AI button for open places', () => {
      const place = createMockPlace({ operational: 'Open' })
      render(<PlaceModal place={place} open={true} onClose={vi.fn()} />)

      // Should have at least one Ask AI button
      const askAIButtons = screen.getAllByRole('button', { name: /ask ai/i })
      expect(askAIButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Scroll Hint Arrow', () => {
    it('shows scroll hint arrow on mobile when content is scrollable', async () => {
      mockIsMobile = true
      const place = createMockPlace()
      render(<PlaceModal place={place} open={true} onClose={vi.fn()} />)

      // Advance timers to trigger the scroll hint logic (200ms delay)
      // Use act() to flush React state updates
      await act(async () => {
        vi.advanceTimersByTime(250)
      })

      // The scroll hint button should be visible (aria-hidden="false" when shown)
      const scrollHintButton = screen.getByRole('button', { name: /scroll for more/i })
      expect(scrollHintButton).toBeInTheDocument()
      expect(scrollHintButton).toHaveClass('opacity-100')
      expect(scrollHintButton).toHaveAttribute('aria-hidden', 'false')
    })

    it('does NOT show scroll hint arrow on desktop', async () => {
      mockIsMobile = false
      const place = createMockPlace()
      render(<PlaceModal place={place} open={true} onClose={vi.fn()} />)

      // Advance timers
      await act(async () => {
        vi.advanceTimersByTime(250)
      })

      // The scroll hint button should be hidden (opacity-0) and aria-hidden
      // On desktop, the button still exists but is hidden via opacity-0 and aria-hidden
      // Use querySelector since aria-hidden elements aren't accessible to getByRole
      const scrollHintButton = document.querySelector('[aria-label="Scroll for more"]')
      expect(scrollHintButton).toBeInTheDocument()
      expect(scrollHintButton).toHaveClass('opacity-0')
      expect(scrollHintButton).toHaveAttribute('aria-hidden', 'true')
    })

    it('hides scroll hint arrow after user scrolls', async () => {
      mockIsMobile = true
      const place = createMockPlace()
      render(<PlaceModal place={place} open={true} onClose={vi.fn()} />)

      // Advance timers to show the hint
      await act(async () => {
        vi.advanceTimersByTime(250)
      })

      // Hint should be visible
      const scrollHintButton = screen.getByRole('button', { name: /scroll for more/i })
      expect(scrollHintButton).toHaveClass('opacity-100')

      // Find the scroll container and trigger a scroll event
      const scrollContainer = scrollHintButton.closest('[class*="overflow-y-auto"]')
      expect(scrollContainer).toBeInTheDocument()
      
      if (scrollContainer) {
        await act(async () => {
          fireEvent.scroll(scrollContainer)
        })
      }

      // Hint should now be hidden (aria-hidden changes to "true")
      expect(scrollHintButton).toHaveClass('opacity-0')
      expect(scrollHintButton).toHaveAttribute('aria-hidden', 'true')
    })

    it('does not show scroll hint when modal is closed', async () => {
      mockIsMobile = true
      const place = createMockPlace()
      const { container } = render(<PlaceModal place={place} open={false} onClose={vi.fn()} />)

      // Advance timers
      await act(async () => {
        vi.advanceTimersByTime(250)
      })

      // Modal should not render anything
      expect(container.textContent).toBe('')
    })
  })
})
