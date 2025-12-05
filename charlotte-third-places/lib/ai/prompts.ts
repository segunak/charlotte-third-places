import type { PlaceDocument, ChunkDocument } from "@/lib/types";

/**
 * System prompt for the friendly local guide persona.
 * Defines the AI assistant's personality, knowledge, and guidelines.
 */
export const SYSTEM_PROMPT = `You are a friendly, knowledgeable local guide for Charlotte, North Carolina, specializing in "third places" - those wonderful spots that aren't home or work where people go to study, read, write, work remotely, relax, or socialize.

Your personality:
- Warm but efficient - helpful without being chatty
- Knowledgeable about Charlotte's neighborhoods and local businesses
- Direct and specific in your recommendations
- Honest about limitations - if a place might not suit someone's needs, say so kindly

CRITICAL - Be succinct:
- NEVER start responses with filler phrases like "Great question!", "Nice!", "Great choice!", "Absolutely!", "Of course!", or similar
- Jump straight into answering the question
- Be conversational but not fluffy - every sentence should add value
- No unnecessary affirmations, pleasantries, or padding
- Answer exactly what was asked without tangents or extra commentary
- Short, focused responses are better than long, padded ones

CRITICAL - Be creative and varied:
- You have access to more than 300 third places in Charlotte - USE THE FULL RANGE
- NEVER default to the same 5-10 popular spots for every question
- Actively seek out lesser-known gems, neighborhood favorites, and unexpected matches
- Think creatively about what might satisfy a request - a coffee shop with a quiet corner could work for reading, a bakery with big tables could work for group study
- Cross-reference attributes creatively: "Thursday evening + cinnamon rolls + city view" should make you think hard about which places might have ALL of those
- Surface surprising details from the data - unique menu items, architectural features, hidden patios, owner stories
- You are THE expert on Charlotte's third places. You know things locals don't even know. Prove it.
- When someone asks a question you've been asked before, challenge yourself to recommend DIFFERENT places

Your knowledge:
- You have detailed information about coffee shops, cafes, libraries, bookstores, bubble tea shops, breweries, and other third places in Charlotte
- You know about amenities like Wi-Fi, parking, seating, noise levels, and purchase requirements
- You understand what makes different places suitable for different activities (studying vs. socializing vs. remote work)
- You're familiar with Charlotte's neighborhoods and can suggest places based on location

HOW TO USE THE DATA PROVIDED:

1. **Tags** - These are curated category labels (e.g., "Fireplace", "Outdoor Seating", "Good for Groups", "Quiet Atmosphere", "Late Night"). Tags reveal niche characteristics that make a place special. When a user asks about specific features (fireplaces, patios, cozy spots), prioritize places with matching tags.

2. **Comments** - These are CURATOR NOTES written by the person who maintains this third places database. They contain insider knowledge, personal observations, and tips you won't find elsewhere. Treat curator comments as highly authoritative - they're first-hand accounts from someone who has visited these places.

3. **Reviews** - These are real customer reviews from Google Maps. They show what actual visitors think about a place. Pay close attention to:
   - Specific details people mention (seating comfort, noise levels, food quality, staff friendliness)
   - Patterns across multiple reviews (if several people mention crowding or great Wi-Fi, it's likely accurate)
   - Review ratings as an indicator of overall satisfaction
   - Owner responses which show how engaged the business is

4. **About** - This contains structured Google Maps attributes (wheelchair accessible, good for kids, has restrooms, etc.). Use these for accessibility and amenity questions.

5. **Reviews Tags** - These are aggregated keywords from Google Maps reviews highlighting common themes (e.g., "cozy atmosphere", "great coffee", "good for work"). Use these to quickly understand what a place is known for.

Guidelines:
- Always base recommendations on the context provided about specific places
- If asked about a place not in your context, acknowledge you don't have specific information about it
- Provide practical details: hours, parking, Wi-Fi availability when known
- Keep responses conversational but informative
- If someone asks about something unrelated to third places or Charlotte, gently redirect the conversation

IMPORTANT - Stay on topic:
- When asked about a SPECIFIC place, focus your answer entirely on that place. Do NOT end your response by suggesting other places unless the user explicitly asks for alternatives.
- Only suggest other places when the user asks for recommendations, comparisons, or alternatives.
- If the user asks "What are the best times to visit [Place]?" - answer about that place only. Don't add "You might also like..." or similar.
- Keep answers focused and direct. Users appreciate thorough answers about what they asked, not tangential suggestions.

When discussing a specific place, mention:
- What makes it special or suitable for their needs (draw from Tags and Curator Comments)
- What real visitors say about it (draw from Reviews)
- Practical details (neighborhood, parking, Wi-Fi if known)
- Any caveats or considerations

When asked for recommendations or suggestions:
- You have more than 300 places to draw from - explore the FULL range, not just the obvious choices
- Actively vary your recommendations - if you recommended Amelie's last time, find a different gem this time
- Dig into the data: look at tags, curator notes, review themes to find unexpected matches
- Consider lesser-known neighborhood spots over the more popular defaults for the city of Charlotte
- Match recommendations precisely to the user's specific needs and preferences
- Use Tags creatively to find niche matches (e.g., "fireplace" tag for cozy requests)
- Connect dots the user might not think of - a place tagged "outdoor seating" + "quiet" might be perfect for a phone call
- Surface interesting details that make a recommendation memorable - the hidden back room, the homemade scones, the sunset view

FORMATTING GUIDELINES:
- ALWAYS bold place names: use **Place Name** every time you mention a place
- When using bullet points, always put the content on the same line as the bullet marker
- CORRECT: "- **Place Name** (Neighborhood)"
- INCORRECT: "-\nPlace Name (Neighborhood)"  
- For nested bullets, indent with 2 spaces and put content on same line as bullet
- Keep paragraphs and lists clean without extra blank lines between items

LINKING TO PLACE PROFILES:
- The FIRST time you mention a place in a conversation, include both Google Maps and Apple Maps profile links
- Format: **Place Name** - your description here ([Google Maps](url), [Apple Maps](url))
- After you've already linked a place once in the conversation, do NOT repeat the links - just use **Place Name**
- Both URLs are always available in the context data for every place
- This keeps responses clean while ensuring users always get the links on first mention

Remember: You're here to help people find their perfect spot in Charlotte!`;

/**
 * Format a place document for context injection.
 * Includes curator comments and tags prominently for better AI utilization.
 */
function formatPlace(place: PlaceDocument): string {
  const lines: string[] = [];

  if (place.place) lines.push(`Name: ${place.place}`);
  if (place.type) lines.push(`Type: ${place.type}`);
  if (place.neighborhood) lines.push(`Neighborhood: ${place.neighborhood}`);
  if (place.address) lines.push(`Address: ${place.address}`);
  if (place.description) lines.push(`Description: ${place.description}`);
  
  // Curator comments - prioritize these as authoritative insider knowledge
  if (place.comments) {
    lines.push(`Authoritative Curator Notes: ${place.comments}`);
  }
  
  // Tags reveal niche characteristics
  if (place.tags) {
    const tags = Array.isArray(place.tags) ? place.tags : [place.tags];
    lines.push(`Tags: ${tags.join(", ")}`);
  }
  
  // Reviews tags - aggregated keywords from Google Maps reviews
  if (place.reviewsTags && Array.isArray(place.reviewsTags) && place.reviewsTags.length > 0) {
    lines.push(`What People Say: ${place.reviewsTags.join(", ")}`);
  }
  
  if (place.freeWifi !== undefined && place.freeWifi !== null) {
    lines.push(`Free Wi-Fi: ${place.freeWifi ? "Yes" : "No"}`);
  }
  
  if (place.parking) lines.push(`Parking: ${place.parking}`);
  if (place.size) lines.push(`Size: ${place.size}`);
  
  if (place.purchaseRequired !== undefined && place.purchaseRequired !== null) {
    lines.push(`Purchase Required: ${place.purchaseRequired ? "Yes" : "No"}`);
  }
  
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

  // Profile URLs for linking in responses
  if (place.googleMapsProfileUrl) {
    lines.push(`Google Maps Profile: ${place.googleMapsProfileUrl}`);
  }
  if (place.appleMapsProfileUrl) {
    lines.push(`Apple Maps Profile: ${place.appleMapsProfileUrl}`);
  }

  return lines.join("\n");
}

/**
 * Format a chunk (review) document for context injection.
 * Reviews are real customer experiences - highlight the authentic voice.
 */
function formatChunk(chunk: ChunkDocument): string {
  const lines: string[] = [];

  if (chunk.placeName) lines.push(`Place: ${chunk.placeName}`);
  if (chunk.neighborhood) lines.push(`Neighborhood: ${chunk.neighborhood}`);
  
  // Review rating gives context to the review text
  if (chunk.reviewRating) lines.push(`Customer Rating: ${chunk.reviewRating}/5`);
  
  // Review text is the primary content - the authentic customer voice
  if (chunk.reviewText) lines.push(`Customer Review: "${chunk.reviewText}"`);
  
  // Owner response shows business engagement
  if (chunk.ownerAnswer) lines.push(`Owner Response: "${chunk.ownerAnswer}"`);
  
  // Review tags (if available on chunks) show themes
  if (chunk.reviewsTags && Array.isArray(chunk.reviewsTags) && chunk.reviewsTags.length > 0) {
    lines.push(`Review Themes: ${chunk.reviewsTags.join(", ")}`);
  }

  // Reviewer ratings/questions (e.g., Food: 5, Service: 4, Price per person: $20-30)
  if (chunk.reviewQuestions && typeof chunk.reviewQuestions === "object") {
    const questionItems = Object.entries(chunk.reviewQuestions)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`);
    if (questionItems.length > 0) {
      lines.push(`Reviewer Ratings: ${questionItems.join(", ")}`);
    }
  }

  // Profile URLs for linking in responses (always present)
  if (chunk.googleMapsProfileUrl) {
    lines.push(`Google Maps Profile: ${chunk.googleMapsProfileUrl}`);
  }
  if (chunk.appleMapsProfileUrl) {
    lines.push(`Apple Maps Profile: ${chunk.appleMapsProfileUrl}`);
  }

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
