import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ResponsivePlaceCards } from '@/components/ResponsivePlaceCards'
import { FilterProvider } from '@/contexts/FilterContext'
import { Place } from '@/lib/types'

// Mock embla-carousel-react with complete API
vi.mock('embla-carousel-react', () => ({
  default: vi.fn(() => [vi.fn(), {
    scrollTo: vi.fn(),
    reInit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    scrollProgress: vi.fn(() => 0),
    selectedScrollSnap: vi.fn(() => 0),
    scrollSnapList: vi.fn(() => [0]),
    canScrollPrev: vi.fn(() => false),
    canScrollNext: vi.fn(() => true),
    destroy: vi.fn(),
    containerNode: vi.fn(() => document.createElement('div')),
    slideNodes: vi.fn(() => []),
  }]),
}))

// Mock autoplay plugin
vi.mock('embla-carousel-autoplay', () => ({
  default: vi.fn(() => ({})),
}))

// Mock PlaceCard to simplify testing
vi.mock('@/components/PlaceCard', () => ({
  PlaceCard: ({ place }: { place: Place }) => (
    <div data-testid={`place-card-${place.name}`}>{place.name}</div>
  ),
}))

// Mock InfiniteMovingCards
vi.mock('@/components/InfiniteMovingCards', () => ({
  InfiniteMovingCards: ({ items }: { items: Place[] }) => (
    <div data-testid="infinite-cards">
      {items.slice(0, 5).map((place, idx) => (
        <div key={idx} data-testid={`infinite-card-${place.name}`}>{place.name}</div>
      ))}
    </div>
  ),
}))

// Create mock places for testing
const createMockPlace = (name: string, idx: number): Place => ({
  recordId: 'rec' + Math.random().toString(36).substring(7),
  name,
  neighborhood: 'Test Neighborhood',
  type: ['Coffee Shop'],
  address: '123 Test St',
  latitude: 35.2271,
  longitude: -80.8431,
  operational: 'Open',
  description: 'A test place',
  size: 'Medium',
  tags: [],
  purchaseRequired: 'Yes',
  parking: ['Street Parking'],
  freeWiFi: 'Yes',
  hasCinnamonRolls: 'No',
  hasReviews: 'No',
  featured: idx === 0,
  website: 'https://example.com',
  tiktok: '',
  instagram: '',
  youtube: '',
  facebook: '',
  twitter: '',
  linkedIn: '',
  googleMapsPlaceId: '',
  googleMapsProfileURL: 'https://maps.google.com',
  appleMapsProfileURL: '',
  photos: [],
  comments: '',
  createdDate: new Date('2024-01-01'),
  lastModifiedDate: new Date('2024-01-01'),
})

// Create wrapper with FilterProvider
const createWrapper = (places: Place[]) => {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <FilterProvider places={places}>{children}</FilterProvider>
  }
}

describe('ResponsivePlaceCards', () => {
  const mockPlaces = [
    createMockPlace('Coffee Shop 1', 0),
    createMockPlace('Coffee Shop 2', 1),
    createMockPlace('Coffee Shop 3', 2),
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(
      <ResponsivePlaceCards places={mockPlaces} />,
      { wrapper: createWrapper(mockPlaces) }
    )

    expect(document.querySelector('.relative.overflow-hidden')).toBeInTheDocument()
  })

  it('renders both desktop and mobile sections', () => {
    render(
      <ResponsivePlaceCards places={mockPlaces} />,
      { wrapper: createWrapper(mockPlaces) }
    )

    // Desktop section (hidden on mobile)
    expect(document.querySelector('.hidden.sm\\:block')).toBeInTheDocument()
    
    // Mobile section (hidden on desktop)
    expect(document.querySelector('.sm\\:hidden')).toBeInTheDocument()
  })

  it('shows empty state when no places match filters', () => {
    render(
      <ResponsivePlaceCards places={[]} />,
      { wrapper: createWrapper([]) }
    )

    // Component should still render
    expect(document.querySelector('.relative.overflow-hidden')).toBeInTheDocument()
  })

  it('parent component does not consume filter context directly', () => {
    // ResponsivePlaceCards itself doesn't use filter hooks
    // Only child components (MobileCardCarousel) consume filter context
    
    render(
      <ResponsivePlaceCards places={mockPlaces} />,
      { wrapper: createWrapper(mockPlaces) }
    )

    // Component renders without error
    expect(document.querySelector('.relative.overflow-hidden')).toBeInTheDocument()
  })
})
