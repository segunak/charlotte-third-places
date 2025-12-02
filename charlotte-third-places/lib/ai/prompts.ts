/**
 * System prompt and context formatting for RAG-powered chat.
 * Ported from chat_service.py
 */

import type { PlaceDocument, ChunkDocument } from "@/lib/types";

/**
 * System prompt for the friendly local guide persona.
 * Defines the AI assistant's personality, knowledge, and guidelines.
 */
export const SYSTEM_PROMPT = `You are a friendly, knowledgeable local guide for Charlotte, North Carolina, specializing in "third places" - those wonderful spots that aren't home or work where people go to study, read, write, work remotely, relax, or socialize.

Your personality:
- Warm and welcoming, like a friend who knows all the best spots in town
- Enthusiastic about Charlotte's diverse neighborhoods and local businesses
- Helpful and specific in your recommendations
- Honest about limitations - if a place might not suit someone's needs, say so kindly

Your knowledge:
- You have detailed information about coffee shops, cafes, libraries, bookstores, bubble tea shops, breweries, and other third places in Charlotte
- You know about amenities like Wi-Fi, parking, seating, noise levels, and purchase requirements
- You understand what makes different places suitable for different activities (studying vs. socializing vs. remote work)
- You're familiar with Charlotte's neighborhoods and can suggest places based on location

Guidelines:
- Always base recommendations on the context provided about specific places
- If asked about a place not in your context, acknowledge you don't have specific information about it
- Provide practical details: hours, parking, Wi-Fi availability when known
- Suggest alternatives when a specific place might not meet someone's needs
- Keep responses conversational but informative
- If someone asks about something unrelated to third places or Charlotte, gently redirect the conversation

When discussing a specific place, mention:
- What makes it special or suitable for their needs
- Practical details (neighborhood, parking, Wi-Fi if known)
- Any caveats or considerations
- Similar alternatives if relevant

Remember: You're here to help people find their perfect spot in Charlotte!`;

/**
 * Format a place document for context injection.
 */
function formatPlace(place: PlaceDocument): string {
  const lines: string[] = [];

  if (place.place) lines.push(`Name: ${place.place}`);
  if (place.type) lines.push(`Type: ${place.type}`);
  if (place.neighborhood) lines.push(`Neighborhood: ${place.neighborhood}`);
  if (place.address) lines.push(`Address: ${place.address}`);
  if (place.description) lines.push(`Description: ${place.description}`);
  
  if (place.tags) {
    const tags = Array.isArray(place.tags) ? place.tags : [place.tags];
    lines.push(`Tags: ${tags.join(", ")}`);
  }
  
  if (place.freeWifi !== undefined && place.freeWifi !== null) {
    lines.push(`Free Wi-Fi: ${place.freeWifi ? "Yes" : "No"}`);
  }
  
  if (place.parking) lines.push(`Parking: ${place.parking}`);
  if (place.size) lines.push(`Size: ${place.size}`);
  
  if (place.purchaseRequired !== undefined && place.purchaseRequired !== null) {
    lines.push(`Purchase Required: ${place.purchaseRequired ? "Yes" : "No"}`);
  }
  
  if (place.placeRating) lines.push(`Rating: ${place.placeRating}/5`);
  if (place.reviewsCount) lines.push(`Number of Reviews: ${place.reviewsCount}`);
  if (place.typicalTimeSpent) lines.push(`Typical Time Spent: ${place.typicalTimeSpent}`);
  
  if (place.workingHours && typeof place.workingHours === "object") {
    const hoursStr = Object.entries(place.workingHours)
      .map(([day, time]) => `${day}: ${time}`)
      .join(", ");
    lines.push(`Hours: ${hoursStr}`);
  }
  
  if (place.about && typeof place.about === "object") {
    const aboutItems = Object.entries(place.about)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`);
    if (aboutItems.length > 0) {
      lines.push(`About: ${aboutItems.join("; ")}`);
    }
  }

  return lines.join("\n");
}

/**
 * Format a chunk (review) document for context injection.
 */
function formatChunk(chunk: ChunkDocument): string {
  const lines: string[] = [];

  if (chunk.placeName) lines.push(`Place: ${chunk.placeName}`);
  if (chunk.neighborhood) lines.push(`Neighborhood: ${chunk.neighborhood}`);
  if (chunk.reviewText) lines.push(`Review: ${chunk.reviewText}`);
  if (chunk.reviewRating) lines.push(`Rating: ${chunk.reviewRating}/5`);
  if (chunk.ownerAnswer) lines.push(`Owner Response: ${chunk.ownerAnswer}`);

  return lines.join("\n");
}

export interface CreateContextMessageParams {
  /** Places from vector search */
  places: PlaceDocument[];
  /** Chunks (reviews) from vector search */
  chunks: ChunkDocument[];
  /** Optional specific place context for place-specific chats */
  placeContext?: PlaceDocument | null;
}

/**
 * Create a context message from retrieved places and chunks for RAG.
 * This context is injected into the system message to ground the AI's responses.
 */
export function createContextMessage({
  places,
  chunks,
  placeContext,
}: CreateContextMessageParams): string {
  const contextParts: string[] = [];

  // Add specific place context if provided (for place-specific chats)
  if (placeContext) {
    contextParts.push("=== Current Place Being Discussed ===");
    contextParts.push(formatPlace(placeContext));
    contextParts.push("");
  }

  // Add relevant places from vector search
  if (places.length > 0) {
    contextParts.push("=== Relevant Places ===");
    places.forEach((place, i) => {
      const score = place.similarityScore ?? "N/A";
      contextParts.push(`--- Place ${i + 1} (Relevance: ${score}) ---`);
      contextParts.push(formatPlace(place));
      contextParts.push("");
    });
  }

  // Add relevant reviews from vector search
  if (chunks.length > 0) {
    contextParts.push("=== Relevant Reviews ===");
    chunks.forEach((chunk, i) => {
      const score = chunk.similarityScore ?? "N/A";
      contextParts.push(`--- Review ${i + 1} (Relevance: ${score}) ---`);
      contextParts.push(formatChunk(chunk));
      contextParts.push("");
    });
  }

  if (contextParts.length === 0) {
    return "No specific place information available for this query.";
  }

  return contextParts.join("\n");
}
