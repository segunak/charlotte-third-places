import { usePlacePhotos } from '@/hooks/usePlacePhotos'
import type { PlacePhoto } from '@/lib/types'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type PhotoPlace = NonNullable<Parameters<typeof usePlacePhotos>[0]>
const fetchMock = vi.fn<typeof fetch>()
let nextRecord = 0

function createPlace(overrides: Partial<PhotoPlace> = {}): PhotoPlace {
  const recordId = `recPhotoHook${++nextRecord}`
  return {
    recordId,
    photos: [{
      display: `https://example.com/${recordId}/display/cover.webp`,
      thumbnail: `https://example.com/${recordId}/thumbnail/cover.webp`,
    }],
    photoCount: 3,
    ...overrides,
  }
}

function fullPhotos(place: PhotoPlace): PlacePhoto[] {
  return [
    ...place.photos,
    { display: 'https://example.com/display/2.webp', thumbnail: 'https://example.com/thumbnail/2.webp' },
    { display: 'https://example.com/display/3.webp', thumbnail: 'https://example.com/thumbnail/3.webp' },
  ]
}

function photoResponse(place: PhotoPlace, photos = fullPhotos(place)) {
  return Response.json({ recordId: place.recordId, photos })
}

function deferredResponse() {
  let resolve!: (response: Response) => void
  const promise = new Promise<Response>((complete) => { resolve = complete })
  return { promise, resolve }
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('usePlacePhotos', () => {
  it('does not request photos before the gallery opens', () => {
    const place = createPlace()
    const { result } = renderHook(() => usePlacePhotos(place, false))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.photos).toBe(place.photos)
    expect(result.current.isLoading).toBe(false)
  })

  it('does not request photos without a place', () => {
    const { result } = renderHook(() => usePlacePhotos(null, true))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.photos).toEqual([])
  })

  it.each([0, 1, 3])('does not fetch an already complete list of %i photos', (count) => {
    const place = createPlace()
    place.photos = fullPhotos(place).slice(0, count)
    place.photoCount = count
    const { result } = renderHook(() => usePlacePhotos(place, true))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.photos).toBe(place.photos)
  })

  it('uses full records from existing callers without fetching', () => {
    const place = createPlace({ photoCount: undefined })
    const { result } = renderHook(() => usePlacePhotos(place, true))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.photos).toBe(place.photos)
  })

  it('keeps the cover while loading the complete list', async () => {
    const place = createPlace()
    const pending = deferredResponse()
    fetchMock.mockReturnValue(pending.promise)
    const { result } = renderHook(() => usePlacePhotos(place, true))

    expect(result.current.photos).toBe(place.photos)
    expect(result.current.isLoading).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(`/api/places/${place.recordId}`)

    await act(async () => { pending.resolve(photoResponse(place)) })

    expect(result.current.photos).toEqual(fullPhotos(place))
    expect(result.current.isLoading).toBe(false)
  })

  it('shares an in-flight request and reuses cached photos after reopening', async () => {
    const place = createPlace()
    const pending = deferredResponse()
    fetchMock.mockReturnValue(pending.promise)
    const first = renderHook(() => usePlacePhotos(place, true))
    const second = renderHook(() => usePlacePhotos(place, true))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    await act(async () => { pending.resolve(photoResponse(place)) })

    expect(first.result.current.photos).toEqual(fullPhotos(place))
    expect(second.result.current.photos).toEqual(fullPhotos(place))
    first.unmount()
    second.unmount()

    const reopened = renderHook(() => usePlacePhotos(place, true))
    expect(reopened.result.current.photos).toEqual(fullPhotos(place))
    expect(reopened.result.current.isLoading).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not replace another place with a late response', async () => {
    const firstPlace = createPlace()
    const secondPlace = createPlace()
    const firstRequest = deferredResponse()
    const secondRequest = deferredResponse()
    fetchMock.mockReturnValueOnce(firstRequest.promise).mockReturnValueOnce(secondRequest.promise)
    const { result, rerender } = renderHook(
      ({ place }) => usePlacePhotos(place, true),
      { initialProps: { place: firstPlace } }
    )

    rerender({ place: secondPlace })
    await act(async () => { firstRequest.resolve(photoResponse(firstPlace)) })
    expect(result.current.photos).toBe(secondPlace.photos)
    expect(result.current.isLoading).toBe(true)

    await act(async () => { secondRequest.resolve(photoResponse(secondPlace)) })
    expect(result.current.photos).toEqual(fullPhotos(secondPlace))
  })

  it('logs a failed request and permits retry', async () => {
    const place = createPlace()
    fetchMock.mockRejectedValueOnce(new TypeError('Network unavailable')).mockResolvedValueOnce(photoResponse(place))
    const { result } = renderHook(() => usePlacePhotos(place, true))

    await waitFor(() => expect(result.current.error).toBe(true))
    expect(result.current.photos).toBe(place.photos)
    expect(result.current.isLoading).toBe(false)
    expect(console.error).toHaveBeenCalled()

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.photos).toEqual(fullPhotos(place)))
    expect(result.current.error).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it.each([404, 500, 504])('reports HTTP %i instead of caching an empty gallery', async (status) => {
    const place = createPlace()
    fetchMock.mockResolvedValue(new Response('', { status }))
    const { result } = renderHook(() => usePlacePhotos(place, true))

    await waitFor(() => expect(result.current.error).toBe(true))
    expect(result.current.photos).toBe(place.photos)
  })

  it('reports malformed JSON or missing photo arrays as an error', async () => {
    const place = createPlace()
    fetchMock.mockResolvedValueOnce(Response.json({ recordId: place.recordId }))
    const { result } = renderHook(() => usePlacePhotos(place, true))

    await waitFor(() => expect(result.current.error).toBe(true))
    expect(result.current.photos).toBe(place.photos)
  })
})
