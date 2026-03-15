/**
 * Photo Utilities Tests
 *
 * Tests for the photo URL processing utilities defined in lib/utils.ts
 * and used by PhotosModal and PlacePageClient.
 */

import { describe, it, expect } from 'vitest'
import { optimizeGooglePhotoUrl } from '@/lib/utils'

describe('Photo Utilities', () => {
  describe('optimizeGooglePhotoUrl', () => {
    it('returns empty string for invalid URLs', () => {
      expect(optimizeGooglePhotoUrl('')).toBe('')
      expect(optimizeGooglePhotoUrl('not-a-url')).toBe('')
    })

    it('returns non-Google URLs unchanged', () => {
      const url = 'https://example.com/photo.jpg'
      expect(optimizeGooglePhotoUrl(url)).toBe(url)
    })

    it('returns Cloudflare URLs unchanged', () => {
      const url = 'https://imagedelivery.net/abc123/image.jpg'
      expect(optimizeGooglePhotoUrl(url)).toBe(url)
    })

    it('appends width and webp parameters to bare Google URLs', () => {
      const url = 'https://lh3.googleusercontent.com/p/AF123'
      expect(optimizeGooglePhotoUrl(url)).toBe(`${url}=w1280-rw-v1-k-no`)
    })

    it('uses custom width when specified', () => {
      const url = 'https://lh3.googleusercontent.com/p/AF123'
      expect(optimizeGooglePhotoUrl(url, 800)).toBe(`${url}=w800-rw-v1-k-no`)
    })

    it('replaces existing size parameters', () => {
      const url = 'https://lh3.googleusercontent.com/p/AF123=s1600'
      expect(optimizeGooglePhotoUrl(url)).toBe(
        'https://lh3.googleusercontent.com/p/AF123=w1280-rw-v1-k-no'
      )
    })

    it('replaces complex size parameters', () => {
      const url = 'https://lh3.googleusercontent.com/p/AF123=w800-h600'
      expect(optimizeGooglePhotoUrl(url)).toBe(
        'https://lh3.googleusercontent.com/p/AF123=w1280-rw-v1-k-no'
      )
    })

    it('replaces size parameters with k-no suffix', () => {
      const url = 'https://lh3.googleusercontent.com/p/AF123=s1600-k-no'
      expect(optimizeGooglePhotoUrl(url)).toBe(
        'https://lh3.googleusercontent.com/p/AF123=w1280-rw-v1-k-no'
      )
    })

    it('replaces size parameters that already have rw but no v1', () => {
      const url = 'https://lh3.googleusercontent.com/p/AF123=w2048-rw-k-no'
      expect(optimizeGooglePhotoUrl(url)).toBe(
        'https://lh3.googleusercontent.com/p/AF123=w1280-rw-v1-k-no'
      )
    })

    it('returns URL unchanged if already has target width and rw', () => {
      const url = 'https://lh3.googleusercontent.com/p/AF123=w1280-rw-v1-k-no'
      expect(optimizeGooglePhotoUrl(url)).toBe(url)
    })

    it('optimizes gps-cs-s URLs with width and webp parameters', () => {
      const url = 'https://lh3.googleusercontent.com/gps-cs-s/abc123=w2048-h2048-k-no'
      expect(optimizeGooglePhotoUrl(url)).toBe(
        'https://lh3.googleusercontent.com/gps-cs-s/abc123=w1280-rw-v1-k-no'
      )
    })

    it('appends parameters to bare gps-cs-s URLs', () => {
      const url = 'https://lh3.googleusercontent.com/gps-cs-s/abc123'
      expect(optimizeGooglePhotoUrl(url)).toBe(`${url}=w1280-rw-v1-k-no`)
    })

    it('optimizes gps-proxy URLs with width and webp parameters', () => {
      const url = 'https://lh3.googleusercontent.com/gps-proxy/abc123=w2048-h2048-k-no'
      expect(optimizeGooglePhotoUrl(url)).toBe(
        'https://lh3.googleusercontent.com/gps-proxy/abc123=w1280-rw-v1-k-no'
      )
    })

    it('leaves Street View URLs unchanged', () => {
      const url = 'https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=abc&w=1600&h=1000'
      expect(optimizeGooglePhotoUrl(url)).toBe(url)
    })

    it('returns Azure Blob Storage URLs unchanged', () => {
      const url = 'https://thirdplacesdata.blob.core.windows.net/curator-photos/recABC/att123_photo.jpg'
      expect(optimizeGooglePhotoUrl(url)).toBe(url)
    })
  })
})
