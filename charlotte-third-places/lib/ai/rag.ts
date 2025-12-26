/**
 * RAG (Retrieval-Augmented Generation) orchestration service.
 * Coordinates embedding generation, vector search, and context building.
 */

import { getEmbedding } from "./embedding";
import {
  getPlaceById,
  vectorSearchPlaces,
  vectorSearchChunks,
  type PlaceDocument,
  type ChunkDocument,
} from "./cosmos";
import { createContextMessage } from "./prompts";
import { RAG_CONFIG } from "./config";
import { detectEntities, type EntityDetectionResult } from "./entity-detection";

export interface RAGResult {
  /** Formatted context message for injection into system prompt */
  context: string;
  /** Number of places found */
  placesCount: number;
  /** Number of chunks (reviews) found */
  chunksCount: number;
  /** Place ID if this was a place-specific search */
  placeId?: string;
  /** Detected entities from the query (neighborhoods and tags) */
  entityContext?: EntityDetectionResult;
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
 * - Detect entities (neighborhoods and tags) from query
 * - Vector search across places (filtered by detected entities)
 * 
 * @param params - Query and optional placeId
 * @returns RAG result with formatted context
 */
export async function performRAG({ query, placeId }: RAGParams): Promise<RAGResult> {
  // Generate embedding for the query
  const queryEmbedding = await getEmbedding(query);

  // Detect entities (neighborhoods and tags) from the query
  const entityContext = detectEntities(query);
  const hasNeighborhoodFilter = entityContext.neighborhoods.primary.length > 0;
  const hasTagFilter = entityContext.tags.length > 0;
  const hasFilters = hasNeighborhoodFilter || hasTagFilter;

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
    // General search - places only, no chunks
    // 
    // PERFORMANCE OPTIMIZATION: We skip chunk (review) retrieval for general queries.
    // 
    // Reason: The chunks container is partitioned by placeId. General queries require
    // cross-partition vector search across all ~300+ partitions, which takes 5-10+ seconds
    // and often causes Vercel's 30-second timeout to be exceeded.
    // 
    // For general recommendations, place-level data is sufficient:
    // - Tags (curated category labels like "Fireplace", "Good for Groups")
    // - Curator comments (insider knowledge and first-hand observations)
    // - Reviews tags (aggregated keywords from Google Maps reviews)
    // - Description, amenities, working hours, etc.
    //
    // Detailed review chunks are fetched only for place-specific queries where
    // the placeId filter enables fast single-partition searches.
    //
    // ENTITY FILTERING:
    // When neighborhoods or tags are detected in the query, we use ARRAY_CONTAINS
    // to pre-filter places before vector search. This ensures:
    // - Exact neighborhood matching (e.g., "NoDa" only returns NoDa places)
    // - Tag matching (e.g., "fireplace" only returns places with Fireplace tag)
    // Nearby neighborhoods are included to give users more options.
    //
    // VECTOR INDEX CHOICE: quantizedFlat (not diskANN)
    // ------------------------------------------------
    // This architecture is why we use quantizedFlat instead of diskANN:
    // - Microsoft recommends quantizedFlat for <50k vectors/partition OR when using filters
    // - quantizedFlat gives ~99% accuracy vs diskANN's ~95% (better AI quality)
    // See: https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/vector-search
    // See: docs/ai.md for full rationale
    
    // When filters are detected, use filteredMinScore (0.0) instead of the normal threshold.
    // The filter itself is the constraint; we want all matching places ranked by relevance.
    const effectiveMinScore = hasFilters
      ? RAG_CONFIG.filteredMinScore
      : RAG_CONFIG.generalPlaces.minScore;

    places = await vectorSearchPlaces(
      queryEmbedding,
      RAG_CONFIG.generalPlaces.topK,
      effectiveMinScore,
      hasFilters
        ? {
            neighborhoods: hasNeighborhoodFilter ? entityContext.neighborhoods : undefined,
            tags: hasTagFilter ? entityContext.tags : undefined,
          }
        : undefined,
      query // Pass query text for development logging
    );
  }

  // Build context message
  const context = createContextMessage({
    places,
    chunks,
    placeContext,
    entityContext: hasFilters ? entityContext : undefined,
  });

  return {
    context,
    placesCount: places.length,
    chunksCount: chunks.length,
    placeId,
    entityContext: hasFilters ? entityContext : undefined,
  };
}
