/**
 * Entity Detection for RAG Query Processing.
 *
 * This module detects neighborhoods and tags mentioned in user queries to enable
 * more precise filtering before vector search. It combines:
 * - Dynamic data from Airtable (neighborhoods, tags) via generated file
 * - Static data (neighborhood aliases, nearby mappings) curated manually
 *
 * Provides:
 * - detectEntities(): Main entry point - detects all entity types
 * - detectNeighborhoods(): Detect neighborhoods with nearby expansion
 * - detectTags(): Detect tags from user query
 * - getNearbyNeighborhoods(): Get nearby neighborhoods for suggestions
 */

import { NEIGHBORHOODS, TAGS } from "./airtable-generated-data";

// Re-export for convenience
export type { Neighborhood, Tag } from "./airtable-generated-data";
export { NEIGHBORHOODS, TAGS } from "./airtable-generated-data";

/**
 * Maps aliases, nicknames, abbreviations, and misspellings to canonical neighborhood names.
 * Only includes non-obvious mappings that AI/embedding models wouldn't infer.
 * Keys are lowercase for case-insensitive matching.
 *
 * This is static because these are local slang/nicknames that don't change often.
 */
export const NEIGHBORHOOD_ALIASES: Record<string, string> = {
  // === UPTOWN / DOWNTOWN (Charlotte calls it "Uptown", visitors say "downtown") ===
  "downtown": "Uptown",
  "downtown charlotte": "Uptown",
  "center city": "Uptown",
  "centre city": "Uptown",
  "central charlotte": "Uptown",
  "city center": "Uptown",
  "city centre": "Uptown",
  "cbd": "Uptown",
  "first ward": "Uptown",
  "second ward": "Uptown",
  "third ward": "Uptown",
  "fourth ward": "Uptown",
  "1st ward": "Uptown",
  "2nd ward": "Uptown",
  "3rd ward": "Uptown",
  "4th ward": "Uptown",

  // === NODA (North Davidson Arts District - local acronym) ===
  "north davidson": "NoDa",
  "arts district": "NoDa",
  "charlotte arts district": "NoDa",

  // === SOUTH END ===
  "design district": "South End",
  "atherton": "South End",

  // === LOSO (Lower South End - local acronym) ===
  "lower south end": "LoSo",

  // === PLAZA MIDWOOD ===
  "plaza": "Plaza Midwood",
  "the plaza": "Plaza Midwood",

  // === DILWORTH ===
  "dilworth-sedgefield": "Dilworth",

  // === UNIVERSITY CITY (local abbreviations) ===
  "uncc area": "University City",
  "unc charlotte area": "University City",
  "university area": "University City",
  "uni city": "University City",
  "u city": "University City",
  "near uncc": "University City",
  "near unc charlotte": "University City",

  // === HUNTERSVILLE (local slang) ===
  "h'ville": "Huntersville",
  "hville": "Huntersville",

  // === CORNELIUS (Lake Norman association) ===
  "lake norman": "Cornelius",
  "lkn": "Cornelius",

  "South Park": "SouthPark",

  // === MOORESVILLE ===
  "race city usa": "Mooresville",
  "race city": "Mooresville",

  // === FORT MILL ===
  "ft mill": "Fort Mill",
  "ft. mill": "Fort Mill",

  // === PINEVILLE ===
  "carolina place": "Pineville",

  // === CONCORD ===
  "concord mills": "Concord",

  // === MOUNT HOLLY ===
  "mt holly": "Mount Holly",
  "mt. holly": "Mount Holly",

  // === KINGS MOUNTAIN ===
  "kings mtn": "Kings Mountain",

  // === MOUNTAIN ISLAND ===
  "mountain island lake": "Mountain Island",
  "mt island": "Mountain Island",
  "mt. island": "Mountain Island",

  // === CARMEL ===
  "carmel road area": "Carmel",
  "carmel commons": "Carmel",

  // === OLDE WHITEHALL ===
  "old whitehall": "Olde Whitehall",
  "whitehall": "Olde Whitehall",

  // === CLOSEBURN - GLENKIRK (partial names) ===
  "closeburn": "Closeburn - Glenkirk",
  "glenkirk": "Closeburn - Glenkirk",

  // === DAVIS LAKE - EASTFIELD (partial names) ===
  "davis lake": "Davis Lake - Eastfield",
  "eastfield": "Davis Lake - Eastfield",

  // === NORTH SHARON AMITY / REDDMAN ROAD (partial names) ===
  "north sharon amity": "North Sharon Amity / Reddman Road",
  "reddman road": "North Sharon Amity / Reddman Road",

  // === BELMONT (CITY) - disambiguation from Charlotte neighborhood ===
  "belmont nc": "Belmont (City)",
  "city of belmont": "Belmont (City)",
  "downtown belmont": "Belmont (City)",

  // === NORTHWEST CHARLOTTE ===
  "nw charlotte": "Northwest Charlotte",

  // === INDEPENDENCE BLVD ===
  "independence boulevard": "Independence Blvd",
  "indy blvd": "Independence Blvd",

  // === DRUID HILLS SOUTH (partial name) ===
  "druid hills": "Druid Hills South",

  // === MONTCLAIRE SOUTH (partial name) ===
  "montclaire": "Montclaire South",

  // === WEST SUGAR CREEK ===
  "w sugar creek": "West Sugar Creek",

  // === OAKVIEW TERRACE (partial name) ===
  "oakview": "Oakview Terrace",

  // === ENDERLY PARK (partial name) ===
  "enderly": "Enderly Park",

  // === DALLAS/DENVER/STANLEY (disambiguation from other cities) ===
  "dallas nc": "Dallas",
  "denver nc": "Denver",
  "stanley nc": "Stanley",
};

/**
 * Geographic proximity map. Each neighborhood maps to its nearby neighbors.
 * Relationships are bidirectional (if A lists B, B lists A).
 * Validated against Charlotte metro geography.
 *
 * This is static because geographic relationships don't change.
 */
export const NEARBY_NEIGHBORHOODS: Record<string, string[]> = {
  "Arbor Glen": ["Ashley Park", "Olde Whitehall", "Renaissance Park"],
  "Ashley Park": ["Arbor Glen", "Enderly Park", "Wesley Heights"],
  "Ballantyne": ["Indian Land", "Pineville", "Piper Glen", "Providence Crossing", "Raintree", "Waverly", "Waxhaw"],
  "Belmont": ["Elizabeth", "Lockwood", "Midtown", "NoDa", "Optimist Park", "Plaza Midwood", "Sugar Creek"],
  "Belmont (City)": ["Gastonia", "Mount Holly"],
  "Bradfield Farms": ["Eastway", "Hickory Grove", "Mint Hill"],
  "Carmel": ["Piper Glen", "Quail Hollow", "Raintree", "SouthPark"],
  "China Grove": ["Kannapolis", "Landis"],
  "Closeburn - Glenkirk": ["Collingwood", "Madison Park", "Montclaire South", "Montford", "SouthPark", "Starmount"],
  "Collingwood": ["Closeburn - Glenkirk", "LoSo", "Madison Park", "Montford", "South End"],
  "Commonwealth Park": ["Eastway", "Oakhurst", "Plaza Midwood"],
  "Concord": ["Harrisburg", "Highland Creek", "Kannapolis", "University City"],
  "Cornelius": ["Davidson", "Huntersville"],
  "Cotswold": ["Eastover", "Myers Park", "Providence Park", "SouthPark"],
  "Dallas": ["Gastonia", "Stanley"],
  "Davidson": ["Cornelius", "Mooresville"],
  "Davis Lake - Eastfield": ["Highland Creek", "Huntersville", "University City", "Wedgewood"],
  "Denver": ["Mooresville"],
  "Dilworth": ["Elizabeth", "LoSo", "Midtown", "Myers Park", "South End", "Uptown"],
  "Druid Hills South": ["Lincoln Heights", "Lockwood", "Sugar Creek", "Washington Heights"],
  "East Forest": ["Independence Blvd", "Matthews", "North Sharon Amity / Reddman Road", "Oakhurst", "Sardis Crossing", "Sardis Woods"],
  "Eastover": ["Cotswold", "Elizabeth", "Grier Heights", "Myers Park", "Oakhurst", "Providence Park"],
  "Eastway": ["Bradfield Farms", "Commonwealth Park", "Hickory Grove", "Independence Blvd", "North Sharon Amity / Reddman Road", "Oakhurst", "Plaza Midwood"],
  "Elizabeth": ["Belmont", "Dilworth", "Eastover", "Grier Heights", "Lockwood", "Midtown", "Myers Park", "Plaza Midwood", "Uptown"],
  "Enderly Park": ["Ashley Park", "Seversville", "Wesley Heights"],
  "Fort Mill": ["Indian Land", "Pineville", "Rock Hill", "Steele Creek", "Tega Cay"],
  "Gastonia": ["Belmont (City)", "Dallas", "Kings Mountain", "Mount Holly"],
  "Grier Heights": ["Eastover", "Elizabeth", "Myers Park", "Oakhurst", "Providence Park"],
  "Harrisburg": ["Concord", "Highland Creek", "Mint Hill", "University City"],
  "Hickory Grove": ["Bradfield Farms", "Eastway", "Mint Hill", "University City"],
  "Highland Creek": ["Concord", "Davis Lake - Eastfield", "Harrisburg", "University City"],
  "Huntersville": ["Cornelius", "Davis Lake - Eastfield", "Mountain Island"],
  "Independence Blvd": ["East Forest", "Eastway", "Matthews", "North Sharon Amity / Reddman Road", "Oakhurst"],
  "Indian Land": ["Ballantyne", "Fort Mill", "Providence Crossing", "Waverly", "Waxhaw"],
  "Indian Trail": ["Matthews", "Mint Hill", "Monroe", "Stallings"],
  "Kannapolis": ["China Grove", "Concord", "Landis"],
  "Kings Mountain": ["Gastonia"],
  "Landis": ["China Grove", "Kannapolis"],
  "Lincoln Heights": ["Druid Hills South", "Oakview Terrace", "Washington Heights"],
  "Lockwood": ["Belmont", "Druid Hills South", "Elizabeth", "Midtown", "NoDa", "Optimist Park", "Uptown"],
  "LoSo": ["Collingwood", "Dilworth", "Montclaire South", "Olde Whitehall", "South End", "Starmount"],
  "Madison Park": ["Closeburn - Glenkirk", "Collingwood", "Montford", "Quail Hollow", "SouthPark", "Starmount"],
  "Matthews": ["East Forest", "Independence Blvd", "Indian Trail", "Mint Hill", "North Sharon Amity / Reddman Road", "Raintree", "Sardis Crossing", "Sardis Woods", "Stallings"],
  "Midtown": ["Belmont", "Dilworth", "Elizabeth", "Lockwood", "Plaza Midwood", "Uptown"],
  "Mineral Springs": ["Monroe", "Waxhaw"],
  "Mint Hill": ["Bradfield Farms", "Harrisburg", "Hickory Grove", "Indian Trail", "Matthews", "Stallings"],
  "Monroe": ["Indian Trail", "Mineral Springs"],
  "Montclaire South": ["Closeburn - Glenkirk", "LoSo", "Olde Whitehall", "Pineville", "Starmount"],
  "Montford": ["Closeburn - Glenkirk", "Collingwood", "Madison Park", "SouthPark"],
  "Mooresville": ["Davidson", "Denver"],
  "Mount Holly": ["Belmont (City)", "Gastonia", "Mountain Island", "Stanley"],
  "Mountain Island": ["Huntersville", "Mount Holly", "Northwest Charlotte", "Wedgewood"],
  "Myers Park": ["Cotswold", "Dilworth", "Eastover", "Elizabeth", "Grier Heights", "Providence Park", "SouthPark"],
  "NoDa": ["Belmont", "Lockwood", "Optimist Park", "Plaza Midwood", "Sugar Creek"],
  "North Sharon Amity / Reddman Road": ["East Forest", "Eastway", "Independence Blvd", "Matthews", "Oakhurst", "Providence Park"],
  "Northwest Charlotte": ["Mountain Island", "Oakview Terrace", "Wedgewood"],
  "Oakhurst": ["Commonwealth Park", "East Forest", "Eastover", "Eastway", "Grier Heights", "Independence Blvd", "North Sharon Amity / Reddman Road", "Plaza Midwood"],
  "Oakview Terrace": ["Lincoln Heights", "Northwest Charlotte", "Seversville"],
  "Olde Whitehall": ["Arbor Glen", "LoSo", "Montclaire South", "Pineville", "Renaissance Park", "Steele Creek"],
  "Optimist Park": ["Belmont", "Lockwood", "NoDa", "Uptown"],
  "Pineville": ["Ballantyne", "Fort Mill", "Montclaire South", "Olde Whitehall", "Starmount", "Steele Creek"],
  "Piper Glen": ["Ballantyne", "Carmel", "Providence Crossing", "Quail Hollow", "Raintree", "SouthPark"],
  "Plaza Midwood": ["Belmont", "Commonwealth Park", "Eastway", "Elizabeth", "Midtown", "NoDa", "Oakhurst"],
  "Providence Crossing": ["Ballantyne", "Indian Land", "Piper Glen", "Raintree", "Waverly"],
  "Providence Park": ["Cotswold", "Eastover", "Grier Heights", "Myers Park", "North Sharon Amity / Reddman Road", "SouthPark"],
  "Quail Hollow": ["Carmel", "Madison Park", "Piper Glen", "SouthPark", "Starmount"],
  "Raintree": ["Ballantyne", "Carmel", "Matthews", "Piper Glen", "Providence Crossing", "Waverly"],
  "Renaissance Park": ["Arbor Glen", "Olde Whitehall", "Steele Creek"],
  "Rock Hill": ["Fort Mill", "Tega Cay"],
  "Sardis Crossing": ["East Forest", "Matthews", "Sardis Woods"],
  "Sardis Woods": ["East Forest", "Matthews", "Sardis Crossing"],
  "Seversville": ["Enderly Park", "Oakview Terrace", "Wesley Heights"],
  "South End": ["Collingwood", "Dilworth", "LoSo", "Uptown"],
  "SouthPark": ["Carmel", "Closeburn - Glenkirk", "Cotswold", "Madison Park", "Montford", "Myers Park", "Piper Glen", "Providence Park", "Quail Hollow"],
  "Stallings": ["Indian Trail", "Matthews", "Mint Hill"],
  "Stanley": ["Dallas", "Mount Holly"],
  "Starmount": ["Closeburn - Glenkirk", "LoSo", "Madison Park", "Montclaire South", "Pineville", "Quail Hollow"],
  "Steele Creek": ["Fort Mill", "Olde Whitehall", "Pineville", "Renaissance Park", "Tega Cay"],
  "Sugar Creek": ["Belmont", "Druid Hills South", "NoDa", "West Sugar Creek"],
  "Tega Cay": ["Fort Mill", "Rock Hill", "Steele Creek"],
  "University City": ["Concord", "Davis Lake - Eastfield", "Harrisburg", "Hickory Grove", "Highland Creek"],
  "Uptown": ["Dilworth", "Elizabeth", "Lockwood", "Midtown", "Optimist Park", "South End", "Wesley Heights"],
  "Washington Heights": ["Druid Hills South", "Lincoln Heights", "Wesley Heights"],
  "Waverly": ["Ballantyne", "Indian Land", "Providence Crossing", "Raintree", "Waxhaw"],
  "Waxhaw": ["Ballantyne", "Indian Land", "Mineral Springs", "Waverly"],
  "Wedgewood": ["Davis Lake - Eastfield", "Mountain Island", "Northwest Charlotte", "West Sugar Creek"],
  "Wesley Heights": ["Ashley Park", "Enderly Park", "Seversville", "Uptown", "Washington Heights"],
  "West Sugar Creek": ["Sugar Creek", "Wedgewood"],
};

/**
 * Build searchable terms for neighborhoods, sorted by length (longest first).
 * This ensures "Plaza Midwood" matches before "Plaza".
 */
function buildNeighborhoodSearchTerms(): Array<{ term: string; canonical: string }> {
  const terms: Array<{ term: string; canonical: string }> = [];

  // Add canonical neighborhood names from generated data
  for (const neighborhood of NEIGHBORHOODS) {
    terms.push({ term: neighborhood.toLowerCase(), canonical: neighborhood });
  }

  // Add aliases (lowercase for case-insensitive matching)
  for (const [alias, canonical] of Object.entries(NEIGHBORHOOD_ALIASES)) {
    terms.push({ term: alias.toLowerCase(), canonical });
  }

  // Sort by length (longest first) to match longer terms before shorter ones
  return terms.sort((a, b) => b.term.length - a.term.length);
}

/**
 * Build searchable terms for tags, sorted by length (longest first).
 */
function buildTagSearchTerms(): Array<{ term: string; canonical: string }> {
  const terms: Array<{ term: string; canonical: string }> = [];

  for (const tag of TAGS) {
    terms.push({ term: tag.toLowerCase(), canonical: tag });
  }

  // Sort by length (longest first)
  return terms.sort((a, b) => b.term.length - a.term.length);
}

// Pre-build search terms
const NEIGHBORHOOD_SEARCH_TERMS = buildNeighborhoodSearchTerms();
const TAG_SEARCH_TERMS = buildTagSearchTerms();

/**
 * Result of neighborhood detection from a user query.
 */
export interface NeighborhoodDetectionResult {
  /** Neighborhoods explicitly mentioned in the query */
  primary: string[];
  /** Nearby neighborhoods (expanded from primary) */
  nearby: string[];
}

/**
 * Result of entity detection from a user query.
 */
export interface EntityDetectionResult {
  /** Detected neighborhoods with nearby expansion */
  neighborhoods: NeighborhoodDetectionResult;
  /** Detected tags */
  tags: string[];
}

/**
 * Detect all entities (neighborhoods and tags) in a user query.
 * This is the main entry point for entity detection.
 *
 * @param query - The user's search query
 * @returns Detected neighborhoods (with nearby expansion) and tags
 */
export function detectEntities(query: string): EntityDetectionResult {
  return {
    neighborhoods: detectNeighborhoods(query),
    tags: detectTags(query),
  };
}

/**
 * Detect all neighborhoods mentioned in the user's query and expand with nearby neighborhoods.
 * Uses case-insensitive substring matching. Checks longer terms first to match,
 * for example, "Plaza Midwood" before "Plaza".
 *
 * @param query - The user's search query
 * @returns Object with primary (mentioned) and nearby (expanded) neighborhoods
 */
export function detectNeighborhoods(query: string): NeighborhoodDetectionResult {
  const lowerQuery = query.toLowerCase();
  const foundNeighborhoods = new Set<string>();

  // Find all neighborhoods mentioned in the query
  for (const { term, canonical } of NEIGHBORHOOD_SEARCH_TERMS) {
    if (lowerQuery.includes(term)) {
      foundNeighborhoods.add(canonical);
    }
  }

  const primary = Array.from(foundNeighborhoods);

  // Expand with nearby neighborhoods
  const nearbySet = new Set<string>();
  for (const neighborhood of primary) {
    const neighbors = NEARBY_NEIGHBORHOODS[neighborhood] ?? [];
    for (const neighbor of neighbors) {
      // Don't include if it's already a primary neighborhood
      if (!foundNeighborhoods.has(neighbor)) {
        nearbySet.add(neighbor);
      }
    }
  }

  return {
    primary,
    nearby: Array.from(nearbySet),
  };
}

/**
 * Detect all tags mentioned in the user's query.
 * Uses case-insensitive substring matching.
 *
 * @param query - The user's search query
 * @returns Array of detected tags (canonical names)
 */
export function detectTags(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const foundTags = new Set<string>();

  for (const { term, canonical } of TAG_SEARCH_TERMS) {
    if (lowerQuery.includes(term)) {
      foundTags.add(canonical);
    }
  }

  return Array.from(foundTags);
}

/**
 * Get nearby neighborhoods for fallback suggestions.
 * @param neighborhood - Canonical neighborhood name
 * @returns Array of nearby neighborhood names
 */
export function getNearbyNeighborhoods(neighborhood: string): string[] {
  return NEARBY_NEIGHBORHOODS[neighborhood] ?? [];
}
