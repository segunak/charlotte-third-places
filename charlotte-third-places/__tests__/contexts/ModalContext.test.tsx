/**
 * ModalContext Tests
 *
 * Tests the surface-stack ModalContext that powers all overlay surfaces
 * (PlaceModal, PhotosModal, ChatModal) as a single LIFO stack.
 *
 * Key functionality tested:
 * - pushPlace / pushPhotos / pushChat append surfaces to the stack
 * - pop / popTo / closeAll reduce the stack via browser history
 * - Nested flows can keep stacking when a visible action opens another modal
 * - showAskAI is FALSE on a PlaceModal that sits above an earlier chat surface
 * - Browser back/forward gestures reduce and restore the stack from history entries
 * - useModalActions returns stable callback references across renders
 * - Lazy modal chunks are preloaded via requestIdleCallback (with setTimeout fallback)
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import type { Place } from '@/lib/types'

// vi.mock factories are hoisted above top-level statements, so any module-scoped
// references they touch must be declared via vi.hoisted to avoid TDZ errors.
type CapturedProps = { place?: Place | null; open?: boolean; zIndex?: number; showAskAI?: boolean }
const hoisted = vi.hoisted(() => ({
  preloadedModules: [] as string[],
  capturedPlaceModalProps: [] as CapturedProps[],
  capturedPhotosModalProps: [] as CapturedProps[],
  capturedChatModalProps: [] as CapturedProps[],
}))
const { capturedPlaceModalProps, capturedPhotosModalProps, capturedChatModalProps } = hoisted

vi.mock('@/components/ui/loading-spinner', () => ({
  LoadingSpinner: () => React.createElement('div', { 'data-testid': 'loading-spinner' }),
}))

// PlaceModal is imported directly by ModalContext, so its mock records props here.
vi.mock('@/components/PlaceModal', () => ({
  PlaceModal: (props: CapturedProps) => {
    hoisted.capturedPlaceModalProps.push(props)
    return props.open && props.place
      ? React.createElement(
          'div',
          { 'data-testid': 'place-modal', 'data-z': props.zIndex, 'data-show-ask-ai': String(props.showAskAI) },
          props.place.name
        )
      : null
  },
}))

// Mock lazy modal modules so raw `import("@/components/...")` calls inside
// preloadModalChunks resolve synchronously. Without these mocks, in-flight
// dynamic imports can outlive the test worker and surface as exit rejections.
vi.mock('@/components/PhotosModal', () => ({ PhotosModal: () => null }))
vi.mock('@/components/ChatModal', () => ({ ChatModal: () => null }))

// Mock next/dynamic so the dynamic imports resolve synchronously to a small
// React component that records the props it was called with. This lets us
// assert on exactly what the provider rendered.
vi.mock('next/dynamic', () => ({
  default: (importFn: () => Promise<unknown>) => {
    const importStr = importFn.toString()
    if (importStr.includes('PhotosModal')) {
      hoisted.preloadedModules.push('PhotosModal')
      const Mock = (props: CapturedProps) => {
        hoisted.capturedPhotosModalProps.push(props)
        return props.open && props.place
          ? React.createElement(
              'div',
              { 'data-testid': 'photos-modal', 'data-z': props.zIndex },
              `${props.place.name} Photos`
            )
          : null
      }
      Mock.displayName = 'MockPhotosModal'
      return Mock
    }
    if (importStr.includes('ChatModal')) {
      hoisted.preloadedModules.push('ChatModal')
      const Mock = (props: CapturedProps) => {
        hoisted.capturedChatModalProps.push(props)
        return props.open && props.place
          ? React.createElement(
              'div',
              { 'data-testid': 'chat-modal', 'data-z': props.zIndex },
              `${props.place.name} Chat`
            )
          : null
      }
      Mock.displayName = 'MockChatModal'
      return Mock
    }
    const Fallback = () => React.createElement('div', { 'data-testid': 'loading-spinner' })
    Fallback.displayName = 'MockFallback'
    return Fallback
  },
}))

// Import AFTER mocks are set up
import { ModalProvider, useModalActions } from '@/contexts/ModalContext'

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
    operatingHours: [],
    comments: '',
    featured: false,
    operational: 'Open',
    createdDate: new Date(),
    lastModifiedDate: new Date(),
    ...overrides,
  }
}
const placeA = createMockPlace({ name: 'Alpha', recordId: 'recA' })
const placeB = createMockPlace({ name: 'Bravo', recordId: 'recB' })
const placeC = createMockPlace({ name: 'Charlie', recordId: 'recC' })
const placeD = createMockPlace({ name: 'Delta', recordId: 'recD' })

function TestConsumer() {
  const actions = useModalActions()
  return (
    <div>
      <button onClick={() => actions.pushPlace(placeA)}>Push A (place)</button>
      <button onClick={() => actions.pushPlace(placeB)}>Push B (place)</button>
      <button onClick={() => actions.pushPlace(placeB, { hideAskAI: true })}>Push B chat-origin place</button>
      <button onClick={() => actions.pushPlace(placeC)}>Push C (place)</button>
      <button onClick={() => actions.pushPlace(placeD)}>Push D (place)</button>
      <button onClick={() => actions.pushPhotos(placeA)}>Push A photos</button>
      <button onClick={() => actions.pushPhotos(placeB)}>Push B photos</button>
      <button onClick={() => actions.pushChat(placeA)}>Push A chat</button>
      <button onClick={() => actions.pushChat(placeB)}>Push B chat</button>
      <button onClick={actions.pop}>Pop</button>
      <button onClick={actions.closeAll}>Close All</button>
    </div>
  )
}

beforeEach(() => {
  hoisted.preloadedModules.length = 0
  capturedPlaceModalProps.length = 0
  capturedPhotosModalProps.length = 0
  capturedChatModalProps.length = 0
  // Reset history between tests so popstate-based tests start clean.
  window.history.replaceState(null, '', window.location.pathname)
})

describe('ModalContext — pushing surfaces', () => {
  it('pushPlace renders a PlaceModal at zIndex 50', () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>
    )
    expect(screen.queryByTestId('place-modal')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Push A (place)'))

    const modal = screen.getByTestId('place-modal')
    expect(modal).toBeInTheDocument()
    expect(modal.getAttribute('data-z')).toBe('50')
    expect(modal).toHaveTextContent('Alpha')
  })

  it('pushPhotos renders a PhotosModal as a stacked surface', () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>
    )
    fireEvent.click(screen.getByText('Push A (place)'))
    fireEvent.click(screen.getByText('Push A photos'))

    expect(screen.getByTestId('place-modal')).toBeInTheDocument()
    const photos = screen.getByTestId('photos-modal')
    expect(photos).toBeInTheDocument()
    expect(photos.getAttribute('data-z')).toBe('60')
  })

  it('pushChat renders a ChatModal as a stacked surface', () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>
    )
    fireEvent.click(screen.getByText('Push A (place)'))
    fireEvent.click(screen.getByText('Push B chat'))

    expect(screen.getByTestId('place-modal')).toBeInTheDocument()
    const chat = screen.getByTestId('chat-modal')
    expect(chat).toBeInTheDocument()
    expect(chat.getAttribute('data-z')).toBe('60')
    expect(chat).toHaveTextContent('Bravo')
  })
})

describe('ModalContext — nested functional surfaces', () => {
  it('allows photos to open after place → chat → chat-linked place', () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>
    )

    fireEvent.click(screen.getByText('Push A (place)'))
    fireEvent.click(screen.getByText('Push A chat'))
    fireEvent.click(screen.getByText('Push B chat-origin place'))
    fireEvent.click(screen.getByText('Push B photos'))

    expect(screen.getAllByTestId('place-modal')).toHaveLength(2)
    expect(screen.getByTestId('chat-modal')).toBeInTheDocument()

    const photos = screen.getByTestId('photos-modal')
    expect(photos).toBeInTheDocument()
    expect(photos).toHaveTextContent('Bravo Photos')
    expect(photos.getAttribute('data-z')).toBe('80')
  })
})

describe('ModalContext — showAskAI derivation', () => {
  it('PlaceModal at the bottom of the stack receives showAskAI=true', () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>
    )
    fireEvent.click(screen.getByText('Push A (place)'))
    const modal = screen.getByTestId('place-modal')
    expect(modal.getAttribute('data-show-ask-ai')).toBe('true')
  })

  it('PlaceModal pushed ABOVE a chat surface receives showAskAI=false', () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>
    )
    // Open chat, then chat opens a place link → push a place above the chat.
    fireEvent.click(screen.getByText('Push A chat'))
    fireEvent.click(screen.getByText('Push B (place)'))

    const places = screen.getAllByTestId('place-modal')
    // Only one place modal rendered; it sits above the chat.
    expect(places).toHaveLength(1)
    expect(places[0].getAttribute('data-show-ask-ai')).toBe('false')
  })

  it('PlaceModal explicitly opened from chat content receives showAskAI=false', () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>
    )
    fireEvent.click(screen.getByText('Push B chat-origin place'))

    const place = screen.getByTestId('place-modal')
    expect(place.getAttribute('data-show-ask-ai')).toBe('false')
  })

  it('PlaceModal pushed BEFORE any chat receives showAskAI=true', () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>
    )
    // Place opened first, then chat above it — the place is below the chat,
    // so its showAskAI was true at the moment it was rendered. The bottom
    // surface should still report true after a chat is pushed above.
    fireEvent.click(screen.getByText('Push A (place)'))
    fireEvent.click(screen.getByText('Push A chat'))

    const place = screen.getByTestId('place-modal')
    expect(place.getAttribute('data-show-ask-ai')).toBe('true')
  })
})

describe('ModalContext — pop / closeAll via history', () => {
  it('pop removes the topmost surface', async () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>
    )
    fireEvent.click(screen.getByText('Push A (place)'))
    fireEvent.click(screen.getByText('Push B chat'))

    expect(screen.getByTestId('place-modal')).toBeInTheDocument()
    expect(screen.getByTestId('chat-modal')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByText('Pop'))
    })

    expect(screen.queryByTestId('chat-modal')).not.toBeInTheDocument()
    expect(screen.getByTestId('place-modal')).toBeInTheDocument()
  })

  it('closeAll empties the entire stack', async () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>
    )
    fireEvent.click(screen.getByText('Push A (place)'))
    fireEvent.click(screen.getByText('Push A photos'))

    await act(async () => {
      fireEvent.click(screen.getByText('Close All'))
    })

    expect(screen.queryByTestId('place-modal')).not.toBeInTheDocument()
    expect(screen.queryByTestId('photos-modal')).not.toBeInTheDocument()
  })

  it('browser back gesture (popstate) trims the stack to history depth', async () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>
    )
    fireEvent.click(screen.getByText('Push A (place)'))
    fireEvent.click(screen.getByText('Push B chat'))
    expect(screen.getByTestId('chat-modal')).toBeInTheDocument()

    // Simulate the browser back button (Android PWA gesture, browser back arrow).
    await act(async () => {
      window.history.back()
    })

    expect(screen.queryByTestId('chat-modal')).not.toBeInTheDocument()
    expect(screen.getByTestId('place-modal')).toBeInTheDocument()
  })

  it('browser forward gesture restores a surface closed by back', async () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>
    )
    fireEvent.click(screen.getByText('Push A (place)'))
    fireEvent.click(screen.getByText('Push B chat'))
    expect(screen.getByTestId('chat-modal')).toBeInTheDocument()

    await act(async () => {
      window.history.back()
    })
    await waitFor(() => {
      expect(screen.queryByTestId('chat-modal')).not.toBeInTheDocument()
    })

    await act(async () => {
      window.history.forward()
    })

    await waitFor(() => {
      expect(screen.getByTestId('chat-modal')).toBeInTheDocument()
    })
    expect(screen.getByTestId('place-modal')).toBeInTheDocument()
  })
})

describe('ModalContext — useModalActions hook', () => {
  it('throws when used outside a ModalProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    function Bare() {
      useModalActions()
      return null
    }
    expect(() => render(<Bare />)).toThrow('useModalActions must be used within a ModalProvider')
    consoleSpy.mockRestore()
  })

  it('returns stable function references across renders', () => {
    const refs: { pushPlace: unknown[] } = { pushPlace: [] }
    function Tracker() {
      const { pushPlace } = useModalActions()
      refs.pushPlace.push(pushPlace)
      return null
    }
    const { rerender } = render(
      <ModalProvider>
        <Tracker />
      </ModalProvider>
    )
    rerender(
      <ModalProvider>
        <Tracker />
      </ModalProvider>
    )
    expect(refs.pushPlace).toHaveLength(2)
    expect(refs.pushPlace[0]).toBe(refs.pushPlace[1])
  })
})

describe('ModalContext — preloading', () => {
  let mockRequestIdleCallback: ReturnType<typeof vi.fn>
  let originalRequestIdleCallback: typeof window.requestIdleCallback | undefined

  beforeEach(() => {
    originalRequestIdleCallback = window.requestIdleCallback
    mockRequestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
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

  it('uses requestIdleCallback to preload modal chunks', () => {
    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>
    )
    expect(mockRequestIdleCallback).toHaveBeenCalled()
  })

  it('falls back to setTimeout when requestIdleCallback is not available', () => {
    // @ts-expect-error - Removing the mock
    delete window.requestIdleCallback
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    render(
      <ModalProvider>
        <TestConsumer />
      </ModalProvider>
    )

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000)
    setTimeoutSpy.mockRestore()
  })
})
