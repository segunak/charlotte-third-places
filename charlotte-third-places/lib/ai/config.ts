/**
 * AI configuration constants for chat and RAG functionality.
 * Uses Azure OpenAI via Microsoft Foundry for chat and embeddings.
 */

// Azure OpenAI / Foundry configuration
export const AI_CONFIG = {
  /** Azure OpenAI endpoint for Foundry */
  endpoint: "https://foundry-third-places.cognitiveservices.azure.com/",
  /** Chat completion model deployment name */
  chatModel: "gpt-5-mini",
  /** Embedding model deployment name */
  embeddingModel: "text-embedding-3-small",
  /** Embedding vector dimensions */
  embeddingDimensions: 1536,
  /** Azure OpenAI API version */
  apiVersion: "2024-05-01-preview",
  /** Max output tokens for chat completion response */
  maxOutputTokens: 1024,
  /** Temperature for chat completion (1 = more creative) */
  temperature: 1,
} as const;

// Cosmos DB configuration
export const COSMOS_CONFIG = {
  /** Database name */
  databaseName: "third-places",
  /** Places container name */
  placesContainer: "places",
  /** Chunks (reviews) container name */
  chunksContainer: "chunks",
} as const;

// RAG search parameters
export const RAG_CONFIG = {
  /** General search - places */
  generalPlaces: {
    topK: 5,
    minScore: 0.7,
  },
  /** General search - chunks (reviews) */
  generalChunks: {
    topK: 10,
    minScore: 0.65,
  },
  /** Place-specific search - places (for broader context) */
  placeSpecificPlaces: {
    topK: 3,
    minScore: 0.7,
  },
  /** Place-specific search - chunks (reviews for that place) */
  placeSpecificChunks: {
    topK: 8,
    minScore: 0.65,
  },
} as const;
