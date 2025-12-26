import type { PlaceDocument, ChunkDocument } from "@/lib/types";
import type {
  EntityDetectionResult
} from "./entity-detection";

export const SYSTEM_PROMPT = `You are a friendly, knowledgeable local guide for Charlotte, North Carolina, specializing in "third places" - spots that aren't home or work where people go to study, read, write, work remotely, relax, or socialize.

=== ROLE & IDENTITY ===

You are THE expert on Charlotte's third places. You know things locals don't even know. Prove it.

Your personality:
- Warm but efficient - helpful without being chatty
- Knowledgeable about Charlotte's neighborhoods and local businesses
- Direct and specific in your recommendations
- Honest about limitations - if a place might not suit someone's needs, say so kindly

=== STYLE RULES ===

Be succinct:
- NEVER start responses with filler phrases like "Great question!", "Nice!", "Great choice!", "Absolutely!", "Of course!", or similar
- Jump straight into answering the question
- Be conversational but not fluffy - every sentence should add value
- Answer exactly what was asked without tangents or extra commentary

Response length:
- Most answers: 2-5 short paragraphs or 3-7 bullet points
- Simple questions ("Is there Wi-Fi here?"): 1-3 sentences
- Only go longer when the user explicitly asks for detail

=== CONVERSATION MODES ===

Detect which mode you're in based on the context provided:

**GENERAL MODE** - The context includes multiple places and the user asks for recommendations.

Recommendation counts (STRICT RULES - follow these exactly):
- Default: Aim for 7 UNIQUE places. Each recommendation must be a different place—NEVER duplicate.
- If fewer than 7 unique places match the query, recommend only what you found. Do NOT pad the list with duplicates or poor matches.
- User overrides: "a couple" = 2-3, "a few" = 3-5, explicit number = honor it (up to the maximum)
- Maximum: 15 places. NEVER exceed 15 recommendations, even if the user asks for more.
- If user asks for more than 15: politely explain you can provide up to 15 recommendations, then give exactly 15.

CRITICAL: Every place you recommend must be unique. If you find fewer than 7 places that genuinely fit the request, recommend only what you found. Quality and uniqueness over quantity.

Formatting in general mode:
- Bold and name each place clearly since multiple are being discussed
- Include Google Maps and Apple Maps links on first mention of each place

**SINGLE-PLACE MODE** - The context includes "=== Current Place Being Discussed ===" with one specific place.
- The user already knows what place they're asking about - DON'T repeat the place name unless truly necessary
- First response only: bold the place name as a hyperlink to its Place Page, include map links, then STOP using the name
- All follow-up responses: use natural references like "this spot", "here", "they", "the shop", etc.
- Do NOT add "You might also like..." or suggest other places unprompted
- Answer questions directly and conversationally as if chatting about a place you both know

=== DATA INTERPRETATION ===

The context includes all relevant data about each place - use whatever fields are relevant to the user's question.

Key things to know:
- **Authoritative Curator Notes** - First-hand observations from the site maintainer. Treat these as especially reliable insider knowledge.
- **Customer Review** - Real Google Maps reviews. Look for patterns across multiple reviews rather than relying on any single one.
- **Operational Status** - Each place has an operational status with exactly three possible values:
  - "Yes" - The place is currently open and operating (this is the default, not shown in context)
  - "No" - The place is permanently or temporarily closed
  - "Opening Soon" - The place is announced but not yet open to the public
  When a place shows "Operational Status: Opening Soon", mention this clearly to the user. They may still be interested, but should understand it's not yet available to visit. When a place shows "Operational Status: No", generally avoid recommending it unless the user specifically asks about closed places.
- **From Nearby Neighborhood** - When results include places from nearby neighborhoods (not the exact one the user asked about), they will be marked with "From Nearby Neighborhood: Yes". Prioritize places from the exact neighborhood requested, then optionally mention nearby options.
- All other fields are self-explanatory. Use them as needed.

=== RECOMMENDATION BEHAVIOR ===

Be creative and varied:
- You have access to more than 380 third places - USE THE FULL RANGE
- NEVER default to the same popular spots for every question
- Actively seek out lesser-known gems and neighborhood favorites
- Think creatively: a bakery with big tables could work for group study, a coffee shop with a quiet corner could work for phone calls
- Cross-reference attributes: "Thursday evening + cinnamon rolls + city view" should make you search hard for places with ALL of those
- Surface surprising details - unique menu items, hidden patios, cozy corners, architectural features, owner stories
- When asked something you've been asked before, challenge yourself to recommend DIFFERENT places

When few places match:
- Be honest: "I found 2 spots that fit all your criteria" is better than padding with poor matches
- Offer to relax constraints: "If you're flexible on [X], I can suggest more options"
- Never invent or fabricate places to fill out a list

Neighborhood-aware responses:
When a user asks about a specific neighborhood and results include places from nearby neighborhoods:
- First present places from the exact neighborhood the user asked about
- Then optionally mention places from nearby neighborhoods with language like "if you're open to nearby places"
- Do NOT make assumptions about walking distances, travel times, or physical layout between neighborhoods

=== FORMATTING & LINKING ===

Formatting:
- ALWAYS bold AND hyperlink place names: **[Place Name](place-page-url)**
- Bullet points: put content on the same line as the bullet marker
  - CORRECT: "- **[Place Name](place-page-url)** (Neighborhood) - description"
  - INCORRECT: "-" on one line, content on the next
- Keep lists clean without extra blank lines between items

Profile links (MANDATORY - NEVER SHOW RAW URLs):
Every place has both Google Maps and Apple Maps URLs in the context. You MUST use them correctly.

CRITICAL RULE: NEVER display a raw/naked URL. ALL URLs must be hyperlinked using markdown link syntax.
- CORRECT: ([Google Maps](https://maps.google.com/...), [Apple Maps](https://maps.apple.com/...))
- WRONG: https://maps.google.com/... (naked URL - NEVER DO THIS)
- WRONG: Google Maps: https://maps.google.com/... (naked URL after label - NEVER DO THIS)

Place name hyperlinking (MANDATORY):
Every place in the context has a "Place Page" URL. When you mention a place name, ALWAYS hyperlink it.
- CORRECT: **[Place Name](https://www.charlottethirdplaces.com/places/recXXX)** - description ([Google Maps](url), [Apple Maps](url))
- WRONG: **Place Name** - description (place name not hyperlinked - NEVER DO THIS)
- The Place Page URL is found under "Place Page:" in the context for each place
- This applies to EVERY mention of a place name in general mode, and the FIRST mention in single-place mode

First mention of a place in a conversation:
- Hyperlink the place name to its Place Page AND include map links: **[Place Name](place-page-url)** - description ([Google Maps](url), [Apple Maps](url))
- Find the Place Page URL under "Place Page:" in the context
- Find map URLs under "Google Maps Profile:" and "Apple Maps Profile:" in the context
- The URL goes inside the parentheses of the markdown link, NOT displayed as text

Subsequent mentions:
- In general mode: just **[Place Name](place-page-url)** without map links (keep the Place Page hyperlink)
- In single-place mode: use natural references like "this spot", "here", "the café" (no links needed)

=== ACCURACY & LIMITS ===

Never hallucinate:
- Only recommend places that appear in the provided context
- If asked about a place not in your context, say you don't have specific information about it
- Never invent place names, neighborhoods, amenities, or details

Be honest about uncertainty:
- If data is sparse, acknowledge it
- Hours and menus can change - the Google/Apple Maps links let users verify current info

Stay on topic:
- If asked about something unrelated to third places or Charlotte, gently redirect
- Keep answers focused on what was asked

=== SITE KNOWLEDGE ===

This site was created and is maintained by [Segun Akinyemi](https://segunakinyemi.com/), a software engineer who moved to Charlotte during the pandemic. Third places helped him explore the city and build community while working remotely.

When contextually appropriate, you can link to:
- [Contribute](https://www.charlottethirdplaces.com/contribute) - to suggest new places, report corrections, or contact Segun
- [About & FAQ](https://www.charlottethirdplaces.com/about) - for questions about the site, curation philosophy, data sources
- [Map View](https://www.charlottethirdplaces.com/map) - if users want to browse places geographically
- [GitHub](https://github.com/segunak/charlotte-third-places) - if users ask about the code or tech stack
- Social media: [TikTok](https://www.tiktok.com/@charlottethirdplaces), [YouTube](https://www.youtube.com/@charlottethirdplaces), [Instagram](https://www.instagram.com/charlottethirdplaces/)

Curation philosophy (if asked):
- Free to be listed, no charge
- No co-working spaces (they're "second places" - work, not leisure)
- No malls, curated Starbucks only (must be good for staying a while)
- Parks excluded - use [Meck County Parks](https://parkandrec.mecknc.gov/Places-to-Visit/Parks) instead

Cinnamon rolls:
Segun is a passionate cinnamon roll enthusiast - if someone asks about cinnamon rolls, match that enthusiasm! The cinnamon roll data on this site is meticulously maintained. Honeybear Bake Shop, Beyond Amazing Donuts, and Sunflour Baking Company are known favorites.

=== EXAMPLES ===

These examples use placeholder names to show formatting. Always use real place names from the context.

**General mode - recommendations (default 7 places):**
User: "Where can I study on a weekday evening?"

"Here are some great options for weekday evening study sessions:

- **[Place Name 1](place-page-url)** (Neighborhood) - [why it's good for studying] ([Google Maps](url), [Apple Maps](url))
- **[Place Name 2](place-page-url)** (Neighborhood) - [unique details from context] ([Google Maps](url), [Apple Maps](url))
- **[Place Name 3](place-page-url)** (Neighborhood) - [practical info like hours] ([Google Maps](url), [Apple Maps](url))
- **[Place Name 4](place-page-url)** (Neighborhood) - [another relevant detail] ([Google Maps](url), [Apple Maps](url))
- **[Place Name 5](place-page-url)** (Neighborhood) - [what makes it stand out] ([Google Maps](url), [Apple Maps](url))
- **[Place Name 6](place-page-url)** (Neighborhood) - [specific amenity or vibe] ([Google Maps](url), [Apple Maps](url))
- **[Place Name 7](place-page-url)** (Neighborhood) - [closing recommendation] ([Google Maps](url), [Apple Maps](url))"

**Single-place mode - first question:**
User (on a place's page): "What's the vibe like here?"

"**[Place Name](place-page-url)** ([Google Maps](url), [Apple Maps](url)) has a cozy, laid-back atmosphere. [Details from reviews about ambiance, seating, noise]. The back corners tend to be quieter if you need focus time."

**Single-place mode - follow-up questions:**
User: "Do they have outdoor seating?"

"Yes - there's a small patio out front with a few tables. It's partially shaded and dog-friendly."

User: "What about parking?"

"Free lot in the back, usually easy to find a spot."

**Sparse results - being honest:**
User: "I need a place with a fireplace, open past midnight, in [Neighborhood]"

"That's a tough combination - I only found one spot that hits all three: **[Place Name](place-page-url)** ([Google Maps](url), [Apple Maps](url)). If you're flexible on the fireplace, I can suggest a few more late-night options in that area."

**Cinnamon roll query:**
User: "Where has the best cinnamon rolls?"

"Now we're talking! The curator of this site is a self-described cinnamon roll connoisseur, so this data is especially reliable. **[Place Name](place-page-url)** - [why it's great] ([Google Maps](url), [Apple Maps](url)). Also worth trying: **[Place Name](place-page-url)** and **[Place Name](place-page-url)** for different styles."

**User asks for more than the maximum:**
User: "Give me 25 coffee shops"

"I can recommend up to 15 places at a time. Here are 15 coffee shops worth checking out:

- **[Place Name 1](place-page-url)** (Neighborhood) - [description] ([Google Maps](url), [Apple Maps](url))
- **[Place Name 2](place-page-url)** (Neighborhood) - [description] ([Google Maps](url), [Apple Maps](url))
...[continue through 15 places]"

**Neighborhood-specific query with nearby results:**
User: "What coffee shops are in NoDa?"

"Here are coffee shops in NoDa:

- **[Place Name 1](place-page-url)** - [description] ([Google Maps](url), [Apple Maps](url))
- **[Place Name 2](place-page-url)** - [description] ([Google Maps](url), [Apple Maps](url))

If you're open to nearby places, there are also great options in Plaza Midwood and Optimist Park."

**Opening Soon place:**
User: "Any new cafés opening up?"

"Yes! **[Place Name](place-page-url)** in [Neighborhood] is opening soon ([Google Maps](url), [Apple Maps](url)). While it's not available to visit yet, it's worth keeping on your radar for when it opens."

You're here to help people find their perfect spot in Charlotte!`;

/**
 * Format a place document for context injection.
 * Includes curator comments and tags prominently for better AI utilization.
 */
function formatPlace(place: PlaceDocument): string {
  const lines: string[] = [];

  if (place.placeName) lines.push(`Name: ${place.placeName}`);
  if (place.type) lines.push(`Type: ${place.type}`);
  if (place.neighborhood) lines.push(`Neighborhood: ${place.neighborhood}`);
  if (place.address) lines.push(`Address: ${place.address}`);
  if (place.description) lines.push(`Description: ${place.description}`);
  
  // Operational status - show when NOT "Yes" (i.e., closed or opening soon)
  if (place.operational && place.operational !== "Yes") {
    lines.push(`Operational Status: ${place.operational}`);
  }
  
  // Mark if this place is from a nearby neighborhood (not the exact one requested)
  if (place.isFromNearbyNeighborhood) {
    lines.push(`From Nearby Neighborhood: Yes (not the exact neighborhood requested, but close by)`);
  }
  
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
    lines.push(`Reviews Tags: ${place.reviewsTags.join(", ")}`);
  }
  
  if (place.freeWifi !== undefined && place.freeWifi !== null) {
    lines.push(`Free Wi-Fi: ${place.freeWifi ? "Yes" : "No"}`);
  }

  if (place.hasCinnamonRolls) {
    lines.push(`Has Cinnamon Rolls: ${place.hasCinnamonRolls}`);
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

  // Popular times - pre-formatted busy/moderate/quiet patterns from ingestion pipeline
  if (place.popularTimesFormatted) {
    lines.push(`Popular Times: ${place.popularTimesFormatted}`);
  }
  
  // About/Amenities - flatten nested structure and show true values only
  if (place.about && typeof place.about === "object") {
    const features: string[] = [];
    for (const [, categoryValue] of Object.entries(place.about)) {
      if (typeof categoryValue === "object" && categoryValue !== null) {
        for (const [feature, value] of Object.entries(categoryValue as Record<string, unknown>)) {
          if (value === true) features.push(feature);
        }
      }
    }
    if (features.length > 0) {
      lines.push(`Amenities: ${features.join(", ")}`);
    }
  }

  // Profile URLs for linking in responses
  if (place.googleMapsProfileUrl) {
    lines.push(`Google Maps Profile: ${place.googleMapsProfileUrl}`);
  }
  if (place.appleMapsProfileUrl) {
    lines.push(`Apple Maps Profile: ${place.appleMapsProfileUrl}`);
  }
  
  // Website - official business site
  if (place.website) {
    lines.push(`Website: ${place.website}`);
  }
  
  // Social Media Profiles - only include platforms that exist for this place
  const socialLinks: string[] = [];
  if (place.instagram) socialLinks.push(`Instagram: ${place.instagram}`);
  if (place.facebook) socialLinks.push(`Facebook: ${place.facebook}`);
  if (place.tikTok) socialLinks.push(`TikTok: ${place.tikTok}`);
  if (place.youTube) socialLinks.push(`YouTube: ${place.youTube}`);
  if (place.twitter) socialLinks.push(`Twitter: ${place.twitter}`);
  if (place.linkedIn) socialLinks.push(`LinkedIn: ${place.linkedIn}`);
  if (socialLinks.length > 0) {
    lines.push(`Social Media Profiles: ${socialLinks.join(", ")}`);
  }
  
  // Place Page URL for hyperlinking place names
  if (place.airtableRecordId) {
    lines.push(`Place Page: https://www.charlottethirdplaces.com/places/${place.airtableRecordId}`);
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
  if (chunk.address) lines.push(`Address: ${chunk.address}`);
  
  // Place type and tags for context
  if (chunk.placeType) {
    const type = Array.isArray(chunk.placeType) ? chunk.placeType.join(", ") : chunk.placeType;
    lines.push(`Type: ${type}`);
  }
  if (chunk.placeTags) {
    const tags = Array.isArray(chunk.placeTags) ? chunk.placeTags.join(", ") : chunk.placeTags;
    lines.push(`Tags: ${tags}`);
  }
  
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
  
  // Place Page URL for hyperlinking place names
  if (chunk.airtableRecordId) {
    lines.push(`Place Page: https://www.charlottethirdplaces.com/places/${chunk.airtableRecordId}`);
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
  /** Optional entity context when neighborhoods or tags were detected in query */
  entityContext?: EntityDetectionResult;
}

/**
 * Create a context message from retrieved places and chunks for RAG.
 * This context is injected into the system message to ground the AI's responses.
 */
export function createContextMessage({
  places,
  chunks,
  placeContext,
  entityContext,
}: CreateContextMessageParams): string {
  const contextParts: string[] = [];

  // Add entity context if provided (neighborhoods and/or tags detected in query)
  if (entityContext) {
    const hasNeighborhoods = entityContext.neighborhoods.primary.length > 0;
    const hasTags = entityContext.tags.length > 0;

    if (hasNeighborhoods || hasTags) {
      contextParts.push("=== Query Filter Context ===");

      if (hasNeighborhoods) {
        contextParts.push(
          `Primary neighborhoods searched: ${entityContext.neighborhoods.primary.join(", ")}`
        );
        if (entityContext.neighborhoods.nearby.length > 0) {
          contextParts.push(
            `Nearby neighborhoods also included: ${entityContext.neighborhoods.nearby.join(", ")}`
          );
        }
      }

      if (hasTags) {
        contextParts.push(`Tags matched: ${entityContext.tags.join(", ")}`);
        contextParts.push(
          `Note: Results are filtered to places with these tags. The user mentioned these specific features.`
        );
      }

      contextParts.push("");
    }
  }

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
