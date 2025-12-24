/**
 * Charlotte, NC Neighborhood Data for RAG Query Boosting.
 *
 * Provides:
 * - NEIGHBORHOODS: Canonical list of 88 neighborhoods in the database
 * - NEIGHBORHOOD_ALIASES: ~200 aliases/nicknames/misspellings to canonical names
 * - NEIGHBORHOOD_ADJACENCIES: Geographic neighbor relationships (bidirectional)
 * - detectNeighborhood(): Simple detection for query boosting
 * - getAdjacentNeighborhoods(): Get nearby neighborhoods for suggestions
 */

/**
 * Canonical list of all 88 neighborhoods in the Airtable database.
 * These are the exact values used in the "neighborhood" field.
 */
export const NEIGHBORHOODS = [
  "Arbor Glen",
  "Ashley Park",
  "Ballantyne",
  "Belmont",
  "Belmont (City)",
  "Bradfield Farms",
  "Carmel",
  "China Grove",
  "Closeburn - Glenkirk",
  "Collingwood",
  "Commonwealth Park",
  "Concord",
  "Cornelius",
  "Cotswold",
  "Dallas",
  "Davidson",
  "Davis Lake - Eastfield",
  "Denver",
  "Dilworth",
  "Druid Hills South",
  "East Forest",
  "Eastover",
  "Eastway",
  "Elizabeth",
  "Enderly Park",
  "Fort Mill",
  "Gastonia",
  "Grier Heights",
  "Harrisburg",
  "Hickory Grove",
  "Highland Creek",
  "Huntersville",
  "Independence Blvd",
  "Indian Land",
  "Indian Trail",
  "Kannapolis",
  "Kings Mountain",
  "Landis",
  "Lincoln Heights",
  "Lockwood",
  "LoSo",
  "Madison Park",
  "Matthews",
  "Midtown",
  "Mineral Springs",
  "Mint Hill",
  "Monroe",
  "Montclaire South",
  "Montford",
  "Mooresville",
  "Mount Holly",
  "Mountain Island",
  "Myers Park",
  "NoDa",
  "North Sharon Amity / Reddman Road",
  "Northwest Charlotte",
  "Oakhurst",
  "Oakview Terrace",
  "Olde Whitehall",
  "Optimist Park",
  "Pineville",
  "Piper Glen",
  "Plaza Midwood",
  "Providence Crossing",
  "Providence Park",
  "Quail Hollow",
  "Raintree",
  "Renaissance Park",
  "Rock Hill",
  "Sardis Crossing",
  "Sardis Woods",
  "Seversville",
  "South End",
  "SouthPark",
  "Stallings",
  "Stanley",
  "Starmount",
  "Steele Creek",
  "Sugar Creek",
  "Tega Cay",
  "University City",
  "Uptown",
  "Washington Heights",
  "Waverly",
  "Waxhaw",
  "Wedgewood",
  "Wesley Heights",
  "West Sugar Creek",
] as const;

export type Neighborhood = (typeof NEIGHBORHOODS)[number];

/**
 * Maps aliases, nicknames, abbreviations, and misspellings to canonical names.
 * Only includes non-obvious mappings that AI/embedding models wouldn't infer.
 * Keys are lowercase for case-insensitive matching.
 */
export const NEIGHBORHOOD_ALIASES: Record<string, Neighborhood> = {
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
 * Geographic adjacency map. Each neighborhood maps to its immediate neighbors.
 * Relationships are bidirectional (if A lists B, B lists A).
 * Validated against Charlotte metro geography.
 */
export const NEIGHBORHOOD_ADJACENCIES: Record<Neighborhood, Neighborhood[]> = {
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
 * All searchable terms sorted by length (longest first).
 * This ensures, for example, that "Plaza Midwood" matches before "Plaza".
 */
const SEARCHABLE_TERMS: Array<{ term: string; canonical: Neighborhood }> = [
  // Add canonical names
  ...NEIGHBORHOODS.map((n) => ({ term: n.toLowerCase(), canonical: n })),
  // Add aliases
  ...Object.entries(NEIGHBORHOOD_ALIASES).map(([alias, canonical]) => ({
    term: alias,
    canonical,
  })),
].sort((a, b) => b.term.length - a.term.length);

/**
 * Detect a neighborhood mentioned in the user's query.
 * Uses simple case-insensitive substring matching.
 * Checks longer terms first to match, for example, "Plaza Midwood" before "Plaza".
 *
 * @param query - The user's search query
 * @returns Canonical neighborhood name or null if none detected
 */
export function detectNeighborhood(query: string): Neighborhood | null {
  const lowerQuery = query.toLowerCase();

  for (const { term, canonical } of SEARCHABLE_TERMS) {
    if (lowerQuery.includes(term)) {
      return canonical;
    }
  }

  return null;
}

/**
 * Get adjacent neighborhoods for fallback suggestions.
 * @param neighborhood - Canonical neighborhood name
 * @returns Array of adjacent neighborhood names
 */
export function getAdjacentNeighborhoods(
  neighborhood: Neighborhood
): Neighborhood[] {
  return NEIGHBORHOOD_ADJACENCIES[neighborhood] ?? [];
}
