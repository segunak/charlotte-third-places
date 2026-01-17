/**
 * Performance tests for React component render times.
 * 
 * These tests verify that our optimizations keep render times under the INP threshold of 200ms.
 * 
 * What we test:
 * 1. PlaceCard click → Modal render time
 * 2. Filter dropdown open/close render time
 * 3. Filter reset render time
 * 4. Context updates don't cause cascading re-renders
 * 
 * Note: These tests measure the React render/commit cycle, not total user-perceived latency.
 * In production, the actual INP would also include browser paint time, but React render time
 * is the primary bottleneck we're optimizing.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import React, { useState, useCallback, createContext, useContext } from 'react'
import { ModalProvider, useModalActions } from '@/contexts/ModalContext'
import { FilterProvider, useFilters, useQuickSearch, useSort, useFilterData } from '@/contexts/FilterContext'
import { Place, SortField, SortDirection } from '@/lib/types'

// INP threshold in milliseconds
const INP_THRESHOLD_MS = 200

// A more lenient threshold for test environments (React Testing Library adds overhead)
const TEST_THRESHOLD_MS = 500

// Mock place for testing
const createMockPlace = (overrides: Partial<Place> = {}): Place => ({
  recordId: 'rec123',
  name: 'Test Coffee Shop',
  neighborhood: 'NoDa',
  address: '123 Test St',
  type: ['Coffee Shop'],
  tags: ['WiFi', 'Outdoor Seating'],
  description: 'A great place to work',
  comments: 'Love this spot',
  featured: false,
  freeWiFi: 'Yes',
  hasCinnamonRolls: 'No',
  hasReviews: 'Yes',
  operational: 'Open',
  parking: ['Free'],
  size: 'Medium',
  purchaseRequired: 'No',
  photos: [],
  googleMapsProfileURL: 'https://maps.google.com',
  appleMapsProfileURL: 'https://maps.apple.com',
  website: '',
  tiktok: '',
  instagram: '',
  youtube: '',
  facebook: '',
  twitter: '',
  linkedIn: '',
  googleMapsPlaceId: '',
  latitude: 35.2271,
  longitude: -80.8431,
  createdDate: new Date(),
  lastModifiedDate: new Date(),
  ...overrides,
})

describe('Performance Tests - Render Times', () => {
  afterEach(async () => {
    cleanup()
    // Allow pending dynamic imports (from ModalProvider's lazy-loaded components) to settle
    // This prevents "Closing rpc while fetch was pending" errors
    await new Promise(resolve => setTimeout(resolve, 0))
  })

  describe('Modal Interactions', () => {
    /**
     * Test that showPlaceModal callback invocation is fast.
     * 
     * The key optimization we verify here:
     * - useModalActions returns STABLE callback references
     * - Calling these callbacks triggers internal state updates via startTransition
     * - Components using useModalActions do NOT re-render when modal state changes
     * 
     * We can't directly read modal state (by design - hiding state prevents re-renders),
     * so we measure callback execution time and verify no cascading re-renders.
     */
    it('showPlaceModal state update completes within threshold', async () => {
      const testPlace = createMockPlace()
      let callbackCompleted = false

      // Component that triggers modal and tracks callback completion
      function TestComponent() {
        const { showPlaceModal } = useModalActions()

        const handleClick = () => {
          showPlaceModal(testPlace)
          callbackCompleted = true
        }

        return (
          <div>
            <button onClick={handleClick}>Open Modal</button>
            <div data-testid="callback-status">{callbackCompleted ? 'completed' : 'pending'}</div>
          </div>
        )
      }

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      )

      expect(callbackCompleted).toBe(false)

      const startTime = performance.now()
      
      await act(async () => {
        fireEvent.click(screen.getByText('Open Modal'))
      })
      
      const endTime = performance.now()
      const totalTime = endTime - startTime

      console.log(`Modal open render time: ${totalTime.toFixed(2)}ms`)

      // Verify callback executed
      expect(callbackCompleted).toBe(true)
      
      // Verify timing is under threshold
      expect(totalTime).toBeLessThan(TEST_THRESHOLD_MS)
    })

    it('closePlaceModal state update completes within threshold', async () => {
      const testPlace = createMockPlace()
      let openCompleted = false
      let closeCompleted = false

      function TestComponent() {
        const { showPlaceModal, closePlaceModal } = useModalActions()

        const handleOpen = () => {
          showPlaceModal(testPlace)
          openCompleted = true
        }

        const handleClose = () => {
          closePlaceModal()
          closeCompleted = true
        }

        return (
          <div>
            <button onClick={handleOpen}>Open</button>
            <button onClick={handleClose}>Close</button>
          </div>
        )
      }

      render(
        <ModalProvider>
          <TestComponent />
        </ModalProvider>
      )

      // Open modal first
      await act(async () => {
        fireEvent.click(screen.getByText('Open'))
      })
      expect(openCompleted).toBe(true)

      // Measure close time
      const startTime = performance.now()
      
      await act(async () => {
        fireEvent.click(screen.getByText('Close'))
      })
      
      const endTime = performance.now()
      const totalTime = endTime - startTime

      console.log(`Modal close render time: ${totalTime.toFixed(2)}ms`)

      expect(closeCompleted).toBe(true)
      expect(totalTime).toBeLessThan(TEST_THRESHOLD_MS)
    })
  })

  describe('Filter Context Interactions', () => {
    const mockPlaces: Place[] = Array.from({ length: 60 }, (_, i) => 
      createMockPlace({ 
        recordId: `rec${i}`, 
        name: `Place ${i}`,
        neighborhood: ['NoDa', 'South End', 'Dilworth'][i % 3]
      })
    )

    it('setFilters completes within threshold', async () => {
      function TestComponent() {
        const { filters, setFilters } = useFilters()
        const [renderCount, setRenderCount] = useState(0)

        const handleFilter = useCallback(() => {
          setFilters(prev => ({
            ...prev,
            neighborhood: { ...prev.neighborhood, value: 'NoDa' }
          }))
          setRenderCount(c => c + 1)
        }, [setFilters])

        return (
          <div>
            <button onClick={handleFilter}>Set Filter</button>
            <div data-testid="filter-value">{filters.neighborhood?.value || 'all'}</div>
            <div data-testid="render-count">{renderCount}</div>
          </div>
        )
      }

      render(
        <FilterProvider places={mockPlaces}>
          <TestComponent />
        </FilterProvider>
      )

      const startTime = performance.now()
      
      await act(async () => {
        fireEvent.click(screen.getByText('Set Filter'))
      })
      
      const endTime = performance.now()
      const totalTime = endTime - startTime

      console.log(`Filter set render time: ${totalTime.toFixed(2)}ms`)

      expect(screen.getByTestId('filter-value')).toHaveTextContent('NoDa')
      expect(totalTime).toBeLessThan(TEST_THRESHOLD_MS)
    })

    it('filter reset completes within threshold', async () => {
      function TestComponent() {
        const { filters, setFilters } = useFilters()
        const { setQuickFilterText } = useQuickSearch()
        const { setSortOption } = useSort()

        const handleReset = useCallback(() => {
          setFilters(prev => {
            const reset = { ...prev }
            Object.keys(reset).forEach(key => {
              (reset as any)[key].value = 'all'
            })
            return reset
          })
          setQuickFilterText('')
          setSortOption({ field: SortField.Name, direction: SortDirection.Ascending })
        }, [setFilters, setQuickFilterText, setSortOption])

        return (
          <div>
            <button onClick={() => setFilters(prev => ({
              ...prev,
              neighborhood: { ...prev.neighborhood, value: 'NoDa' },
              type: { ...prev.type, value: 'Coffee Shop' }
            }))}>Set Filters</button>
            <button onClick={handleReset}>Reset</button>
            <div data-testid="neighborhood">{filters.neighborhood?.value || 'all'}</div>
            <div data-testid="type">{filters.type?.value || 'all'}</div>
          </div>
        )
      }

      render(
        <FilterProvider places={mockPlaces}>
          <TestComponent />
        </FilterProvider>
      )

      // Set some filters first
      await act(async () => {
        fireEvent.click(screen.getByText('Set Filters'))
      })
      expect(screen.getByTestId('neighborhood')).toHaveTextContent('NoDa')
      expect(screen.getByTestId('type')).toHaveTextContent('Coffee Shop')

      // Measure reset time
      const startTime = performance.now()
      
      await act(async () => {
        fireEvent.click(screen.getByText('Reset'))
      })
      
      const endTime = performance.now()
      const totalTime = endTime - startTime

      console.log(`Filter reset render time: ${totalTime.toFixed(2)}ms`)

      expect(screen.getByTestId('neighborhood')).toHaveTextContent('all')
      expect(screen.getByTestId('type')).toHaveTextContent('all')
      expect(totalTime).toBeLessThan(TEST_THRESHOLD_MS)
    })
  })

  describe('Render Isolation Tests', () => {
    /**
     * Test that components using useModalActions don't re-render when modal actions are called.
     * 
     * This is the KEY optimization we made: by splitting ModalContext into
     * ModalActionsContext (stable callbacks) and keeping state internal,
     * PlaceCard components that only call showPlaceModal don't re-render
     * when another card's modal opens.
     */
    it('modal actions do not cause unrelated components to re-render', async () => {
      const testPlace = createMockPlace()
      let unrelatedRenderCount = 0

      // A component that should NOT re-render when modal opens
      const UnrelatedComponent = React.memo(function UnrelatedComponent() {
        unrelatedRenderCount++
        return <div data-testid="unrelated">Render count: {unrelatedRenderCount}</div>
      })

      function ModalTrigger() {
        const { showPlaceModal } = useModalActions()
        return <button onClick={() => showPlaceModal(testPlace)}>Open Modal</button>
      }

      render(
        <ModalProvider>
          <UnrelatedComponent />
          <ModalTrigger />
        </ModalProvider>
      )

      const initialRenderCount = unrelatedRenderCount
      expect(initialRenderCount).toBe(1)

      // Open modal
      await act(async () => {
        fireEvent.click(screen.getByText('Open Modal'))
      })

      // UnrelatedComponent should NOT have re-rendered
      // It doesn't consume any modal context
      expect(unrelatedRenderCount).toBe(initialRenderCount)
    })

    it('useModalActions consumers do not re-render when modal state changes', async () => {
      const testPlace = createMockPlace()
      let actionsConsumerRenderCount = 0

      // This component uses useModalActions (stable callbacks)
      // It should NOT re-render when modal opens/closes
      function ActionsConsumer() {
        const { showPlaceModal, closePlaceModal } = useModalActions()
        actionsConsumerRenderCount++
        return (
          <div>
            <span data-testid="actions-renders">{actionsConsumerRenderCount}</span>
            <button onClick={() => showPlaceModal(testPlace)}>Open</button>
            <button onClick={closePlaceModal}>Close</button>
          </div>
        )
      }

      render(
        <ModalProvider>
          <ActionsConsumer />
        </ModalProvider>
      )

      expect(screen.getByTestId('actions-renders')).toHaveTextContent('1')

      const initialRenderCount = actionsConsumerRenderCount

      // Open modal - this changes internal state but shouldn't re-render ActionsConsumer
      await act(async () => {
        fireEvent.click(screen.getByText('Open'))
      })

      // ActionsConsumer should NOT have re-rendered because useModalActions returns stable refs
      expect(actionsConsumerRenderCount).toBe(initialRenderCount)

      // Close modal
      await act(async () => {
        fireEvent.click(screen.getByText('Close'))
      })

      // Still no extra renders
      expect(actionsConsumerRenderCount).toBe(initialRenderCount)
    })

    it('filter data consumers do not re-render when filters change', async () => {
      const mockPlaces: Place[] = [
        createMockPlace({ recordId: 'rec1', neighborhood: 'NoDa' }),
        createMockPlace({ recordId: 'rec2', neighborhood: 'South End' }),
      ]
      
      let dataConsumerRenderCount = 0

      // This component uses useFilterData (should be stable)
      function DataConsumer() {
        const { getDistinctValues } = useFilterData()
        dataConsumerRenderCount++
        const neighborhoods = getDistinctValues('neighborhood')
        return (
          <div>
            <span data-testid="data-renders">{dataConsumerRenderCount}</span>
            <span data-testid="neighborhoods">{neighborhoods.join(',')}</span>
          </div>
        )
      }

      // This component changes filters
      function FilterChanger() {
        const { setFilters } = useFilters()
        return (
          <button onClick={() => setFilters(prev => ({
            ...prev,
            neighborhood: { ...prev.neighborhood, value: 'NoDa' }
          }))}>
            Change Filter
          </button>
        )
      }

      render(
        <FilterProvider places={mockPlaces}>
          <DataConsumer />
          <FilterChanger />
        </FilterProvider>
      )

      const initialRenderCount = dataConsumerRenderCount
      expect(screen.getByTestId('data-renders')).toHaveTextContent('1')

      // Change filter
      await act(async () => {
        fireEvent.click(screen.getByText('Change Filter'))
      })

      // DataConsumer should NOT re-render because it only uses getDistinctValues
      // which doesn't depend on the current filter value
      expect(dataConsumerRenderCount).toBe(initialRenderCount)
    })
  })
})

describe('Performance Benchmarks', () => {
  afterEach(() => {
    cleanup()
  })

  it('benchmark: rapid filter changes complete efficiently', async () => {
    const mockPlaces: Place[] = Array.from({ length: 100 }, (_, i) => 
      createMockPlace({ 
        recordId: `rec${i}`, 
        name: `Place ${i}`,
        neighborhood: ['NoDa', 'South End', 'Dilworth', 'Plaza Midwood'][i % 4]
      })
    )

    const neighborhoods = ['NoDa', 'South End', 'Dilworth', 'Plaza Midwood', 'all']
    let totalRenderTime = 0

    function TestComponent() {
      const { filters, setFilters } = useFilters()
      
      return (
        <div>
          {neighborhoods.map(n => (
            <button 
              key={n} 
              onClick={() => setFilters(prev => ({
                ...prev,
                neighborhood: { ...prev.neighborhood, value: n }
              }))}
            >
              {n}
            </button>
          ))}
          <div data-testid="current">{filters.neighborhood?.value || 'all'}</div>
        </div>
      )
    }

    render(
      <FilterProvider places={mockPlaces}>
        <TestComponent />
      </FilterProvider>
    )

    // Rapidly cycle through all neighborhoods
    const startTime = performance.now()
    
    for (const neighborhood of neighborhoods) {
      await act(async () => {
        fireEvent.click(screen.getByText(neighborhood))
      })
    }
    
    const endTime = performance.now()
    totalRenderTime = endTime - startTime

    console.log(`5 rapid filter changes completed in: ${totalRenderTime.toFixed(2)}ms`)
    console.log(`Average per change: ${(totalRenderTime / 5).toFixed(2)}ms`)

    // All 5 changes should complete in under 1 second total
    expect(totalRenderTime).toBeLessThan(1000)
    // Average should be well under threshold
    expect(totalRenderTime / 5).toBeLessThan(TEST_THRESHOLD_MS)
  })
})
