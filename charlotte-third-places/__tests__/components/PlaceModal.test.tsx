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
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Place } from '@/lib/types'

// Mock hooks
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}))

// Mock ModalContext
const mockShowPlacePhotos = vi.fn()
vi.mock('@/contexts/ModalContext', () => ({
  useModalContext: () => ({
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
  beforeEach(() => {
    vi.clearAllMocks()
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
})
