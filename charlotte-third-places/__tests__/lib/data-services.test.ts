/**
 * Data Services Tests
 *
 * Tests for the Photos-only display contract used by lib/data-services.ts.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import type { parsePhotoUrlArray as parsePhotoUrlArrayFn } from '@/lib/data-services'

let parsePhotoUrlArray: typeof parsePhotoUrlArrayFn

beforeAll(async () => {
  process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN = 'test-api-key'
  const dataServices = await import('@/lib/data-services')
  parsePhotoUrlArray = dataServices.parsePhotoUrlArray
})

describe('Photos field parsing', () => {
  it('parses JSON array of Azure blob storage URLs', () => {
    const input = '["https://thirdplacesdata.blob.core.windows.net/curator-photos/recABC/att123_photo.jpg", "https://thirdplacesdata.blob.core.windows.net/place-photos/charlotte/ChIJ123/photo.jpg"]'

    expect(parsePhotoUrlArray(input)).toEqual([
      'https://thirdplacesdata.blob.core.windows.net/curator-photos/recABC/att123_photo.jpg',
      'https://thirdplacesdata.blob.core.windows.net/place-photos/charlotte/ChIJ123/photo.jpg',
    ])
  })

  it('parses runtime arrays of URLs', () => {
    const curatorUrl = 'https://thirdplacesdata.blob.core.windows.net/curator-photos/recABC/att123_photo.jpg'
    const providerUrl = 'https://thirdplacesdata.blob.core.windows.net/place-photos/charlotte/ChIJ123/photo.jpg'

    expect(parsePhotoUrlArray([curatorUrl, providerUrl])).toEqual([
      curatorUrl,
      providerUrl,
    ])
  })

  it('ignores invalid items in runtime arrays', () => {
    const url = 'https://thirdplacesdata.blob.core.windows.net/place-photos/charlotte/ChIJ123/photo.jpg'

    expect(parsePhotoUrlArray([url, '', '   ', null, 12])).toEqual([url])
  })

  it('returns empty array for Python-style array strings', () => {
    const input = "['https://thirdplacesdata.blob.core.windows.net/curator-photos/recABC/att123_photo.jpg']"

    expect(parsePhotoUrlArray(input)).toEqual([])
  })

  it('preserves the curator-first order already stored in Photos', () => {
    const curatorUrl = 'https://thirdplacesdata.blob.core.windows.net/curator-photos/rec1/att1_photo.jpg'
    const providerUrl = 'https://thirdplacesdata.blob.core.windows.net/place-photos/charlotte/ChIJ123/photo.jpg'

    expect(parsePhotoUrlArray(JSON.stringify([curatorUrl, providerUrl]))).toEqual([
      curatorUrl,
      providerUrl,
    ])
  })

  it('returns empty array for empty input', () => {
    expect(parsePhotoUrlArray('')).toEqual([])
    expect(parsePhotoUrlArray('   ')).toEqual([])
    expect(parsePhotoUrlArray(null)).toEqual([])
  })

  it('returns empty array for bare URL input', () => {
    const url = 'https://thirdplacesdata.blob.core.windows.net/place-photos/charlotte/ChIJ123/photo.jpg'

    expect(parsePhotoUrlArray(url)).toEqual([])
  })

  it('returns empty array for malformed JSON and non-array JSON', () => {
    expect(parsePhotoUrlArray('["https://example.com/photo.jpg"')).toEqual([])
    expect(parsePhotoUrlArray('"https://example.com/photo.jpg"')).toEqual([])
    expect(parsePhotoUrlArray('{"url":"https://example.com/photo.jpg"}')).toEqual([])
  })
})
