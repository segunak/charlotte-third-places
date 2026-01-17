import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CardCarousel } from '@/components/CardCarousel'
import { Place } from '@/lib/types'

// Mock embla-carousel-react with complete API
const mockScrollTo = vi.fn()
const mockReInit = vi.fn()
const mockOn = vi.fn()
const mockOff = vi.fn()

const mockEmblaApi = {
  scrollTo: mockScrollTo,
  reInit: mockReInit,
  on: mockOn,
  off: mockOff,
  scrollProgress: vi.fn(() => 0),
  selectedScrollSnap: vi.fn(() => 0),
  scrollSnapList: vi.fn(() => [0]),
  canScrollPrev: vi.fn(() => false),
  canScrollNext: vi.fn(() => true),
  destroy: vi.fn(),
  containerNode: vi.fn(() => document.createElement('div')),
  slideNodes: vi.fn(() => []),
}

vi.mock('embla-carousel-react', () => ({
  default: vi.fn(() => [vi.fn(), mockEmblaApi]),
}))

// Mock PlaceCard to simplify testing
vi.mock('@/components/PlaceCard', () => ({
  PlaceCard: ({ place }: { place: Place }) => (
    <div data-testid={`place-card-${place.name}`}>{place.name}</div>
  ),
}))

// Create mock places for testing
const createMockPlace = (name: string): Place => ({
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
  featured: false,
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

describe('CardCarousel', () => {
  const mockPlaces = [
    createMockPlace('Coffee Shop 1'),
    createMockPlace('Coffee Shop 2'),
    createMockPlace('Coffee Shop 3'),
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all place items in carousel', () => {
    render(
      <CardCarousel
        items={mockPlaces}
        initialIndex={0}
        total={mockPlaces.length}
      />
    )

    expect(screen.getByTestId('place-card-Coffee Shop 1')).toBeInTheDocument()
    expect(screen.getByTestId('place-card-Coffee Shop 2')).toBeInTheDocument()
    expect(screen.getByTestId('place-card-Coffee Shop 3')).toBeInTheDocument()
  })

  it('calls emblaApi.scrollTo on initial mount', async () => {
    render(
      <CardCarousel
        items={mockPlaces}
        initialIndex={1}
        total={mockPlaces.length}
      />
    )

    await waitFor(() => {
      expect(mockScrollTo).toHaveBeenCalledWith(1, true)
    })
  })

  it('calls reInit when items change', async () => {
    const { rerender } = render(
      <CardCarousel
        items={mockPlaces}
        initialIndex={0}
        total={mockPlaces.length}
      />
    )

    // Clear mock to only track new calls
    mockReInit.mockClear()
    mockScrollTo.mockClear()

    // Rerender with new items
    const newPlaces = [
      createMockPlace('New Coffee Shop 1'),
      createMockPlace('New Coffee Shop 2'),
    ]

    rerender(
      <CardCarousel
        items={newPlaces}
        initialIndex={0}
        total={newPlaces.length}
      />
    )

    await waitFor(() => {
      expect(mockReInit).toHaveBeenCalled()
    })
  })

  it('uses instant scroll flag (true)', async () => {
    render(
      <CardCarousel
        items={mockPlaces}
        initialIndex={2}
        total={mockPlaces.length}
      />
    )

    await waitFor(() => {
      // Second argument should be true for instant scroll
      expect(mockScrollTo).toHaveBeenCalledWith(2, true)
    })
  })

  it('re-scrolls when initialIndex changes', async () => {
    const { rerender } = render(
      <CardCarousel
        items={mockPlaces}
        initialIndex={0}
        total={mockPlaces.length}
      />
    )

    mockScrollTo.mockClear()

    rerender(
      <CardCarousel
        items={mockPlaces}
        initialIndex={2}
        total={mockPlaces.length}
      />
    )

    await waitFor(() => {
      expect(mockScrollTo).toHaveBeenCalledWith(2, true)
    })
  })

  it('renders correct number of carousel items', () => {
    const fivePlaces = [
      createMockPlace('Place 1'),
      createMockPlace('Place 2'),
      createMockPlace('Place 3'),
      createMockPlace('Place 4'),
      createMockPlace('Place 5'),
    ]

    render(
      <CardCarousel
        items={fivePlaces}
        initialIndex={0}
        total={fivePlaces.length}
      />
    )

    // Should render all 5 places
    expect(screen.getByTestId('place-card-Place 1')).toBeInTheDocument()
    expect(screen.getByTestId('place-card-Place 2')).toBeInTheDocument()
    expect(screen.getByTestId('place-card-Place 3')).toBeInTheDocument()
    expect(screen.getByTestId('place-card-Place 4')).toBeInTheDocument()
    expect(screen.getByTestId('place-card-Place 5')).toBeInTheDocument()
  })
})
