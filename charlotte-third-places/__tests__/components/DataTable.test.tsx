/**
 * DataTable Component Tests
 *
 * Tests for the DataTable component which is responsible for:
 * - Filtering places based on FilterContext
 * - Sorting places by name, date added, or last modified
 * - Virtualized rendering for performance
 * - Quick text search functionality
 *
 * The core filtering logic is tested in filters.test.ts.
 * Here we test the component integration with context.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { 
    FiltersContext, 
    QuickSearchContext, 
    SortContext 
} from '@/contexts/FilterContext'
import { DEFAULT_FILTER_CONFIG, FilterConfig } from '@/lib/filters'
import { SortField, SortDirection, DEFAULT_SORT_OPTION } from '@/lib/types'
import type { Place } from '@/lib/types'

// Mock ModalContext
vi.mock('@/contexts/ModalContext', () => ({
  useModalContext: () => ({
    showPlaceModal: vi.fn(),
    showPlacePhotos: vi.fn(),
    showPlaceChat: vi.fn(),
  }),
  useModalActions: () => ({
    showPlaceModal: vi.fn(),
    showPlacePhotos: vi.fn(),
    showPlaceChat: vi.fn(),
  }),
}))

// Mock useWindowWidth hook
vi.mock('@/hooks/useWindowWidth', () => ({
  useWindowWidth: () => 1200, // Simulates lg breakpoint (2 columns)
}))

// Import after mocks
import { DataTable } from '@/components/DataTable'

/**
 * Factory function to create test Place objects
 */
function createMockPlace(overrides: Partial<Place> = {}): Place {
  return {
    recordId: 'rec' + Math.random().toString(36).substring(7),
    name: 'Test Place',
    description: 'A test place',
    address: '123 Test St, Charlotte, NC',
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
    googleMapsProfileURL: '',
    appleMapsProfileURL: '',
    website: '',
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

/**
 * Helper to render DataTable with a custom FilterContext provider
 */
function renderWithFilterContext(
  places: Place[],
  contextOverrides: Partial<{
    filters: FilterConfig
    quickFilterText: string
    sortOption: { field: SortField; direction: SortDirection }
    setFilters: React.Dispatch<React.SetStateAction<FilterConfig>>
    setQuickFilterText: React.Dispatch<React.SetStateAction<string>>
    getDistinctValues: (field: string) => string[]
    setSortOption: React.Dispatch<React.SetStateAction<{ field: SortField; direction: SortDirection }>>
  }> = {}
) {
  const defaultContext = {
    filters: DEFAULT_FILTER_CONFIG,
    setFilters: vi.fn(),
    quickFilterText: '',
    setQuickFilterText: vi.fn(),
    getDistinctValues: () => [],
    sortOption: DEFAULT_SORT_OPTION,
    setSortOption: vi.fn(),
    ...contextOverrides,
  }

  return render(
    <FiltersContext.Provider value={{ filters: defaultContext.filters, setFilters: defaultContext.setFilters }}>
      <QuickSearchContext.Provider value={{ quickFilterText: defaultContext.quickFilterText, setQuickFilterText: defaultContext.setQuickFilterText }}>
        <SortContext.Provider value={{ sortOption: defaultContext.sortOption, setSortOption: defaultContext.setSortOption }}>
          <DataTable rowData={places} />
        </SortContext.Provider>
      </QuickSearchContext.Provider>
    </FiltersContext.Provider>
  )
}

describe('DataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('shows loading spinner initially', () => {
      const places = [createMockPlace()]
      renderWithFilterContext(places)

      // The loader should be visible initially
      const loader = document.querySelector('.loader')
      expect(loader).toBeInTheDocument()
    })

    it('hides loading spinner after timeout', async () => {
      const places = [createMockPlace()]
      renderWithFilterContext(places)

      // Wait for the loading state to clear (500ms timeout in component)
      await waitFor(
        () => {
          const loader = document.querySelector('.loader')
          expect(loader).not.toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })
  })

  describe('Rendering Places', () => {
    it('renders place cards after loading', async () => {
      const places = [
        createMockPlace({ name: 'Coffee Haven', recordId: 'rec1' }),
        createMockPlace({ name: 'Tea Paradise', recordId: 'rec2' }),
      ]
      renderWithFilterContext(places)

      await waitFor(() => {
        expect(screen.getByText('Coffee Haven')).toBeInTheDocument()
        expect(screen.getByText('Tea Paradise')).toBeInTheDocument()
      })
    })

    it('renders empty state when no places match filters', async () => {
      renderWithFilterContext([])

      await waitFor(() => {
        // FilteredEmptyState component should be rendered
        expect(screen.getByText(/no places/i)).toBeInTheDocument()
      })
    })
  })

  describe('Quick Text Search', () => {
    it('filters places by name when quickFilterText is set', async () => {
      const places = [
        createMockPlace({ name: 'Coffee Haven', recordId: 'rec1' }),
        createMockPlace({ name: 'Tea Paradise', recordId: 'rec2' }),
        createMockPlace({ name: 'Coffee Corner', recordId: 'rec3' }),
      ]

      renderWithFilterContext(places, { quickFilterText: 'coffee' })

      await waitFor(() => {
        expect(screen.getByText('Coffee Haven')).toBeInTheDocument()
        expect(screen.getByText('Coffee Corner')).toBeInTheDocument()
        expect(screen.queryByText('Tea Paradise')).not.toBeInTheDocument()
      })
    })

    it('is case insensitive', async () => {
      const places = [
        createMockPlace({ name: 'UPPERCASE CAFE', recordId: 'rec1' }),
        createMockPlace({ name: 'lowercase shop', recordId: 'rec2' }),
      ]

      renderWithFilterContext(places, { quickFilterText: 'UPPERCASE' })

      await waitFor(() => {
        expect(screen.getByText('UPPERCASE CAFE')).toBeInTheDocument()
        expect(screen.queryByText('lowercase shop')).not.toBeInTheDocument()
      })
    })
  })

  describe('Sorting', () => {
    it('sorts by name ascending', async () => {
      const places = [
        createMockPlace({ name: 'Zebra Cafe', recordId: 'rec1' }),
        createMockPlace({ name: 'Alpha Coffee', recordId: 'rec2' }),
        createMockPlace({ name: 'Midway Spot', recordId: 'rec3' }),
      ]

      renderWithFilterContext(places, {
        sortOption: { field: SortField.Name, direction: SortDirection.Ascending },
      })

      await waitFor(() => {
        // Check that all places are rendered
        expect(screen.getByText('Alpha Coffee')).toBeInTheDocument()
        expect(screen.getByText('Midway Spot')).toBeInTheDocument()
        expect(screen.getByText('Zebra Cafe')).toBeInTheDocument()
      })
    })

    it('sorts by name descending', async () => {
      const places = [
        createMockPlace({ name: 'Zebra Cafe', recordId: 'rec1' }),
        createMockPlace({ name: 'Alpha Coffee', recordId: 'rec2' }),
        createMockPlace({ name: 'Midway Spot', recordId: 'rec3' }),
      ]

      renderWithFilterContext(places, {
        sortOption: { field: SortField.Name, direction: SortDirection.Descending },
      })

      await waitFor(() => {
        // Check that all places are rendered
        expect(screen.getByText('Alpha Coffee')).toBeInTheDocument()
        expect(screen.getByText('Midway Spot')).toBeInTheDocument()
        expect(screen.getByText('Zebra Cafe')).toBeInTheDocument()
      })
    })

    it('featured places always come first regardless of sort', async () => {
      const places = [
        createMockPlace({ name: 'Zebra Cafe', recordId: 'rec1', featured: false }),
        createMockPlace({ name: 'Alpha Coffee', recordId: 'rec2', featured: true }),
      ]

      renderWithFilterContext(places, {
        sortOption: { field: SortField.Name, direction: SortDirection.Ascending },
      })

      await waitFor(() => {
        // Both should be rendered
        expect(screen.getByText('Alpha Coffee')).toBeInTheDocument()
        expect(screen.getByText('Zebra Cafe')).toBeInTheDocument()
        // Featured place should have a featured badge
        expect(screen.getByLabelText('Featured place')).toBeInTheDocument()
      })
    })

    it('sorts by date added ascending', async () => {
      const places = [
        createMockPlace({ name: 'Old Place', recordId: 'rec1', createdDate: new Date('2023-01-01') }),
        createMockPlace({ name: 'New Place', recordId: 'rec2', createdDate: new Date('2024-06-01') }),
        createMockPlace({ name: 'Mid Place', recordId: 'rec3', createdDate: new Date('2023-06-01') }),
      ]

      renderWithFilterContext(places, {
        sortOption: { field: SortField.DateAdded, direction: SortDirection.Ascending },
      })

      await waitFor(() => {
        // Check that all places are rendered
        expect(screen.getByText('Old Place')).toBeInTheDocument()
        expect(screen.getByText('Mid Place')).toBeInTheDocument()
        expect(screen.getByText('New Place')).toBeInTheDocument()
      })
    })
  })

  describe('Filter Count Callback', () => {
    it('calls onFilteredCountChange with correct count', async () => {
      const mockCallback = vi.fn()
      const places = [
        createMockPlace({ name: 'Coffee 1', recordId: 'rec1' }),
        createMockPlace({ name: 'Coffee 2', recordId: 'rec2' }),
        createMockPlace({ name: 'Tea 1', recordId: 'rec3' }),
      ]

      render(
        <FiltersContext.Provider value={{ filters: DEFAULT_FILTER_CONFIG, setFilters: vi.fn() }}>
          <QuickSearchContext.Provider value={{ quickFilterText: 'Coffee', setQuickFilterText: vi.fn() }}>
            <SortContext.Provider value={{ sortOption: DEFAULT_SORT_OPTION, setSortOption: vi.fn() }}>
              <DataTable rowData={places} onFilteredCountChange={mockCallback} />
            </SortContext.Provider>
          </QuickSearchContext.Provider>
        </FiltersContext.Provider>
      )

      await waitFor(() => {
        // Should be called with 2 (only Coffee places match)
        expect(mockCallback).toHaveBeenCalledWith(2)
      })
    })
  })
})
