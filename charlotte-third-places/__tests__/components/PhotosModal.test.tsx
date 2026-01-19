/**
 * PhotosModal Component Tests
 *
 * Tests for the PhotosModal component which displays a photo gallery
 * in a dialog modal overlay.
 *
 * Key functionality tested:
 * - Modal visibility logic (returns null when no photos)
 * - Close button visibility (always shows bottom close, X button only on desktop)
 * - Responsive max-width on desktop
 * - Photo counter display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Place } from '@/lib/types'

// Track the mock return value so we can change it per test
let mockIsMobile = false

// Mock hooks
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockIsMobile,
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

// Import after mocks
import { PhotosModal } from '@/components/PhotosModal'

/**
 * Factory function to create test Place objects with photos
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
    photos: [
      'https://lh3.googleusercontent.com/photo1',
      'https://lh3.googleusercontent.com/photo2',
      'https://lh3.googleusercontent.com/photo3',
    ],
    comments: '',
    featured: false,
    operational: 'Open',
    createdDate: new Date('2024-01-01T00:00:00.000Z'),
    lastModifiedDate: new Date('2024-01-15T00:00:00.000Z'),
    ...overrides,
  }
}

describe('PhotosModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsMobile = false // Reset to desktop by default
  })

  describe('Visibility Logic', () => {
    it('renders nothing when place is null', () => {
      const { container } = render(
        <PhotosModal place={null} open={true} onClose={vi.fn()} />
      )

      expect(container.textContent).toBe('')
    })

    it('renders nothing when place has no photos', () => {
      const place = createMockPlace({ photos: [] })
      const { container } = render(
        <PhotosModal place={place} open={true} onClose={vi.fn()} />
      )

      expect(container.textContent).toBe('')
    })

    it('renders dialog when open with photos', () => {
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Photo Counter Display', () => {
    it('displays place name and photo count', () => {
      const place = createMockPlace({ name: 'Amazing Cafe' })
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      expect(screen.getByText(/Amazing Cafe - Photo 1 of 3/)).toBeInTheDocument()
    })
  })

  describe('Bottom Close Button', () => {
    it('always renders bottom close button', () => {
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      // Should have a Close button at the bottom
      const closeButtons = screen.getAllByRole('button', { name: /close/i })
      expect(closeButtons.length).toBeGreaterThan(0)
      
      // Find the prominent Close button (not the X icon)
      const bottomCloseButton = closeButtons.find(btn => btn.textContent === 'Close')
      expect(bottomCloseButton).toBeInTheDocument()
    })

    it('calls onClose when bottom close button is clicked', () => {
      const place = createMockPlace()
      const onClose = vi.fn()
      render(<PhotosModal place={place} open={true} onClose={onClose} />)

      // Find the text Close button (not the X)
      const closeButtons = screen.getAllByRole('button', { name: /close/i })
      const bottomCloseButton = closeButtons.find(btn => btn.textContent === 'Close')
      
      if (bottomCloseButton) {
        fireEvent.click(bottomCloseButton)
      }

      // Dialog's onOpenChange gets called which triggers onClose
      expect(onClose).toHaveBeenCalled()
    })

    it('has full width on mobile', () => {
      mockIsMobile = true
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      const closeButtons = screen.getAllByRole('button', { name: /close/i })
      const bottomCloseButton = closeButtons.find(btn => btn.textContent === 'Close')
      
      // Button should have w-full class (and responsive classes for desktop)
      expect(bottomCloseButton).toHaveClass('w-full')
    })

    it('has constrained width on desktop', () => {
      mockIsMobile = false
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      const closeButtons = screen.getAllByRole('button', { name: /close/i })
      const bottomCloseButton = closeButtons.find(btn => btn.textContent === 'Close')
      
      // Button should have md:w-auto for desktop
      expect(bottomCloseButton).toHaveClass('md:w-auto')
    })
  })

  describe('Dialog X Close Button', () => {
    it('has hidden class for mobile (X button hidden on mobile)', () => {
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      // The dialog content should pass crossCloseClassName with hidden md:block
      // We can verify by checking the dialog structure
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      
      // The X close button should exist but have hidden md:block classes
      // Find it by its sr-only Close text
      const xCloseButton = document.querySelector('[data-slot="dialog-content"] > button')
      expect(xCloseButton).toBeInTheDocument()
      expect(xCloseButton).toHaveClass('hidden')
      expect(xCloseButton).toHaveClass('md:block')
    })
  })

  describe('Dialog Styling', () => {
    it('has correct max-width class for desktop', () => {
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      const dialogContent = document.querySelector('[data-slot="dialog-content"]')
      expect(dialogContent).toHaveClass('md:max-w-2xl')
    })

    it('has full width on mobile', () => {
      mockIsMobile = true
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      const dialogContent = document.querySelector('[data-slot="dialog-content"]')
      expect(dialogContent).toHaveClass('w-full')
    })

    it('has dark background styling', () => {
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      const dialogContent = document.querySelector('[data-slot="dialog-content"]')
      expect(dialogContent).toHaveClass('bg-black/95')
    })
  })

  describe('Thumbnails', () => {
    it('shows thumbnails section when multiple photos exist', () => {
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      // Should show Hide Thumbnails button when thumbnails are visible
      // Use getByRole to avoid matching the sr-only span
      const toggleButton = screen.getByRole('button', { name: /thumbnails/i })
      expect(toggleButton).toBeInTheDocument()
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
    })

    it('toggles thumbnails visibility when button is clicked', () => {
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      // Find and click the toggle button
      const toggleButton = screen.getByRole('button', { name: /thumbnails/i })
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
      fireEvent.click(toggleButton)

      // Should now be collapsed
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('Accessibility', () => {
    it('has accessible dialog title', () => {
      const place = createMockPlace({ name: 'Test Place' })
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      // sr-only title should exist
      expect(screen.getByText('Test Place Photos')).toBeInTheDocument()
    })

    it('has accessible dialog description', () => {
      const place = createMockPlace({ name: 'Test Place' })
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      expect(screen.getByText(/Photo gallery for Test Place/)).toBeInTheDocument()
    })
  })
})
