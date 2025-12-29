/**
 * Photo Utilities Tests
 *
 * Tests for the photo URL processing utilities used in PhotosModal and PlacePageClient.
 * These are pure string transformation functions.
 *
 * Since these utilities are currently defined inline in components,
 * this file tests them by reimplementing the same logic.
 * Consider extracting these to a shared utility file.
 */

import { describe, it, expect } from 'vitest'

// Reimplementing the utility functions for testing
// These match the implementations in PhotosModal.tsx and PlacePageClient.tsx
function cleanPhotoUrl(url: string): string {
  if (typeof url === 'string' && url.startsWith('http')) {
    return url.trim()
  }
  return ''
}

function optimizeGooglePhotoUrl(url: string, width = 1280): string {
  const cleanedUrl = cleanPhotoUrl(url)

  // Early returns for invalid URLs or special cases
  if (!cleanedUrl) return ''
  // Assume non-google URLs are already optimized or don't support this
  if (!cleanedUrl.includes('googleusercontent.com')) return cleanedUrl

  // Most problematic URLs should be filtered out by backend, but this is a fallback
  if (cleanedUrl.includes('/gps-cs-s/') || cleanedUrl.includes('/gps-proxy/')) {
    return cleanedUrl
  }

  // Check if already has desired width parameter (more robust check)
  const widthParamRegex = new RegExp(`=[whs]${width}(-[^=]+)?$`)
  if (widthParamRegex.test(cleanedUrl)) return cleanedUrl

  // Try replacing existing size parameters (e.g., =s1600, =w800-h600)
  const sizeRegex = /=[swh]\d+(-[swh]\d+)?(-k-no)?$/
  if (sizeRegex.test(cleanedUrl)) {
    return cleanedUrl.replace(sizeRegex, `=w${width}-k-no`)
  }

  // If URL has other parameters but no size, append (less common)
  if (cleanedUrl.includes('=') && !sizeRegex.test(cleanedUrl)) {
    // Avoid appending if it might break other params; return as is
    return cleanedUrl
  }

  // If no parameters, append the width parameter
  if (!cleanedUrl.includes('=')) {
    return cleanedUrl + `=w${width}-k-no`
  }

  // Default fallback: return cleaned URL if unsure
  return cleanedUrl
}

describe('Photo Utilities', () => {
  describe('cleanPhotoUrl', () => {
    it('returns empty string for non-string input', () => {
      // @ts-expect-error testing invalid input
      expect(cleanPhotoUrl(null)).toBe('')
      // @ts-expect-error testing invalid input
      expect(cleanPhotoUrl(undefined)).toBe('')
      // @ts-expect-error testing invalid input
      expect(cleanPhotoUrl(123)).toBe('')
    })

    it('returns empty string for non-http URLs', () => {
      expect(cleanPhotoUrl('')).toBe('')
      expect(cleanPhotoUrl('not-a-url')).toBe('')
      expect(cleanPhotoUrl('ftp://example.com/photo.jpg')).toBe('')
    })

    it('returns trimmed URL for valid http URLs', () => {
      expect(cleanPhotoUrl('http://example.com/photo.jpg')).toBe('http://example.com/photo.jpg')
      expect(cleanPhotoUrl('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg')
    })

    it('handles URLs with leading/trailing whitespace', () => {
      // URL with leading whitespace doesn't start with 'http' so returns empty
      expect(cleanPhotoUrl('  https://example.com/photo.jpg  ')).toBe('')
      // URL with only trailing whitespace works and gets trimmed
      expect(cleanPhotoUrl('https://example.com/photo.jpg  ')).toBe(
        'https://example.com/photo.jpg'
      )
    })
  })

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
