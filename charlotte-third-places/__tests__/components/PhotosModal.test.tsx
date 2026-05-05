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
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Place } from '@/lib/types'

// Track the mock return value so we can change it per test
let mockIsMobile = false

// Mock hooks
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockIsMobile,
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, fill: _fill, quality: _quality, placeholder: _placeholder, fetchPriority, ...props }: { src: string; alt: string; fill?: boolean; quality?: number; placeholder?: string; fetchPriority?: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-fetch-priority={fetchPriority} {...props} />
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
      'https://thirdplacesdata.blob.core.windows.net/photos/rec123456/photo-1.webp',
      'https://thirdplacesdata.blob.core.windows.net/photos/rec123456/photo-2.webp',
      'https://thirdplacesdata.blob.core.windows.net/photos/rec123456/photo-3.webp',
    ],
    comments: '',
    operatingHours: [],
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
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
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

    it('uses Azure photo URLs directly', () => {
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      expect(screen.getByAltText('Test Coffee Shop photo 1')).toHaveAttribute(
        'src',
        'https://thirdplacesdata.blob.core.windows.net/photos/rec123456/photo-1.webp'
      )
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
    it('has correct max-width classes for desktop', () => {
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      const dialogContent = document.querySelector('[data-slot="dialog-content"]')
      expect(dialogContent).toHaveClass('md:max-w-3xl')
      expect(dialogContent).not.toHaveClass('md:max-w-4xl')
      expect(dialogContent).not.toHaveClass('lg:max-w-5xl')
    })

    it('uses larger image container sizing', () => {
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      const imageContainer = screen.getByAltText('Test Coffee Shop photo 1').parentElement
      expect(imageContainer).toHaveClass('h-[52dvh]')
      expect(imageContainer).toHaveClass('md:h-[72dvh]')
      expect(imageContainer).toHaveClass('lg:h-[76dvh]')
    })

    it('uses responsive main image sizes for the capped modal', () => {
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      expect(screen.getByAltText('Test Coffee Shop photo 1')).toHaveAttribute(
        'sizes',
        '(max-width: 767px) 95vw, 768px'
      )
    })

    it('uses the standard carousel content structure', () => {
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      const carouselContent = document.querySelector('[data-slot="carousel-content"]')
      const carouselViewport = carouselContent?.parentElement

      expect(carouselViewport).toHaveClass('overflow-hidden')
      expect(carouselContent).toHaveClass('flex')
      expect(carouselContent).toHaveClass('-ml-4')
      expect(carouselContent).not.toHaveClass('will-change-transform')
      expect(carouselContent).not.toHaveClass('transform-gpu')
    })

    it('keeps slides full width on mobile and desktop', () => {
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      const carouselItem = document.querySelector('[data-slot="carousel-item"]')
      expect(carouselItem).not.toHaveClass('basis-[calc(100%-2rem)]')
      expect(carouselItem).not.toHaveClass('md:basis-full')
    })

    it('shows mobile navigation arrows with touch-sized targets', () => {
      mockIsMobile = true
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 390,
      })
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      const previousButton = screen.getByRole('button', { name: 'Previous photo' })
      const nextButton = screen.getByRole('button', { name: 'Next photo' })

      expect(previousButton).toHaveClass('flex')
      expect(previousButton).not.toHaveClass('hidden')
      expect(previousButton).toHaveClass('left-3')
      expect(previousButton).toHaveClass('h-11')
      expect(previousButton).toHaveClass('w-11')
      expect(previousButton).toHaveClass('disabled:bg-black/25')
      expect(previousButton).toHaveClass('disabled:text-white/35')
      expect(nextButton).toHaveClass('flex')
      expect(nextButton).not.toHaveClass('hidden')
      expect(nextButton).toHaveClass('right-3')
      expect(nextButton).toHaveClass('h-11')
      expect(nextButton).toHaveClass('w-11')
      expect(nextButton).toHaveClass('disabled:bg-black/25')
      expect(nextButton).toHaveClass('disabled:text-white/35')
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
    it('shows thumbnails by default on desktop when multiple photos exist', async () => {
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /hide thumbnails/i })
        expect(toggleButton).toBeInTheDocument()
        expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
      })
    })

    it('hides thumbnails by default on mobile when multiple photos exist', () => {
      mockIsMobile = true
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 390,
      })
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      const toggleButton = screen.getByRole('button', { name: /show thumbnails/i })
      const thumbnailScrollArea = document.getElementById('thumbnail-scroll-area')

      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
      expect(toggleButton).toHaveClass('text-white/80')
      expect(toggleButton).toHaveClass('py-0.5')
      expect(toggleButton).toHaveClass('h-auto')
      expect(toggleButton).toHaveClass('text-xs')
      expect(toggleButton.querySelector('svg')).toBeInTheDocument()
      expect(thumbnailScrollArea).toHaveClass('h-0')
      expect(screen.queryByRole('button', { name: 'Go to photo 1' })).not.toBeInTheDocument()
    })

    it('expands thumbnails when mobile toggle is clicked', () => {
      mockIsMobile = true
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 390,
      })
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      const toggleButton = screen.getByRole('button', { name: /show thumbnails/i })
      fireEvent.click(toggleButton)

      const expandedToggleButton = screen.getByRole('button', { name: /hide thumbnails/i })
      expect(expandedToggleButton).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('button', { name: 'Go to photo 1' })).toBeInTheDocument()
    })

    it('toggles thumbnails visibility when button is clicked', async () => {
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      const toggleButton = await screen.findByRole('button', { name: /hide thumbnails/i })
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
      fireEvent.click(toggleButton)

      const collapsedToggleButton = screen.getByRole('button', { name: /show thumbnails/i })
      expect(collapsedToggleButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('uses compact thumbnail sizing', async () => {
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      const thumbnailScrollArea = document.getElementById('thumbnail-scroll-area')

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Go to photo 1' })).toBeInTheDocument()
      })

      const thumbnailButton = screen.getByRole('button', { name: 'Go to photo 1' })
      expect(thumbnailScrollArea).toHaveClass('h-20')
      expect(thumbnailScrollArea).toHaveClass('px-3')
      expect(thumbnailScrollArea).toHaveClass('pb-1')
      expect(thumbnailButton).toHaveClass('w-12')
      expect(thumbnailButton).toHaveClass('h-12')
      expect(thumbnailButton).toHaveClass('md:w-14')
      expect(thumbnailButton).toHaveClass('md:h-14')
      expect(screen.getByAltText('Thumbnail 1')).toHaveAttribute(
        'sizes',
        '(max-width: 767px) 48px, 56px'
      )
    })
  })

  describe('Image Loading Failures', () => {
    it('removes a failed image from the visible carousel', async () => {
      const place = createMockPlace()
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      fireEvent.error(screen.getByAltText('Test Coffee Shop photo 1'))

      await waitFor(() => {
        expect(screen.getByText(/Test Coffee Shop - Photo 1 of 2/)).toBeInTheDocument()
      })

      expect(
        document.querySelector('img[src="https://thirdplacesdata.blob.core.windows.net/photos/rec123456/photo-1.webp"]')
      ).not.toBeInTheDocument()
    })

    it('shows the empty state when every image fails', async () => {
      const place = createMockPlace({
        photos: ['https://thirdplacesdata.blob.core.windows.net/photos/rec123456/broken.webp'],
      })
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      fireEvent.error(screen.getByAltText('Test Coffee Shop photo 1'))

      await waitFor(() => {
        expect(screen.getByText('No Photos Available')).toBeInTheDocument()
      })
    })

    it('resets failed image state when switching places', async () => {
      const firstPlace = createMockPlace({
        recordId: 'recFirst',
        name: 'First Cafe',
        photos: [
          'https://thirdplacesdata.blob.core.windows.net/photos/recFirst/photo-1.webp',
          'https://thirdplacesdata.blob.core.windows.net/photos/recFirst/photo-2.webp',
        ],
      })
      const secondPlace = createMockPlace({
        recordId: 'recSecond',
        name: 'Second Cafe',
        photos: [
          'https://thirdplacesdata.blob.core.windows.net/photos/recSecond/photo-1.webp',
          'https://thirdplacesdata.blob.core.windows.net/photos/recSecond/photo-2.webp',
        ],
      })
      const { rerender } = render(<PhotosModal place={firstPlace} open={true} onClose={vi.fn()} />)

      fireEvent.error(screen.getByAltText('First Cafe photo 1'))

      await waitFor(() => {
        expect(screen.getByText(/First Cafe - Photo 1 of 1/)).toBeInTheDocument()
      })

      rerender(<PhotosModal place={secondPlace} open={true} onClose={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByText(/Second Cafe - Photo 1 of 2/)).toBeInTheDocument()
      })
      expect(screen.getByAltText('Second Cafe photo 1')).toHaveAttribute(
        'src',
        'https://thirdplacesdata.blob.core.windows.net/photos/recSecond/photo-1.webp'
      )
    })

    it('uses plain black placeholders for distant slides', () => {
      const place = createMockPlace({
        photos: [
          'https://thirdplacesdata.blob.core.windows.net/photos/rec123456/photo-1.webp',
          'https://thirdplacesdata.blob.core.windows.net/photos/rec123456/photo-2.webp',
          'https://thirdplacesdata.blob.core.windows.net/photos/rec123456/photo-3.webp',
          'https://thirdplacesdata.blob.core.windows.net/photos/rec123456/photo-4.webp',
          'https://thirdplacesdata.blob.core.windows.net/photos/rec123456/photo-5.webp',
          'https://thirdplacesdata.blob.core.windows.net/photos/rec123456/photo-6.webp',
        ],
      })
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      const placeholder = document.querySelector('[aria-hidden="true"].bg-black')

      expect(placeholder).toBeInTheDocument()
      expect(placeholder).toHaveClass('bg-black')
      expect(placeholder).not.toHaveClass('animate-pulse')
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
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

  describe('Azure Blob Photo Sources', () => {
    it('renders with canonical blob storage URLs', () => {
      const place = createMockPlace({
        photos: [
          'https://thirdplacesdata.blob.core.windows.net/photos/recABC/curator-photo.jpg',
          'https://thirdplacesdata.blob.core.windows.net/photos/recABC/provider-photo-1.webp',
          'https://thirdplacesdata.blob.core.windows.net/photos/recABC/provider-photo-2.webp',
        ],
      })
      render(<PhotosModal place={place} open={true} onClose={vi.fn()} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/Photo 1 of 3/)).toBeInTheDocument()
    })
  })
})
