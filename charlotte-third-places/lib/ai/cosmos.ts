/**
 * Cosmos DB service for RAG data retrieval.
 * Provides vector search and direct lookups for places and chunks containers.
 */

import { CosmosClient, Container, SqlParameter } from "@azure/cosmos";
import { COSMOS_CONFIG } from "./config";
import type { PlaceDocument, ChunkDocument } from "@/lib/types";

// Re-export types for convenience
export type { PlaceDocument, ChunkDocument } from "@/lib/types";

// Singleton client instance
let cosmosClient: CosmosClient | null = null;
let placesContainer: Container | null = null;
let chunksContainer: Container | null = null;

/**
 * Initialize Cosmos DB client and containers.
 * Uses singleton pattern to reuse connection across requests.
 */
function getContainers(): { places: Container; chunks: Container } {
  if (!cosmosClient) {
    const connectionString = process.env.COSMOS_DB_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error("COSMOS_DB_CONNECTION_STRING environment variable is required");
    }
    cosmosClient = new CosmosClient(connectionString);
  }

  if (!placesContainer || !chunksContainer) {
    const database = cosmosClient.database(COSMOS_CONFIG.databaseName);
    placesContainer = database.container(COSMOS_CONFIG.placesContainer);
    chunksContainer = database.container(COSMOS_CONFIG.chunksContainer);
  }

  return { places: placesContainer, chunks: chunksContainer };
}

/**
 * Get a place document by ID (direct lookup).
 * 
 * @param placeId - The place ID (also partition key)
 * @returns The place document or null if not found
 */
export async function getPlaceById(placeId: string): Promise<PlaceDocument | null> {
  const { places } = getContainers();

  try {
    const { resource } = await places.item(placeId, placeId).read<PlaceDocument>();
    return resource ?? null;
  } catch (error: unknown) {
    // Handle 404 not found
    if (error && typeof error === "object" && "code" in error && error.code === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get all chunks (reviews) for a specific place.
 * 
 * @param placeId - The place ID (partition key for chunks)
 * @returns Array of chunk documents
 */
export async function getChunksByPlaceId(placeId: string): Promise<ChunkDocument[]> {
  const { chunks } = getContainers();

  const query = `
    SELECT 
      c.id, c.placeId, c.placeName, c.neighborhood, c.address,
      c.placeType, c.placeTags, c.reviewText, c.reviewRating,
      c.reviewDatetimeUtc, c.reviewLink, c.ownerAnswer, c.reviewsTags
    FROM c
    WHERE c.placeId = @placeId
  `;

  const { resources } = await chunks.items
    .query<ChunkDocument>({
      query,
      parameters: [{ name: "@placeId", value: placeId }],
    })
    .fetchAll();

  return resources;
}

/**
 * Perform vector similarity search on places container.
 * Uses Cosmos DB's VectorDistance function for cosine similarity.
 * 
 * @param queryEmbedding - The embedding vector to search with (1536 dimensions)
 * @param topK - Maximum number of results to return
 * @param minScore - Minimum similarity score threshold (0-1, higher = more similar)
 * @returns Array of place documents with similarity scores, ordered by relevance
 */
export async function vectorSearchPlaces(
  queryEmbedding: number[],
  topK: number = 5,
  minScore: number = 0.7
): Promise<PlaceDocument[]> {
  const { places } = getContainers();

  // Cosmos DB VectorDistance returns distance (lower = more similar)
  // For cosine, distance = 1 - similarity, so filter where distance < (1 - minScore)
  const maxDistance = 1 - minScore;

  const query = `
    SELECT TOP @topK
      c.id, c.place, c.neighborhood, c.address, c.type, c.tags,
      c.description, c.comments, c.googleMapsProfileUrl, c.appleMapsProfileUrl,
      c.website, c.freeWifi, c.hasCinnamonRolls, c.parking, c.size, c.purchaseRequired,
      c.placeRating, c.reviewsCount, c.workingHours, c.about, c.popularTimes, c.typicalTimeSpent,
      c.reviewsTags, c.category, c.subtypes,
      VectorDistance(c.embedding, @queryEmbedding) AS distance
    FROM c
    WHERE VectorDistance(c.embedding, @queryEmbedding) < @maxDistance
    ORDER BY VectorDistance(c.embedding, @queryEmbedding)
  `;

  const { resources } = await places.items
    .query<PlaceDocument & { distance: number }>({
      query,
      parameters: [
        { name: "@topK", value: topK },
        { name: "@queryEmbedding", value: queryEmbedding },
        { name: "@maxDistance", value: maxDistance },
      ],
    })
    .fetchAll();

  // Convert distance to similarity score
  return resources.map(({ distance, ...place }) => ({
    ...place,
    similarityScore: Math.round((1 - distance) * 10000) / 10000,
  }));
}

/**
 * Perform vector similarity search on chunks (reviews) container.
 * 
 * @param queryEmbedding - The embedding vector to search with (1536 dimensions)
 * @param topK - Maximum number of results to return
 * @param minScore - Minimum similarity score threshold (0-1)
 * @param placeId - Optional place ID to filter chunks for a specific place
 * @returns Array of chunk documents with similarity scores, ordered by relevance
 */
export async function vectorSearchChunks(
  queryEmbedding: number[],
  topK: number = 10,
  minScore: number = 0.7,
  placeId?: string
): Promise<ChunkDocument[]> {
  const { chunks } = getContainers();
  const maxDistance = 1 - minScore;

  let query: string;
  let parameters: SqlParameter[];

  if (placeId) {
    // Search within a specific place's reviews (single partition)
    query = `
      SELECT TOP @topK
        c.id, c.placeId, c.placeName, c.neighborhood, c.address, c.googleMapsProfileUrl,
        c.appleMapsProfileUrl, c.placeType, c.placeTags, c.reviewText,
        c.reviewDatetimeUtc, c.reviewLink, c.ownerAnswer, c.reviewsTags,
        VectorDistance(c.embedding, @queryEmbedding) AS distance
      FROM c
      WHERE c.placeId = @placeId
        AND VectorDistance(c.embedding, @queryEmbedding) < @maxDistance
      ORDER BY VectorDistance(c.embedding, @queryEmbedding)
    `;
    parameters = [
      { name: "@topK", value: topK },
      { name: "@queryEmbedding", value: queryEmbedding },
      { name: "@maxDistance", value: maxDistance },
      { name: "@placeId", value: placeId },
    ];
  } else {
    // Cross-partition search across all reviews
    query = `
      SELECT TOP @topK
        c.id, c.placeId, c.placeName, c.neighborhood, c.address,
        c.placeType, c.placeTags, c.reviewText, c.reviewRating,
        c.reviewDatetimeUtc, c.reviewLink, c.ownerAnswer, c.reviewsTags,
        VectorDistance(c.embedding, @queryEmbedding) AS distance
      FROM c
      WHERE VectorDistance(c.embedding, @queryEmbedding) < @maxDistance
      ORDER BY VectorDistance(c.embedding, @queryEmbedding)
    `;
    parameters = [
      { name: "@topK", value: topK },
      { name: "@queryEmbedding", value: queryEmbedding },
      { name: "@maxDistance", value: maxDistance },
    ];
  }

  const { resources } = await chunks.items
    .query<ChunkDocument & { distance: number }>({
      query,
      parameters,
    })
    .fetchAll();

  // Convert distance to similarity score
  return resources.map(({ distance, ...chunk }) => ({
    ...chunk,
    similarityScore: Math.round((1 - distance) * 10000) / 10000,
  }));
}
