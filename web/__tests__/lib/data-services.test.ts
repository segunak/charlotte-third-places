/**
 * Data Services Tests
 *
 * Tests for the Photos-only display contract used by lib/data-services.ts.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import type { parsePlacePhotoManifests as parsePlacePhotoManifestsFn } from '@/lib/data-services'

let parsePlacePhotoManifests: typeof parsePlacePhotoManifestsFn

beforeAll(async () => {
  process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN = 'test-api-key'
  const dataServices = await import('@/lib/data-services')
  parsePlacePhotoManifests = dataServices.parsePlacePhotoManifests
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
