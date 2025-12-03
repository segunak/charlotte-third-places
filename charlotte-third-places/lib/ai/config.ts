/**
 * AI configuration constants for chat and RAG functionality.
 * Uses Azure OpenAI via Microsoft Foundry for chat and embeddings.
 *
 * Azure OpenAI REST API Reference:
 * @see https://learn.microsoft.com/en-us/azure/ai-foundry/openai/reference?view=foundry-classic
 *
 * Microsoft Foundry SDKs and Endpoints:
 * @see https://learn.microsoft.com/en-us/azure/ai-foundry/how-to/develop/sdk-overview?view=foundry&pivots=programming-language-javascript
 *
 * URL Format (deployment-based):
 * POST https://{endpoint}/openai/deployments/{deployment-id}/chat/completions?api-version={version}
 * Example: https://foundry-third-places.cognitiveservices.azure.com/openai/deployments/gpt-5-mini/chat/completions?api-version=2024-05-01-preview
 */

// Azure OpenAI / Foundry configuration
export const AI_CONFIG = {
  /** Azure OpenAI endpoint for Foundry */
  endpoint: "https://foundry-third-places.cognitiveservices.azure.com/",
  /** Chat completion model deployment name */
  chatModel: "gpt-4.1-mini",
  /** Embedding model deployment name */
  embeddingModel: "text-embedding-3-small",
  /** Embedding vector dimensions */
  embeddingDimensions: 1536,
  /** Azure OpenAI API version */
  apiVersion: "2024-05-01-preview",
  /** Max output tokens for chat completion response (balance between completeness and speed) */
  maxOutputTokens: 1536,
  /**
   * Temperature for chat completion - controls randomness/creativity of responses.
   * 
   * Temperature Guide for Charlotte Third Places:
   * 
   * 0.0  - Deterministic. Same question = identical answer every time.
   *        "Best coffee shop?" always returns exact same places in same order.
   * 
   * 0.3  - Very focused. Mostly consistent recommendations with minor variation.
   *        Might occasionally swap #2 and #3. Good for factual Q&A.
   * 
   * 0.5  - Balanced. Some variation in which places are highlighted, but predictable.
   * 
   * 0.7  - Moderate creativity. Industry default for chat. Good variety in recommendations.
   *        Same question might highlight different places from the pool.
   * 
   * 0.8  - More creative. LLM more willing to pick "interesting" places over obvious
   *        top matches. More varied sentence structure. Good for discovery.
   * 
   * 0.9  - High creativity. Noticeably different answers each time. May make unexpected
   *        connections ("this brewery has a cozy reading nook!"). Great for variety.
   *        Sweet spot for discovery/recommendation apps with rich context.
   * 
   * 1.0  - Maximum useful creativity. Very diverse answers, each feels fresh. May include
   *        tangential info or creative flourishes. Risk: occasionally picks less-relevant
   *        places just for variety.
   * 
   * 1.2+ - Chaotic. Not recommended. Inconsistent, sometimes nonsensical responses.
   *        Hallucination risk increases significantly.
   */
  temperature: 1.0,
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
  /** General search - places (topK=25 for variety, minScore=0.65 for hidden gems) */
  generalPlaces: {
    topK: 25,
    minScore: 0.65,
  },
  /** General search - chunks (reviews) */
  generalChunks: {
    topK: 10,
    minScore: 0.7,
  },
  /** Place-specific search - places (for broader context) */
  placeSpecificPlaces: {
    topK: 3,
    minScore: 0.7,
  },
  /** Place-specific search - chunks (reviews for that place) */
  placeSpecificChunks: {
    topK: 15,
    minScore: 0.7,
  },
} as const;
