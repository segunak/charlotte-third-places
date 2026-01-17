/**
 * Prompts Module Tests
 *
 * Tests the prompt formatting utilities used for RAG context injection.
 * These are pure functions that transform place/chunk data into formatted strings.
 *
 * Note: formatPlace and formatChunk are not exported, so we test through
 * createContextMessage which uses them internally.
 */

import { describe, it, expect } from 'vitest'
import { createContextMessage, SYSTEM_PROMPT } from '@/lib/ai/prompts'
import type { PlaceDocument, ChunkDocument } from '@/lib/types'
import type { EntityDetectionResult } from '@/lib/ai/entity-detection'

/**
 * Factory for creating test PlaceDocument objects
 */
function createMockPlaceDocument(overrides: Partial<PlaceDocument> = {}): PlaceDocument {
  return {
    id: 'place-123',
    airtableRecordId: 'rec123456',
    placeName: 'Test Coffee Shop',
    neighborhood: 'South End',
    address: '123 Main St, Charlotte, NC',
    type: 'Coffee Shop',
    description: 'A cozy spot for coffee and work.',
    tags: ['Good for Groups', 'Has Outlets'],
    freeWifi: true,
    parking: ['Street Parking'],
    size: 'Medium',
    purchaseRequired: true,
    comments: 'Curator notes: Great espresso and friendly staff.',
    googleMapsProfileUrl: 'https://maps.google.com/?cid=123',
    appleMapsProfileUrl: 'https://maps.apple.com/?address=123',
    ...overrides,
  }
}

/**
 * Factory for creating test ChunkDocument objects
 */
function createMockChunkDocument(overrides: Partial<ChunkDocument> = {}): ChunkDocument {
  return {
    id: 'chunk-456',
    placeId: 'ChIJ123',
    airtableRecordId: 'rec123456',
    placeName: 'Test Coffee Shop',
    neighborhood: 'South End',
    address: '123 Main St, Charlotte, NC',
    placeType: ['Coffee Shop'],
    placeTags: ['Cozy', 'Good WiFi'],
    reviewText: 'Amazing coffee and great atmosphere!',
    reviewRating: 5,
    googleMapsProfileUrl: 'https://maps.google.com/?cid=123',
    appleMapsProfileUrl: 'https://maps.apple.com/?address=123',
    ...overrides,
  }
}

describe('prompts', () => {
  describe('SYSTEM_PROMPT', () => {
    it('exists and is a non-empty string', () => {
      expect(SYSTEM_PROMPT).toBeDefined()
      expect(typeof SYSTEM_PROMPT).toBe('string')
      expect(SYSTEM_PROMPT.length).toBeGreaterThan(1000)
    })

    it('contains key Charlotte-specific information', () => {
      expect(SYSTEM_PROMPT).toContain('Charlotte')
      expect(SYSTEM_PROMPT).toContain('third places')
    })

    it('contains formatting instructions', () => {
      expect(SYSTEM_PROMPT).toContain('Google Maps')
      expect(SYSTEM_PROMPT).toContain('Apple Maps')
      expect(SYSTEM_PROMPT).toContain('bold')
    })

    it('contains recommendation guidelines', () => {
      expect(SYSTEM_PROMPT).toContain('SINGLE-PLACE MODE')
      expect(SYSTEM_PROMPT).toContain('GENERAL MODE')
    })
  })

  describe('createContextMessage', () => {
    it('returns default message when no context provided', () => {
      const result = createContextMessage({
        places: [],
        chunks: [],
      })

      expect(result).toBe('No specific place information available for this query.')
    })

    it('includes place context header for place-specific chats', () => {
      const placeContext = createMockPlaceDocument({ placeName: 'Focused Place' })

      const result = createContextMessage({
        places: [],
        chunks: [],
        placeContext,
      })

      expect(result).toContain('=== Current Place Being Discussed ===')
      expect(result).toContain('Focused Place')
    })

    it('formats places with relevance scores', () => {
      const places = [
        createMockPlaceDocument({ placeName: 'Coffee One', similarityScore: 0.95 }),
        createMockPlaceDocument({ placeName: 'Coffee Two', similarityScore: 0.87 }),
      ]

      const result = createContextMessage({
        places,
        chunks: [],
      })

      expect(result).toContain('=== Relevant Places ===')
      expect(result).toContain('Coffee One')
      expect(result).toContain('Coffee Two')
      expect(result).toContain('Relevance: 0.95')
      expect(result).toContain('Relevance: 0.87')
    })

    it('formats chunks (reviews) with ratings', () => {
      const chunks = [
        createMockChunkDocument({
          placeName: 'Reviewed Place',
          reviewText: 'Great experience!',
          reviewRating: 5,
          similarityScore: 0.92,
        }),
      ]

      const result = createContextMessage({
        places: [],
        chunks,
      })

      expect(result).toContain('=== Relevant Reviews ===')
      expect(result).toContain('Customer Review: "Great experience!"')
      expect(result).toContain('Customer Rating: 5/5')
    })

    it('includes entity context when neighborhoods are detected', () => {
      const entityContext: EntityDetectionResult = {
        neighborhoods: {
          primary: ['South End', 'Dilworth'],
          nearby: ['Wilmore'],
        },
        tags: [],
      }

      const result = createContextMessage({
        places: [createMockPlaceDocument()],
        chunks: [],
        entityContext,
      })

      expect(result).toContain('=== Query Filter Context ===')
      expect(result).toContain('Primary neighborhoods searched: South End, Dilworth')
      expect(result).toContain('Nearby neighborhoods also included: Wilmore')
    })

    it('includes entity context when tags are detected', () => {
      const entityContext: EntityDetectionResult = {
        neighborhoods: { primary: [], nearby: [] },
        tags: ['Fireplace', 'Good for Groups'],
      }

      const result = createContextMessage({
        places: [createMockPlaceDocument()],
        chunks: [],
        entityContext,
      })

      expect(result).toContain('=== Query Filter Context ===')
      expect(result).toContain('Tags matched: Fireplace, Good for Groups')
    })

    it('includes curator notes prominently', () => {
      const place = createMockPlaceDocument({
        comments: 'Curator says: Hidden gem with amazing pastries.',
      })

      const result = createContextMessage({
        places: [place],
        chunks: [],
      })

      expect(result).toContain('Authoritative Curator Notes:')
      expect(result).toContain('Hidden gem with amazing pastries')
    })

    it('includes place page URLs for hyperlinking', () => {
      const place = createMockPlaceDocument({ airtableRecordId: 'recABC123' })

      const result = createContextMessage({
        places: [place],
        chunks: [],
      })

      expect(result).toContain('Place Page: https://www.charlottethirdplaces.com/places/recABC123')
    })

    it('handles Opening Soon places with special note', () => {
      const place = createMockPlaceDocument({ operational: 'Opening Soon' })

      const result = createContextMessage({
        places: [place],
        chunks: [],
      })

      expect(result).toContain('Operational Status: Opening Soon')
      expect(result).toContain('[AI Note: This place is not yet open')
    })

    it('marks nearby neighborhood places', () => {
      const place = createMockPlaceDocument({ isFromNearbyNeighborhood: true })

      const result = createContextMessage({
        places: [place],
        chunks: [],
      })

      expect(result).toContain('From Nearby Neighborhood: Yes')
    })

    it('includes owner response in reviews when present', () => {
      const chunk = createMockChunkDocument({
        reviewText: 'Good coffee',
        ownerAnswer: 'Thanks for visiting!',
      })

      const result = createContextMessage({
        places: [],
        chunks: [chunk],
      })

      expect(result).toContain('Owner Response: "Thanks for visiting!"')
    })

    it('includes working hours when available', () => {
      const place = createMockPlaceDocument({
        workingHours: {
          Monday: '7am-5pm',
          Tuesday: '7am-5pm',
        },
      })

      const result = createContextMessage({
        places: [place],
        chunks: [],
      })

      expect(result).toContain('Hours:')
      expect(result).toContain('Monday: 7am-5pm')
    })

    it('includes cinnamon rolls field when present', () => {
      const place = createMockPlaceDocument({ hasCinnamonRolls: 'Yes' })

      const result = createContextMessage({
        places: [place],
        chunks: [],
      })

      expect(result).toContain('Has Cinnamon Rolls: Yes')
    })

    it('includes social media profiles when present', () => {
      const place = createMockPlaceDocument({
        instagram: 'https://instagram.com/testcoffee',
        tikTok: 'https://tiktok.com/@testcoffee',
      })

      const result = createContextMessage({
        places: [place],
        chunks: [],
      })

      expect(result).toContain('Social Media Profiles:')
      expect(result).toContain('Instagram:')
    })

    it('includes map profile URLs', () => {
      const place = createMockPlaceDocument({
        googleMapsProfileUrl: 'https://maps.google.com/?cid=123',
        appleMapsProfileUrl: 'https://maps.apple.com/?address=123',
      })

      const result = createContextMessage({
        places: [place],
        chunks: [],
      })

      expect(result).toContain('Google Maps Profile: https://maps.google.com/?cid=123')
      expect(result).toContain('Apple Maps Profile: https://maps.apple.com/?address=123')
    })
  })
})
