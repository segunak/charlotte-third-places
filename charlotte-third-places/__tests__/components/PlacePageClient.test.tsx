import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Place } from '@/lib/types'

let mockIsMobile = false

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockIsMobile,
}))

vi.mock('@/components/PlaceContent', () => ({
  PlaceContent: ({ place }: { place: Place }) => <div data-testid="place-content">{place.recordId}</div>,
}))

vi.mock('@/components/ChatModal', () => ({
  ChatModal: () => null,
}))

vi.mock('@/components/PlaceHighlights', () => ({
  getPlaceHighlights: () => ({
    ribbon: null,
    gradients: { card: '' },
    badges: [],
  }),
}))

vi.mock('@/lib/operating-hours', () => ({
  injectDynamicTags: (places: Place[]) => places,
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, fill: _fill, quality: _quality, placeholder: _placeholder, fetchPriority, ...props }: { src: string; alt: string; fill?: boolean; quality?: number; placeholder?: string; fetchPriority?: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-fetch-priority={fetchPriority} {...props} />
  ),
}))

import { PlacePageClient } from '@/components/PlacePageClient'

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

describe('PlacePageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsMobile = false
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  it('uses the native mobile filmstrip instead of the thumbnail ScrollArea branch', () => {
    mockIsMobile = true
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 390,
    })

    render(<PlacePageClient place={createMockPlace()} />)

    const filmstrip = screen.getByTestId('place-page-photo-filmstrip')
    const track = screen.getByTestId('place-page-photo-filmstrip-track')
    const firstThumb = screen.getByTestId('place-page-filmstrip-thumb-0')
    const firstImg = firstThumb.querySelector('img')

    expect(filmstrip).toBeInTheDocument()
    expect(filmstrip).toHaveClass('overflow-x-auto')
    expect(filmstrip).toHaveClass('[touch-action:pan-x]')
    expect(filmstrip).toHaveClass('bg-card')
    expect(filmstrip).toHaveClass('border-t')
    expect(filmstrip).not.toHaveClass('bg-black/80')
    expect(filmstrip).not.toHaveClass('bg-black/90')
    expect(track).toHaveClass('px-3')
    expect(screen.queryByRole('button', { name: /hide thumbnails/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /show thumbnails/i })).not.toBeInTheDocument()
    expect(screen.queryByAltText('Thumbnail 1')).not.toBeInTheDocument()
    expect(firstThumb).toHaveAttribute('data-active', 'true')
    expect(firstImg).toHaveAttribute('width', '40')
    expect(firstImg).toHaveAttribute('height', '40')
  })

  it('keeps the existing desktop thumbnail controls', () => {
    render(<PlacePageClient place={createMockPlace()} />)

    expect(screen.queryByTestId('place-page-photo-filmstrip')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hide thumbnails/i })).toBeInTheDocument()
    expect(screen.getByAltText('Thumbnail 1')).toHaveAttribute('sizes', '64px')
  })
})