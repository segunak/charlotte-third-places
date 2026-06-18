import { describe, it, expect } from 'vitest'
import { AI_CONFIG, COSMOS_CONFIG, RAG_CONFIG } from '@/lib/ai/config'

describe('AI_CONFIG', () => {
  it('has valid endpoint URL', () => {
    expect(AI_CONFIG.endpoint).toBeDefined()
    expect(AI_CONFIG.endpoint).toMatch(/^https:\/\//)
  })

  it('has chat model configured', () => {
    expect(AI_CONFIG.chatModel).toBeDefined()
    expect(typeof AI_CONFIG.chatModel).toBe('string')
    expect(AI_CONFIG.chatModel.length).toBeGreaterThan(0)
  })

  it('has embedding model configured', () => {
    expect(AI_CONFIG.embeddingModel).toBeDefined()
    expect(AI_CONFIG.embeddingModel).toBe('text-embedding-3-small')
  })

  it('has correct embedding dimensions', () => {
    expect(AI_CONFIG.embeddingDimensions).toBe(1536)
  })

  it('has valid API version', () => {
    expect(AI_CONFIG.apiVersion).toBeDefined()
    expect(AI_CONFIG.apiVersion).toMatch(/^\d{4}-\d{2}-\d{2}/)
  })

  it('has reasonable max output tokens', () => {
    expect(AI_CONFIG.maxOutputTokens).toBeGreaterThan(0)
    expect(AI_CONFIG.maxOutputTokens).toBeLessThanOrEqual(8192)
  })

  it('has temperature in valid range', () => {
    expect(AI_CONFIG.temperature).toBeGreaterThanOrEqual(0)
    expect(AI_CONFIG.temperature).toBeLessThanOrEqual(2)
  })
})

describe('COSMOS_CONFIG', () => {
  it('has database name configured', () => {
    expect(COSMOS_CONFIG.databaseName).toBeDefined()
    expect(COSMOS_CONFIG.databaseName).toBe('third-places')
  })

  it('has places container configured', () => {
    expect(COSMOS_CONFIG.placesContainer).toBeDefined()
    expect(COSMOS_CONFIG.placesContainer).toBe('places')
  })

  it('has chunks container configured', () => {
    expect(COSMOS_CONFIG.chunksContainer).toBeDefined()
    expect(COSMOS_CONFIG.chunksContainer).toBe('chunks')
  })
})

describe('RAG_CONFIG', () => {
  it('has general places search config', () => {
    expect(RAG_CONFIG.generalPlaces).toBeDefined()
    expect(RAG_CONFIG.generalPlaces.topK).toBeGreaterThan(0)
  })

  it('has place-specific places search config', () => {
    expect(RAG_CONFIG.placeSpecificPlaces).toBeDefined()
    expect(RAG_CONFIG.placeSpecificPlaces.topK).toBeGreaterThan(0)
  })

  it('has place-specific chunks search config', () => {
    expect(RAG_CONFIG.placeSpecificChunks).toBeDefined()
    expect(RAG_CONFIG.placeSpecificChunks.topK).toBeGreaterThan(0)
  })

  it('has filtered min score defined', () => {
    expect(RAG_CONFIG.filteredMinScore).toBeDefined()
    // Filtered searches use 0.0 because the filter is the constraint
    expect(RAG_CONFIG.filteredMinScore).toBe(0.0)
  })

  it('has min score thresholds defined', () => {
    // Check that configs have reasonable similarity thresholds
    expect(RAG_CONFIG.generalPlaces.minScore).toBeDefined()
    expect(RAG_CONFIG.generalPlaces.minScore).toBeGreaterThan(0)
    expect(RAG_CONFIG.generalPlaces.minScore).toBeLessThanOrEqual(1)
  })

  it('has proper topK values for different search types', () => {
    // General places needs more results to support variety
    expect(RAG_CONFIG.generalPlaces.topK).toBeGreaterThan(RAG_CONFIG.placeSpecificPlaces.topK)
    // Place-specific chunks for reviews
    expect(RAG_CONFIG.placeSpecificChunks.topK).toBeGreaterThan(RAG_CONFIG.placeSpecificPlaces.topK)
  })
})
