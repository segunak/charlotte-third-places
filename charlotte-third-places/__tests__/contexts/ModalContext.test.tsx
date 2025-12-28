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

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModalProvider, useModalContext } from '@/contexts/ModalContext'
import type { Place } from '@/lib/types'

// Mock the modal components to avoid complex rendering
vi.mock('@/components/PlaceModal', () => ({
  PlaceModal: ({ place, open }: { place: Place | null; open: boolean }) =>
    open && place ? <div data-testid="place-modal">{place.name}</div> : null,
}))

vi.mock('@/components/PhotosModal', () => ({
  PhotosModal: ({ place, open }: { place: Place | null; open: boolean }) =>
    open && place ? <div data-testid="photos-modal">{place.name} Photos</div> : null,
}))

vi.mock('@/components/ChatDialog', () => ({
  ChatDialog: ({ place, open }: { place: Place | null; open: boolean }) =>
    open && place ? <div data-testid="chat-dialog">{place.name} Chat</div> : null,
}))

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
})
