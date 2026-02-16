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

    it('appends width parameter to bare Google URLs', () => {
      const url = 'https://lh3.googleusercontent.com/p/AF123'
      expect(optimizeGooglePhotoUrl(url)).toBe(`${url}=w1280-k-no`)
    })

    it('uses custom width when specified', () => {
      const url = 'https://lh3.googleusercontent.com/p/AF123'
      expect(optimizeGooglePhotoUrl(url, 800)).toBe(`${url}=w800-k-no`)
    })

    it('replaces existing size parameters', () => {
      const url = 'https://lh3.googleusercontent.com/p/AF123=s1600'
      expect(optimizeGooglePhotoUrl(url)).toBe(
        'https://lh3.googleusercontent.com/p/AF123=w1280-k-no'
      )
    })

    it('replaces complex size parameters', () => {
      const url = 'https://lh3.googleusercontent.com/p/AF123=w800-h600'
      expect(optimizeGooglePhotoUrl(url)).toBe(
        'https://lh3.googleusercontent.com/p/AF123=w1280-k-no'
      )
    })

    it('replaces size parameters with k-no suffix', () => {
      const url = 'https://lh3.googleusercontent.com/p/AF123=s1600-k-no'
      expect(optimizeGooglePhotoUrl(url)).toBe(
        'https://lh3.googleusercontent.com/p/AF123=w1280-k-no'
      )
    })

    it('returns URL unchanged if already has target width', () => {
      const url = 'https://lh3.googleusercontent.com/p/AF123=w1280'
      expect(optimizeGooglePhotoUrl(url)).toBe(url)
    })

    it('leaves restricted gps-cs-s URLs unchanged', () => {
      const url = 'https://lh3.googleusercontent.com/gps-cs-s/abc123'
      expect(optimizeGooglePhotoUrl(url)).toBe(url)
    })

    it('leaves restricted gps-proxy URLs unchanged', () => {
      const url = 'https://lh3.googleusercontent.com/gps-proxy/abc123'
      expect(optimizeGooglePhotoUrl(url)).toBe(url)
    })
  })
})
