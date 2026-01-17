/**
 * PlaceContent Component Tests
 *
 * Tests for the PlaceContent component which renders the main content
 * section for place details (used in both PlaceModal and PlacePageClient).
 *
 * Note: Some tests are simplified because components like ResponsiveLink
 * and ShareButton have their own specific implementations that affect testing.
 * For full integration testing, E2E tests are preferred.
 *
 * Key functionality tested:
 * - Conditional button rendering based on props
 * - QuickFacts section rendering
 * - Description and Comments sections
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Place } from '@/lib/types'

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
import { PlaceContent } from '@/components/PlaceContent'

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
    type: ['Coffee Shop'],
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

describe('PlaceContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const place = createMockPlace()
      const { container } = render(<PlaceContent place={place} />)
      expect(container).toBeInTheDocument()
    })

    it('renders the Description heading', () => {
      const place = createMockPlace()
      render(<PlaceContent place={place} />)

      // The heading is rendered as "Description:" with content following
      expect(screen.getByText(/Description:/)).toBeInTheDocument()
    })
  })

  describe('Google Maps Button', () => {
    it('renders Google link when URL is provided', () => {
      const place = createMockPlace({ googleMapsProfileURL: 'https://maps.google.com/?cid=123' })
      render(<PlaceContent place={place} />)

      // Check for aria-label on the link or button
      const googleLink = screen.getByLabelText('Visit Google Maps Page')
      expect(googleLink).toBeInTheDocument()
    })

    it('does not render Google link when URL is empty', () => {
      const place = createMockPlace({ googleMapsProfileURL: '' })
      render(<PlaceContent place={place} />)

      expect(screen.queryByLabelText('Visit Google Maps Page')).not.toBeInTheDocument()
    })
  })

  describe('Apple Maps Button', () => {
    it('renders Apple link when URL is provided', () => {
      const place = createMockPlace({ appleMapsProfileURL: 'https://maps.apple.com/?address=123' })
      render(<PlaceContent place={place} />)

      const appleLink = screen.getByLabelText('Visit Apple Maps Page')
      expect(appleLink).toBeInTheDocument()
    })

    it('does not render Apple link when URL is empty', () => {
      const place = createMockPlace({ appleMapsProfileURL: '' })
      render(<PlaceContent place={place} />)

      expect(screen.queryByLabelText('Visit Apple Maps Page')).not.toBeInTheDocument()
    })
  })

  describe('Website Button', () => {
    it('renders Website link when URL is provided', () => {
      const place = createMockPlace({ website: 'https://example.com' })
      render(<PlaceContent place={place} />)

      const websiteLink = screen.getByLabelText('Visit Website')
      expect(websiteLink).toBeInTheDocument()
    })

    it('does not render Website link when URL is empty', () => {
      const place = createMockPlace({ website: '' })
      render(<PlaceContent place={place} />)

      expect(screen.queryByLabelText('Visit Website')).not.toBeInTheDocument()
    })
  })

  describe('Photos Button', () => {
    it('renders Photos button when photos exist', () => {
      const place = createMockPlace({
        photos: ['https://example.com/photo.jpg'],
      })
      render(<PlaceContent place={place} />)

      expect(screen.getByLabelText('View photos')).toBeInTheDocument()
    })

    it('does not render Photos button when no photos', () => {
      const place = createMockPlace({ photos: [] })
      render(<PlaceContent place={place} />)

      expect(screen.queryByLabelText('View photos')).not.toBeInTheDocument()
    })

    it('does not render Photos button when showPhotosButton is false', () => {
      const place = createMockPlace({
        photos: ['https://example.com/photo.jpg'],
      })
      render(<PlaceContent place={place} showPhotosButton={false} />)

      expect(screen.queryByLabelText('View photos')).not.toBeInTheDocument()
    })
  })

  describe('Share Button', () => {
    it('renders Share button', () => {
      const place = createMockPlace()
      render(<PlaceContent place={place} />)

      expect(screen.getByLabelText('Share Place')).toBeInTheDocument()
    })
  })

  describe('Ask AI Button', () => {
    it('does not render Ask AI button when onAskAI is not provided', () => {
      const place = createMockPlace()
      render(<PlaceContent place={place} />)

      expect(screen.queryByRole('button', { name: /ask ai/i })).not.toBeInTheDocument()
    })

    it('renders Ask AI buttons when onAskAI is provided', () => {
      const place = createMockPlace()
      const onAskAI = vi.fn()
      render(<PlaceContent place={place} onAskAI={onAskAI} />)

      // Desktop and mobile Ask AI buttons
      const buttons = screen.getAllByRole('button', { name: /ask ai/i })
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Description Section', () => {
    it('renders default description when none provided', () => {
      const place = createMockPlace({ description: '' })
      render(<PlaceContent place={place} />)

      expect(
        screen.getByText('A third place in the Charlotte, North Carolina area.')
      ).toBeInTheDocument()
    })
  })

  describe('Comments Section', () => {
    it('renders Comments section when comments exist', () => {
      const place = createMockPlace({ comments: 'Great coffee and atmosphere!' })
      render(<PlaceContent place={place} />)

      // The heading is rendered as "Comments:" with content following
      expect(screen.getByText(/Comments:/)).toBeInTheDocument()
    })

    it('does not render Comments section when comments are empty', () => {
      const place = createMockPlace({ comments: '' })
      render(<PlaceContent place={place} />)

      expect(screen.queryByText(/Comments:/)).not.toBeInTheDocument()
    })

    it('does not render Comments section when comments are whitespace only', () => {
      const place = createMockPlace({ comments: '   ' })
      render(<PlaceContent place={place} />)

      expect(screen.queryByText(/Comments:/)).not.toBeInTheDocument()
    })
  })

  describe('QuickFacts Section', () => {
    it('displays the address', () => {
      const place = createMockPlace({ address: '456 Oak St, Charlotte, NC' })
      render(<PlaceContent place={place} />)

      expect(screen.getByText('456 Oak St, Charlotte, NC')).toBeInTheDocument()
    })

    it('displays the neighborhood', () => {
      const place = createMockPlace({ neighborhood: 'South End' })
      render(<PlaceContent place={place} />)

      expect(screen.getByText('South End')).toBeInTheDocument()
    })

    it('displays the size', () => {
      const place = createMockPlace({ size: 'Large' })
      render(<PlaceContent place={place} />)

      expect(screen.getByText('Large')).toBeInTheDocument()
    })
  })

  describe('Metadata Section', () => {
    it('renders metadata with dates', () => {
      const place = createMockPlace({
        createdDate: new Date('2024-03-15T00:00:00.000Z'),
        lastModifiedDate: new Date('2024-06-20T00:00:00.000Z'),
      })
      render(<PlaceContent place={place} />)

      expect(screen.getByText(/Added:/)).toBeInTheDocument()
      expect(screen.getByText(/Last Updated:/)).toBeInTheDocument()
    })
  })
})
