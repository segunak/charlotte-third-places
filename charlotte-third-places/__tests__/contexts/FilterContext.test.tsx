/**
 * FilterContext Tests
 *
 * Tests for the FilterContext provider which manages:
 * - Filter state across the application
 * - Quick search text state
 * - Sort option state
 * - getDistinctValues function for populating filter dropdowns
 *
 * This is a critical piece of the application that powers
 * all filtering and sorting functionality.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useContext } from 'react'
import { FilterContext, FilterProvider } from '@/contexts/FilterContext'
import { DEFAULT_SORT_OPTION, SortField, SortDirection } from '@/lib/types'
import type { Place } from '@/lib/types'

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
 * Test component to access and display context values
 */
function FilterContextConsumer({
  onContext,
}: {
  onContext: (context: ReturnType<typeof useContext<typeof FilterContext>>) => void
}) {
  const context = useContext(FilterContext)
  onContext(context)
  return (
    <div>
      <span data-testid="quick-filter">{context.quickFilterText}</span>
      <span data-testid="sort-field">{context.sortOption.field}</span>
      <span data-testid="sort-direction">{context.sortOption.direction}</span>
    </div>
  )
}

describe('FilterContext', () => {
  describe('Default Values', () => {
    it('provides default filter config', () => {
      let capturedContext: any
      const places = [createMockPlace()]

      render(
        <FilterProvider places={places}>
          <FilterContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </FilterProvider>
      )

      expect(capturedContext.filters).toBeDefined()
      expect(capturedContext.filters.neighborhood).toBeDefined()
      expect(capturedContext.filters.type).toBeDefined()
      expect(capturedContext.filters.size).toBeDefined()
    })

    it('provides empty quick filter text by default', () => {
      const places = [createMockPlace()]

      render(
        <FilterProvider places={places}>
          <FilterContextConsumer onContext={() => {}} />
        </FilterProvider>
      )

      expect(screen.getByTestId('quick-filter').textContent).toBe('')
    })

    it('provides default sort option', () => {
      const places = [createMockPlace()]

      render(
        <FilterProvider places={places}>
          <FilterContextConsumer onContext={() => {}} />
        </FilterProvider>
      )

      expect(screen.getByTestId('sort-field').textContent).toBe(DEFAULT_SORT_OPTION.field)
      expect(screen.getByTestId('sort-direction').textContent).toBe(DEFAULT_SORT_OPTION.direction)
    })
  })

  describe('State Updates', () => {
    it('updates quick filter text', () => {
      let capturedContext: any
      const places = [createMockPlace()]

      render(
        <FilterProvider places={places}>
          <FilterContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </FilterProvider>
      )

      act(() => {
        capturedContext.setQuickFilterText('coffee')
      })

      expect(screen.getByTestId('quick-filter').textContent).toBe('coffee')
    })

    it('updates sort option', () => {
      let capturedContext: any
      const places = [createMockPlace()]

      render(
        <FilterProvider places={places}>
          <FilterContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </FilterProvider>
      )

      act(() => {
        capturedContext.setSortOption({
          field: SortField.DateAdded,
          direction: SortDirection.Descending,
        })
      })

      expect(screen.getByTestId('sort-field').textContent).toBe(SortField.DateAdded)
      expect(screen.getByTestId('sort-direction').textContent).toBe(SortDirection.Descending)
    })

    it('updates filter values', () => {
      let capturedContext: any
      const places = [createMockPlace({ neighborhood: 'NoDa' })]

      render(
        <FilterProvider places={places}>
          <FilterContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </FilterProvider>
      )

      act(() => {
        capturedContext.setFilters((prev: any) => ({
          ...prev,
          neighborhood: { ...prev.neighborhood, value: 'NoDa' },
        }))
      })

      expect(capturedContext.filters.neighborhood.value).toBe('NoDa')
    })
  })

  describe('getDistinctValues', () => {
    it('returns distinct neighborhood values from places', () => {
      let capturedContext: any
      const places = [
        createMockPlace({ neighborhood: 'Uptown' }),
        createMockPlace({ neighborhood: 'NoDa' }),
        createMockPlace({ neighborhood: 'Uptown' }), // Duplicate
        createMockPlace({ neighborhood: 'South End' }),
      ]

      render(
        <FilterProvider places={places}>
          <FilterContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </FilterProvider>
      )

      const neighborhoods = capturedContext.getDistinctValues('neighborhood')

      expect(neighborhoods).toContain('Uptown')
      expect(neighborhoods).toContain('NoDa')
      expect(neighborhoods).toContain('South End')
      // Should have 3 unique values, not 4
      expect(neighborhoods.length).toBe(3)
    })

    it('returns distinct type values (flattened from arrays)', () => {
      let capturedContext: any
      const places = [
        createMockPlace({ type: ['Coffee Shop', 'Bakery'] }),
        createMockPlace({ type: ['Coffee Shop'] }), // Duplicate
        createMockPlace({ type: ['Restaurant'] }),
      ]

      render(
        <FilterProvider places={places}>
          <FilterContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </FilterProvider>
      )

      const types = capturedContext.getDistinctValues('type')

      expect(types).toContain('Coffee Shop')
      expect(types).toContain('Bakery')
      expect(types).toContain('Restaurant')
      expect(types.length).toBe(3)
    })

    it('returns distinct size values', () => {
      let capturedContext: any
      const places = [
        createMockPlace({ size: 'Small' }),
        createMockPlace({ size: 'Medium' }),
        createMockPlace({ size: 'Large' }),
        createMockPlace({ size: 'Medium' }), // Duplicate
      ]

      render(
        <FilterProvider places={places}>
          <FilterContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </FilterProvider>
      )

      const sizes = capturedContext.getDistinctValues('size')

      expect(sizes).toContain('Small')
      expect(sizes).toContain('Medium')
      expect(sizes).toContain('Large')
      expect(sizes.length).toBe(3)
    })

    it('filters out empty string values', () => {
      let capturedContext: any
      const places = [
        createMockPlace({ neighborhood: 'Uptown' }),
        createMockPlace({ neighborhood: '' }), // Empty
        createMockPlace({ neighborhood: 'NoDa' }),
      ]

      render(
        <FilterProvider places={places}>
          <FilterContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </FilterProvider>
      )

      const neighborhoods = capturedContext.getDistinctValues('neighborhood')

      expect(neighborhoods).not.toContain('')
      expect(neighborhoods.length).toBe(2)
    })

    it('sorts values alphabetically by default', () => {
      let capturedContext: any
      const places = [
        createMockPlace({ neighborhood: 'Uptown' }),
        createMockPlace({ neighborhood: 'NoDa' }),
        createMockPlace({ neighborhood: 'Belmont' }),
      ]

      render(
        <FilterProvider places={places}>
          <FilterContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </FilterProvider>
      )

      const neighborhoods = capturedContext.getDistinctValues('neighborhood')

      // Should be alphabetically sorted
      expect(neighborhoods[0]).toBe('Belmont')
      expect(neighborhoods[1]).toBe('NoDa')
      expect(neighborhoods[2]).toBe('Uptown')
    })

    it('respects predefinedOrder when specified', () => {
      let capturedContext: any
      const places = [
        createMockPlace({ size: 'Large' }),
        createMockPlace({ size: 'Small' }),
        createMockPlace({ size: 'Medium' }),
      ]

      render(
        <FilterProvider places={places}>
          <FilterContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </FilterProvider>
      )

      const sizes = capturedContext.getDistinctValues('size')

      // Size should follow predefined order: Small, Medium, Large
      expect(sizes[0]).toBe('Small')
      expect(sizes[1]).toBe('Medium')
      expect(sizes[2]).toBe('Large')
    })

    it('returns empty array when no places provided', () => {
      let capturedContext: any
      const places: Place[] = []

      render(
        <FilterProvider places={places}>
          <FilterContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </FilterProvider>
      )

      const neighborhoods = capturedContext.getDistinctValues('neighborhood')

      expect(neighborhoods).toEqual([])
    })
  })

  describe('Filter Definitions Integration', () => {
    it('has predefined order for size filter', () => {
      let capturedContext: any
      const places = [createMockPlace()]

      render(
        <FilterProvider places={places}>
          <FilterContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </FilterProvider>
      )

      expect(capturedContext.filters.size.predefinedOrder).toBeDefined()
      expect(capturedContext.filters.size.predefinedOrder).toContain('Small')
      expect(capturedContext.filters.size.predefinedOrder).toContain('Medium')
      expect(capturedContext.filters.size.predefinedOrder).toContain('Large')
    })

    it('all filter keys have value initialized to "all"', () => {
      let capturedContext: any
      const places = [createMockPlace()]

      render(
        <FilterProvider places={places}>
          <FilterContextConsumer onContext={(ctx) => (capturedContext = ctx)} />
        </FilterProvider>
      )

      Object.keys(capturedContext.filters).forEach((key) => {
        expect(capturedContext.filters[key].value).toBe('all')
      })
    })
  })
})
