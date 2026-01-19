/**
 * ModalContext Tests
 *
 * Tests for the ModalContext which manages the global modal state
 * for places, photos, and chat dialogs.
 *
 * Key functionality tested:
 * - showPlaceModal/closePlaceModal state transitions
 * - showPlacePhotos with origin tracking (card vs modal)
 * - closePhotosModal behavior based on origin
 * - showPlaceChat/closeChatDialog
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import type { Place } from '@/lib/types'

// Store references to preloaded modules
let preloadedModules: string[] = []

// Mock the LoadingSpinner
vi.mock('@/components/ui/loading-spinner', () => ({
  LoadingSpinner: () => React.createElement('div', { 'data-testid': 'loading-spinner' }),
}))

// Mock modal components to track preloading
vi.mock('@/components/PlaceModal', () => {
  preloadedModules.push('PlaceModal')
  return {
    PlaceModal: ({ place, open }: { place: any; open: boolean; onClose: () => void }) =>
      open && place ? React.createElement('div', { 'data-testid': 'place-modal' }, place.name) : null
  }
})

vi.mock('@/components/PhotosModal', () => {
  preloadedModules.push('PhotosModal')
  return {
    PhotosModal: ({ place, open }: { place: any; open: boolean; onClose: () => void }) =>
      open && place ? React.createElement('div', { 'data-testid': 'photos-modal' }, `${place.name} Photos`) : null
  }
})

vi.mock('@/components/ChatDialog', () => {
  preloadedModules.push('ChatDialog')
  return {
    ChatDialog: ({ place, open }: { place: any; open: boolean; onClose: () => void }) =>
      open && place ? React.createElement('div', { 'data-testid': 'chat-dialog' }, `${place.name} Chat`) : null
  }
})

// Mock next/dynamic to execute imports synchronously and return mocked components
vi.mock('next/dynamic', () => ({
  default: (importFn: () => Promise<any>) => {
    // Execute the import to get the path, then return appropriate mock
    const importStr = importFn.toString()
    
    if (importStr.includes('PlaceModal')) {
      const MockPlaceModal = ({ place, open }: { place: any; open: boolean; onClose: () => void }) =>
        open && place ? React.createElement('div', { 'data-testid': 'place-modal' }, place.name) : null
      MockPlaceModal.displayName = 'MockPlaceModal'
      return MockPlaceModal
    }
    if (importStr.includes('PhotosModal')) {
      const MockPhotosModal = ({ place, open }: { place: any; open: boolean; onClose: () => void }) =>
        open && place ? React.createElement('div', { 'data-testid': 'photos-modal' }, `${place.name} Photos`) : null
      MockPhotosModal.displayName = 'MockPhotosModal'
      return MockPhotosModal
    }
    if (importStr.includes('ChatDialog')) {
      const MockChatDialog = ({ place, open }: { place: any; open: boolean; onClose: () => void }) =>
        open && place ? React.createElement('div', { 'data-testid': 'chat-dialog' }, `${place.name} Chat`) : null
      MockChatDialog.displayName = 'MockChatDialog'
      return MockChatDialog
    }
    
    // Fallback: return a component that shows loading
    const MockFallback = () => React.createElement('div', { 'data-testid': 'loading-spinner' })
    MockFallback.displayName = 'MockFallback'
    return MockFallback
  },
}))

// Import ModalContext AFTER mocks are set up
import { ModalProvider, useModalContext, useModalActions } from '@/contexts/ModalContext'

/**
 * Factory for creating test Place objects
 */
function createMockPlace(overrides: Partial<Place> = {}): Place {
  return {
    recordId: 'rec123',
    name: 'Test Place',
    description: 'A test place',
    address: '123 Main St',
    neighborhood: 'Test Neighborhood',
    latitude: 35.2271,
    longitude: -80.8431,
    type: ['Coffee Shop'],
    size: 'Medium',
    purchaseRequired: 'Yes',
    parking: ['Street'],
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
    createdDate: new Date(),
    lastModifiedDate: new Date(),
    ...overrides,
  }
}

/**
 * Test component that exposes context methods
 */
function TestConsumer() {
  const {
    showPlaceModal,
    showPlacePhotos,
    showPlaceChat,
    closePlaceModal,
    closePhotosModal,
    closeChatDialog,
  } = useModalContext()

  const testPlace = createMockPlace({ name: 'Test Coffee Shop' })
  const testPlace2 = createMockPlace({ name: 'Another Place', recordId: 'rec456' })

  return (
    <div>
      <button onClick={() => showPlaceModal(testPlace)}>Show Place Modal</button>
      <button onClick={() => showPlacePhotos(testPlace, 'card')}>Show Photos from Card</button>
      <button onClick={() => showPlacePhotos(testPlace, 'modal')}>Show Photos from Modal</button>
      <button onClick={() => showPlaceChat(testPlace2)}>Show Chat</button>
      <button onClick={closePlaceModal}>Close Place Modal</button>
      <button onClick={closePhotosModal}>Close Photos Modal</button>
      <button onClick={closeChatDialog}>Close Chat</button>
    </div>
  )
}

describe('ModalContext', () => {
  describe('PlaceModal', () => {
    it('shows PlaceModal when showPlaceModal is called', () => {
      render(
        <ModalProvider>
          <TestConsumer />
        </ModalProvider>
      )

      expect(screen.queryByTestId('place-modal')).not.toBeInTheDocument()

      fireEvent.click(screen.getByText('Show Place Modal'))

      expect(screen.getByTestId('place-modal')).toBeInTheDocument()
      expect(screen.getByText('Test Coffee Shop')).toBeInTheDocument()
    })

    it('closes PlaceModal when closePlaceModal is called', () => {
      render(
        <ModalProvider>
          <TestConsumer />
        </ModalProvider>
      )

      fireEvent.click(screen.getByText('Show Place Modal'))
      expect(screen.getByTestId('place-modal')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Close Place Modal'))
      expect(screen.queryByTestId('place-modal')).not.toBeInTheDocument()
    })
  })

  describe('PhotosModal', () => {
    it('shows PhotosModal when showPlacePhotos is called', () => {
      render(
        <ModalProvider>
          <TestConsumer />
        </ModalProvider>
      )

      expect(screen.queryByTestId('photos-modal')).not.toBeInTheDocument()

      fireEvent.click(screen.getByText('Show Photos from Card'))

      expect(screen.getByTestId('photos-modal')).toBeInTheDocument()
      expect(screen.getByText('Test Coffee Shop Photos')).toBeInTheDocument()
    })

    it('hides PlaceModal when PhotosModal is shown', () => {
      render(
        <ModalProvider>
          <TestConsumer />
        </ModalProvider>
      )

      // First show place modal
      fireEvent.click(screen.getByText('Show Place Modal'))
      expect(screen.getByTestId('place-modal')).toBeInTheDocument()

      // Then show photos - should hide place modal
      fireEvent.click(screen.getByText('Show Photos from Modal'))
      expect(screen.queryByTestId('place-modal')).not.toBeInTheDocument()
      expect(screen.getByTestId('photos-modal')).toBeInTheDocument()
    })

    it('closes PhotosModal when closePhotosModal is called', () => {
      render(
        <ModalProvider>
          <TestConsumer />
        </ModalProvider>
      )

      fireEvent.click(screen.getByText('Show Photos from Card'))
      expect(screen.getByTestId('photos-modal')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Close Photos Modal'))
      expect(screen.queryByTestId('photos-modal')).not.toBeInTheDocument()
    })
  })

  describe('ChatDialog', () => {
    it('shows ChatDialog when showPlaceChat is called', () => {
      render(
        <ModalProvider>
          <TestConsumer />
        </ModalProvider>
      )

      expect(screen.queryByTestId('chat-dialog')).not.toBeInTheDocument()

      fireEvent.click(screen.getByText('Show Chat'))

      expect(screen.getByTestId('chat-dialog')).toBeInTheDocument()
      expect(screen.getByText('Another Place Chat')).toBeInTheDocument()
    })

    it('closes ChatDialog when closeChatDialog is called', () => {
      render(
        <ModalProvider>
          <TestConsumer />
        </ModalProvider>
      )

      fireEvent.click(screen.getByText('Show Chat'))
      expect(screen.getByTestId('chat-dialog')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Close Chat'))
      expect(screen.queryByTestId('chat-dialog')).not.toBeInTheDocument()
    })

    it('allows ChatDialog and PlaceModal to be open independently', () => {
      render(
        <ModalProvider>
          <TestConsumer />
        </ModalProvider>
      )

      fireEvent.click(screen.getByText('Show Place Modal'))
      fireEvent.click(screen.getByText('Show Chat'))

      // Both should be visible (chat uses a different place)
      expect(screen.getByTestId('place-modal')).toBeInTheDocument()
      expect(screen.getByTestId('chat-dialog')).toBeInTheDocument()
    })
  })

  describe('useModalContext hook', () => {
    it('throws error when used outside ModalProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestConsumer />)
      }).toThrow()

      consoleSpy.mockRestore()
    })
  })

  describe('useModalActions hook', () => {
    /**
     * Test component that uses the optimized useModalActions hook
     * This is the recommended hook for components that trigger modals
     */
    function ActionsTestConsumer() {
      const {
        showPlaceModal,
        showPlacePhotos,
        showPlaceChat,
        closePlaceModal,
        closePhotosModal,
        closeChatDialog,
      } = useModalActions()

      const testPlace = createMockPlace({ name: 'Actions Test Place' })

      return (
        <div>
          <button onClick={() => showPlaceModal(testPlace)}>Actions: Show Modal</button>
          <button onClick={() => showPlacePhotos(testPlace, 'card')}>Actions: Show Photos</button>
          <button onClick={() => showPlaceChat(testPlace)}>Actions: Show Chat</button>
          <button onClick={closePlaceModal}>Actions: Close Modal</button>
          <button onClick={closePhotosModal}>Actions: Close Photos</button>
          <button onClick={closeChatDialog}>Actions: Close Chat</button>
        </div>
      )
    }

    it('throws error when used outside ModalProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<ActionsTestConsumer />)
      }).toThrow('useModalActions must be used within a ModalProvider')

      consoleSpy.mockRestore()
    })

    it('provides working showPlaceModal function', () => {
      render(
        <ModalProvider>
          <ActionsTestConsumer />
        </ModalProvider>
      )

      expect(screen.queryByTestId('place-modal')).not.toBeInTheDocument()

      fireEvent.click(screen.getByText('Actions: Show Modal'))

      expect(screen.getByTestId('place-modal')).toBeInTheDocument()
      expect(screen.getByText('Actions Test Place')).toBeInTheDocument()
    })

    it('provides working showPlacePhotos function', () => {
      render(
        <ModalProvider>
          <ActionsTestConsumer />
        </ModalProvider>
      )

      fireEvent.click(screen.getByText('Actions: Show Photos'))

      expect(screen.getByTestId('photos-modal')).toBeInTheDocument()
    })

    it('provides working showPlaceChat function', () => {
      render(
        <ModalProvider>
          <ActionsTestConsumer />
        </ModalProvider>
      )

      fireEvent.click(screen.getByText('Actions: Show Chat'))

      expect(screen.getByTestId('chat-dialog')).toBeInTheDocument()
    })

    it('provides working close functions', () => {
      render(
        <ModalProvider>
          <ActionsTestConsumer />
        </ModalProvider>
      )

      // Open and close modal
      fireEvent.click(screen.getByText('Actions: Show Modal'))
      expect(screen.getByTestId('place-modal')).toBeInTheDocument()
      fireEvent.click(screen.getByText('Actions: Close Modal'))
      expect(screen.queryByTestId('place-modal')).not.toBeInTheDocument()

      // Open and close photos
      fireEvent.click(screen.getByText('Actions: Show Photos'))
      expect(screen.getByTestId('photos-modal')).toBeInTheDocument()
      fireEvent.click(screen.getByText('Actions: Close Photos'))
      expect(screen.queryByTestId('photos-modal')).not.toBeInTheDocument()

      // Open and close chat
      fireEvent.click(screen.getByText('Actions: Show Chat'))
      expect(screen.getByTestId('chat-dialog')).toBeInTheDocument()
      fireEvent.click(screen.getByText('Actions: Close Chat'))
      expect(screen.queryByTestId('chat-dialog')).not.toBeInTheDocument()
    })

    it('returns the same function references across renders (stable identity)', () => {
      const functionRefs: { showPlaceModal: any[] } = { showPlaceModal: [] }

      function ReferenceTracker() {
        const { showPlaceModal } = useModalActions()
        functionRefs.showPlaceModal.push(showPlaceModal)
        return <button onClick={() => {}}>Trigger Re-render</button>
      }

      const { rerender } = render(
        <ModalProvider>
          <ReferenceTracker />
        </ModalProvider>
      )

      // Force a re-render
      rerender(
        <ModalProvider>
          <ReferenceTracker />
        </ModalProvider>
      )

      // Both references should be the same function
      expect(functionRefs.showPlaceModal.length).toBe(2)
      expect(functionRefs.showPlaceModal[0]).toBe(functionRefs.showPlaceModal[1])
    })
  })

  describe('Preloading', () => {
    let mockRequestIdleCallback: ReturnType<typeof vi.fn>
    let originalRequestIdleCallback: typeof window.requestIdleCallback | undefined

    beforeEach(() => {
      preloadedModules = []
      originalRequestIdleCallback = window.requestIdleCallback
      mockRequestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
        // Execute the callback immediately for testing
        callback({ didTimeout: false, timeRemaining: () => 50 })
        return 1
      })
      // @ts-expect-error - Mocking requestIdleCallback
      window.requestIdleCallback = mockRequestIdleCallback
    })

    afterEach(() => {
      if (originalRequestIdleCallback) {
        window.requestIdleCallback = originalRequestIdleCallback
      } else {
        // @ts-expect-error - Removing the mock if it wasn't originally present
        delete window.requestIdleCallback
      }
    })

    it('uses requestIdleCallback to preload modal chunks', async () => {
      render(
        <ModalProvider>
          <TestConsumer />
        </ModalProvider>
      )

      // requestIdleCallback should have been called
      expect(mockRequestIdleCallback).toHaveBeenCalled()
    })

    it('falls back to setTimeout when requestIdleCallback is not available', async () => {
      // Remove requestIdleCallback to simulate Safari
      // @ts-expect-error - Removing the mock
      delete window.requestIdleCallback
      
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

      render(
        <ModalProvider>
          <TestConsumer />
        </ModalProvider>
      )

      // Should fall back to setTimeout
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000)
      
      setTimeoutSpy.mockRestore()
    })
  })
})
