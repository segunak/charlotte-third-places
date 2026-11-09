/**
 * Data Services Tests
 *
 * Tests for photo manifests and browse records.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import type {
  parsePlacePhotoManifests as parsePlacePhotoManifestsFn,
  copyPlaceWithOnlyFirstPhotoAndTotalPhotoCount as copyPlaceWithOnlyFirstPhotoAndTotalPhotoCountFn,
} from '@/lib/data-services'
import type { Place } from '@/lib/types'

let parsePlacePhotoManifests: typeof parsePlacePhotoManifestsFn
let copyPlaceWithOnlyFirstPhotoAndTotalPhotoCount: typeof copyPlaceWithOnlyFirstPhotoAndTotalPhotoCountFn

beforeAll(async () => {
  process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN = 'test-api-key'
  const dataServices = await import('@/lib/data-services')
  parsePlacePhotoManifests = dataServices.parsePlacePhotoManifests
  copyPlaceWithOnlyFirstPhotoAndTotalPhotoCount = dataServices.copyPlaceWithOnlyFirstPhotoAndTotalPhotoCount
})

describe('Browse records', () => {
  function createPlace(photoCount: number): Place {
    return {
      recordId: 'recBrowse',
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
      featured: true,
      description: 'A place to read.',
      website: 'https://example.com',
      tiktok: '',
      instagram: '',
      youtube: '',
      facebook: '',
      twitter: '',
      linkedIn: '',
      googleMapsPlaceId: 'test-map-id',
      googleMapsProfileURL: 'https://maps.google.com',
      appleMapsProfileURL: 'https://maps.apple.com',
      photos: Array.from({ length: photoCount }, (_, index) => ({
        display: `https://example.com/display/${index}.webp`,
        thumbnail: `https://example.com/thumbnail/${index}.webp`,
      })),
      comments: 'Curator notes.',
      hours: ['Monday: 8:00 AM - 5:00 PM'],
      hoursType: 'Regular',
      latitude: 35.2271,
      longitude: -80.8431,
      createdDate: new Date('2024-01-01T00:00:00Z'),
      lastModifiedDate: new Date('2024-02-01T00:00:00Z'),
    }
  }

  it.each([0, 1, 3])('retains the first photo and complete count for %i photos', (count) => {
    const place = createPlace(count)
    const originalPhotos = [...place.photos]
    const browse = copyPlaceWithOnlyFirstPhotoAndTotalPhotoCount(place)

    expect(browse).toEqual({
      ...place,
      photos: originalPhotos.slice(0, 1),
      photoCount: count,
    })
    expect(browse).not.toBe(place)
    expect(browse.photos).not.toBe(place.photos)
    expect(place.photos).toEqual(originalPhotos)
    expect(place).not.toHaveProperty('photoCount')
  })

  it('preserves the complete count if a browse record is projected again', () => {
    const browse = copyPlaceWithOnlyFirstPhotoAndTotalPhotoCount(createPlace(5))

    expect(copyPlaceWithOnlyFirstPhotoAndTotalPhotoCount(browse)).toEqual(browse)
  })
})

describe('Photos manifest parsing', () => {
  it('parses display and thumbnail photo objects from JSON', () => {
    const displayUrl = 'https://thirdplacesdata.blob.core.windows.net/photos/ChIJ123/display/photo.webp'
    const thumbnailUrl = 'https://thirdplacesdata.blob.core.windows.net/photos/ChIJ123/thumbnail/photo.webp'

    expect(parsePlacePhotoManifests(JSON.stringify([
      { display: displayUrl, thumbnail: thumbnailUrl },
    ]))).toEqual([
      { display: displayUrl, thumbnail: thumbnailUrl },
    ])
  })

  it('parses display and thumbnail photo objects from runtime arrays', () => {
    const displayUrl = 'https://thirdplacesdata.blob.core.windows.net/photos/ChIJ123/display/photo.webp'
    const thumbnailUrl = 'https://thirdplacesdata.blob.core.windows.net/photos/ChIJ123/thumbnail/photo.webp'

    expect(parsePlacePhotoManifests([
      { display: displayUrl, thumbnail: thumbnailUrl },
    ])).toEqual([
      { display: displayUrl, thumbnail: thumbnailUrl },
    ])
  })

  it('ignores URL strings and malformed photo objects', () => {
    const displayUrl = 'https://thirdplacesdata.blob.core.windows.net/photos/ChIJ123/display/photo.webp'
    const thumbnailUrl = 'https://thirdplacesdata.blob.core.windows.net/photos/ChIJ123/thumbnail/photo.webp'

    expect(parsePlacePhotoManifests([
      'https://thirdplacesdata.blob.core.windows.net/photos/ChIJ123/source.webp',
      { display: displayUrl },
      { thumbnail: thumbnailUrl },
      { display: '', thumbnail: thumbnailUrl },
      { display: displayUrl, thumbnail: thumbnailUrl },
    ])).toEqual([
      { display: displayUrl, thumbnail: thumbnailUrl },
    ])
  })

  it('returns empty array for empty input, malformed JSON, and non-array JSON', () => {
    expect(parsePlacePhotoManifests('')).toEqual([])
    expect(parsePlacePhotoManifests('   ')).toEqual([])
    expect(parsePlacePhotoManifests(null)).toEqual([])
    expect(parsePlacePhotoManifests('[{"display":"https://example.com/photo.webp"}')).toEqual([])
    expect(parsePlacePhotoManifests('"https://example.com/photo.webp"')).toEqual([])
    expect(parsePlacePhotoManifests('{"display":"https://example.com/photo.webp"}')).toEqual([])
  })
})
