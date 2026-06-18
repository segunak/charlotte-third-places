/**
 * AI library exports for chat and RAG functionality.
 */

export { AI_CONFIG, COSMOS_CONFIG, RAG_CONFIG } from "./config";
export { SYSTEM_PROMPT, createContextMessage } from "./prompts";
export { getEmbedding, getEmbeddings } from "./embedding";
export {
  getPlaceById,
  getChunksByPlaceId,
  vectorSearchPlaces,
  vectorSearchChunks,
} from "./cosmos";
export type { PlaceDocument, ChunkDocument } from "@/lib/types";
export { performRAG, type RAGResult, type RAGParams } from "./rag";
