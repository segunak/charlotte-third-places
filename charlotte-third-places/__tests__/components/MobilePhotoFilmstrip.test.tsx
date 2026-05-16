import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MobilePhotoFilmstrip } from '@/components/MobilePhotoFilmstrip'
import type { CarouselApi } from '@/components/ui/carousel'

const photos = [
  'https://thirdplacesdata.blob.core.windows.net/photos/rec123456/photo-1.webp',
  'https://thirdplacesdata.blob.core.windows.net/photos/rec123456/photo-2.webp',
  'https://thirdplacesdata.blob.core.windows.net/photos/rec123456/photo-3.webp',
]

function createMockCarouselApi(initialIndex = 0) {
  let selectedIndex = initialIndex
  const selectHandlers = new Set<() => void>()
  const apiMock = {
    selectedScrollSnap: vi.fn(() => selectedIndex),
    scrollTo: vi.fn((index: number) => {
      selectedIndex = index
      selectHandlers.forEach(handler => handler())
    }),
    on: vi.fn((eventName: string, handler: () => void) => {
      if (eventName === 'select') selectHandlers.add(handler)
      return apiMock
    }),
    off: vi.fn((eventName: string, handler: () => void) => {
      if (eventName === 'select') selectHandlers.delete(handler)
      return apiMock
    }),
  }

  return {
    api: apiMock as unknown as CarouselApi,
    scrollTo: apiMock.scrollTo,
    setSelectedIndex: (index: number) => {
      selectedIndex = index
      selectHandlers.forEach(handler => handler())
    },
  }
}

function renderFilmstrip(api: CarouselApi) {
  return render(
    <MobilePhotoFilmstrip
      photos={photos}
      api={api}
      placeId="rec123456"
      testId="test-filmstrip"
      trackTestId="test-filmstrip-track"
      thumbTestId={(idx) => `test-filmstrip-thumb-${idx}`}
    />
  )
}

describe('MobilePhotoFilmstrip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
  })

  it('renders native overflow thumbs with fixed-size plain images', () => {
    const { api } = createMockCarouselApi()
    renderFilmstrip(api)

    const filmstrip = screen.getByTestId('test-filmstrip')
    const track = screen.getByTestId('test-filmstrip-track')
    const firstThumb = screen.getByTestId('test-filmstrip-thumb-0')
    const firstImg = firstThumb.querySelector('img')

    expect(filmstrip).toHaveClass('overflow-x-auto')
    expect(filmstrip).toHaveClass('[touch-action:pan-x]')
    expect(track).toHaveClass('px-3')
    expect(track).not.toHaveAttribute('style')
    expect(firstImg).toHaveAttribute('width', '40')
    expect(firstImg).toHaveAttribute('height', '40')
    expect(firstImg).toHaveAttribute('loading', 'lazy')
  })

  it('marks the active thumb imperatively when the carousel selects a new slide', () => {
    const { api, setSelectedIndex } = createMockCarouselApi()
    renderFilmstrip(api)

    expect(screen.getByTestId('test-filmstrip-thumb-0')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('test-filmstrip-thumb-2')).toHaveAttribute('data-active', 'false')

    act(() => {
      setSelectedIndex(2)
    })

    expect(screen.getByTestId('test-filmstrip-thumb-0')).toHaveAttribute('data-active', 'false')
    expect(screen.getByTestId('test-filmstrip-thumb-0')).toHaveAttribute('aria-current', 'false')
    expect(screen.getByTestId('test-filmstrip-thumb-2')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('test-filmstrip-thumb-2')).toHaveAttribute('aria-current', 'true')
  })

  it('scrolls the carousel when a thumb is tapped', () => {
    const { api, scrollTo } = createMockCarouselApi()
    renderFilmstrip(api)

    fireEvent.click(screen.getByTestId('test-filmstrip-thumb-1'))

    expect(scrollTo).toHaveBeenCalledWith(1)
  })
})