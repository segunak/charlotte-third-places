/**
 * RAG (Retrieval-Augmented Generation) orchestration service.
 * Coordinates embedding generation, vector search, and context building.
 */

import { getEmbedding } from "./embedding";
import {
  getPlaceById,
  getChunksByPlaceId,
  vectorSearchPlaces,
  vectorSearchChunks,
  type PlaceDocument,
  type ChunkDocument,
} from "./cosmos";
import { createContextMessage } from "./prompts";
import { RAG_CONFIG } from "./config";

export interface RAGResult {
  /** Formatted context message for injection into system prompt */
  context: string;
  /** Number of places found */
  placesCount: number;
  /** Number of chunks (reviews) found */
  chunksCount: number;
  /** Place ID if this was a place-specific search */
  placeId?: string;
}

export interface RAGParams {
  /** The user's query to search for */
  query: string;
  /** Optional place ID for place-specific chat */
  placeId?: string;
}

/**
 * Perform RAG retrieval and build context for chat.
 * 
 * If placeId is provided:
 * - Direct lookup of the place document for full context
 * - Vector search of that place's reviews only
 * - Also get related places for broader context
 * 
 * If no placeId:
 * - Vector search across all places
 * - Vector search across all reviews
 * 
 * @param params - Query and optional placeId
 * @returns RAG result with formatted context
 */
export async function performRAG({ query, placeId }: RAGParams): Promise<RAGResult> {
  // Generate embedding for the query
  const queryEmbedding = await getEmbedding(query);

  let placeContext: PlaceDocument | null = null;
  let places: PlaceDocument[] = [];
  let chunks: ChunkDocument[] = [];

  if (placeId) {
    // Place-specific search
    // 1. Direct lookup of the place for full context
    placeContext = await getPlaceById(placeId);

    // 2. Vector search of that place's reviews
    chunks = await vectorSearchChunks(
      queryEmbedding,
      RAG_CONFIG.placeSpecificChunks.topK,
      RAG_CONFIG.placeSpecificChunks.minScore,
      placeId
    );

    // 3. Also get related places for broader context
    places = await vectorSearchPlaces(
      queryEmbedding,
      RAG_CONFIG.placeSpecificPlaces.topK,
      RAG_CONFIG.placeSpecificPlaces.minScore
    );
  } else {
    // General search across all places and reviews
    const [placesResult, chunksResult] = await Promise.all([
      vectorSearchPlaces(
        queryEmbedding,
        RAG_CONFIG.generalPlaces.topK,
        RAG_CONFIG.generalPlaces.minScore
      ),
      vectorSearchChunks(
        queryEmbedding,
        RAG_CONFIG.generalChunks.topK,
        RAG_CONFIG.generalChunks.minScore
      ),
    ]);

    places = placesResult;
    chunks = chunksResult;
  }

  // Build context message
  const context = createContextMessage({
    places,
    chunks,
    placeContext,
  });

  return {
    context,
    placesCount: places.length,
    chunksCount: chunks.length,
    placeId,
  };
}
