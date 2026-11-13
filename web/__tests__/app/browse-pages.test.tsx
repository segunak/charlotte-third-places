import HomePage, { dynamic as homeDynamic } from '@/app/page'
import MapPage, { dynamic as mapDynamic } from '@/app/map/page'
import sitemap from '@/app/sitemap'
import { getPlaces } from '@/lib/data-services'
import type { Place } from '@/lib/types'
import { isValidElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/data-services', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/data-services')>(),
  getPlaces: vi.fn(),
}))
vi.mock('@/components/HomePageClient', () => ({ default: () => null }))
vi.mock('@/components/PlaceMap', () => ({ PlaceMap: () => null }))

const place: Place = {
  recordId: 'recPageBrowse',
  name: 'Test Cafe',
  operational: 'Yes',
  type: ['Coffee Shop'],
  size: 'Medium',
  tags: ['Quiet'],
  neighborhood: 'Uptown',
  address: '123 Main St',
  purchaseRequired: 'Yes',
  parking: ['Street'],
  freeWiFi: 'Yes',
  hasCinnamonRolls: 'No',
  hasReviews: 'Yes',
  featured: false,
  description: 'A place to read.',
  website: '',
  tiktok: '',
  instagram: '',
  youtube: '',
  facebook: '',
  twitter: '',
  linkedIn: '',
  googleMapsPlaceId: '',
  googleMapsProfileURL: '',
  appleMapsProfileURL: '',
  photos: [
    { display: 'https://example.com/display/1.webp', thumbnail: 'https://example.com/thumbnail/1.webp' },
    { display: 'https://example.com/display/2.webp', thumbnail: 'https://example.com/thumbnail/2.webp' },
    { display: 'https://example.com/display/3.webp', thumbnail: 'https://example.com/thumbnail/3.webp' },
  ],
  comments: 'Curator notes.',
  hours: [],
  latitude: 35.2271,
  longitude: -80.8431,
  createdDate: new Date('2024-01-01T00:00:00Z'),
  lastModifiedDate: new Date('2024-02-01T00:00:00Z'),
}

beforeEach(() => {
  vi.mocked(getPlaces).mockReset().mockResolvedValue([place])
})

describe.each([
  { name: 'home', renderPage: HomePage, dynamic: homeDynamic },
  { name: 'map', renderPage: MapPage, dynamic: mapDynamic },
])('$name browse page', ({ renderPage, dynamic }) => {
  it('retains static rendering', () => {
    expect(dynamic).toBe('force-static')
  })

  it('passes only cover photos and complete counts across the client boundary', async () => {
    const page = await renderPage()
    if (!isValidElement<{ places: Place[] }>(page)) {
      throw new Error('Expected a browse page element')
    }

    expect(getPlaces).toHaveBeenCalledTimes(1)
    expect(page.props.places).toEqual([{
      ...place,
      photos: [place.photos[0]],
      photoCount: 3,
    }])
    expect(place.photos).toHaveLength(3)
    expect(place).not.toHaveProperty('photoCount')
  })
})

describe('sitemap determinism', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('produces identical output across different wall-clock times when places are unchanged', async () => {
    vi.useFakeTimers()

    vi.setSystemTime(new Date('2026-07-15T12:00:00.000Z'))
    const first = await sitemap()

    vi.setSystemTime(new Date('2026-11-12T23:59:59.000Z'))
    const second = await sitemap()

    expect(first).toEqual(second)
    expect(first[0].lastModified).toEqual(place.lastModifiedDate)
    expect(first[1].lastModified).toEqual(place.lastModifiedDate)
  })
})
