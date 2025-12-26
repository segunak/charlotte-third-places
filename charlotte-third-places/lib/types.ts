// General definition for the schema returned by Airtable
export type Place = {
    recordId: string;
    name: string;
    operational: string;
    type: Array<string>;
    size: string;
    tags: Array<string>;
    neighborhood: string;
    address: string;
    purchaseRequired: string;
    parking: Array<string>;
    freeWiFi: string;
    hasCinnamonRolls: string;
    hasReviews: string;
    featured: boolean;
    description: string;
    website: string;
    tiktok: string;
    instagram: string;
    youtube: string;
    facebook: string;
    twitter: string;
    linkedIn: string;
    googleMapsPlaceId: string;
    googleMapsProfileURL: string;
    appleMapsProfileURL: string;
    photos: Array<string>;
    comments: string;
    latitude: number;
    longitude: number;
    createdDate: Date;
    lastModifiedDate: Date;
}

// Cosmos DB document types for AI/RAG functionality
export interface PlaceDocument {
  id: string;
  airtableRecordId?: string;
  placeName?: string;
  neighborhood?: string;
  address?: string;
  type?: string | string[];
  tags?: string | string[];
  description?: string;
  /** Curator notes - insider knowledge from the database maintainer */
  comments?: string;
  googleMapsProfileUrl?: string;
  appleMapsProfileUrl?: string;
  website?: string;
  freeWifi?: boolean;
  hasCinnamonRolls?: string;
  parking?: string[];
  size?: string;
  purchaseRequired?: boolean;
  placeRating?: number;
  reviewsCount?: number;
  workingHours?: Record<string, string>;
  about?: Record<string, unknown>;
  /** Pre-formatted busy/moderate/quiet hours per day from Google Maps popular times data */
  popularTimesFormatted?: string;
  typicalTimeSpent?: string;
  /** Aggregated review keywords from Google Maps */
  reviewsTags?: string[];
  /** Category from Google Maps */
  category?: string;
  /** Subtypes from Google Maps */
  subtypes?: string[];
  /** Social media and web presence */
  facebook?: string;
  instagram?: string;
  tikTok?: string;
  twitter?: string;
  linkedIn?: string;
  youTube?: string;
  /** Operational status: "Yes", "No", or "Opening Soon" */
  operational?: string;
  embedding?: number[];
  /** Added by vector search results */
  similarityScore?: number;
  /** True if this place is from a nearby neighborhood (not the exact one requested) */
  isFromNearbyNeighborhood?: boolean;
}

export interface ChunkDocument {
  id: string;
  placeId: string;
  airtableRecordId?: string;
  placeName?: string;
  neighborhood?: string;
  address?: string;
  googleMapsProfileUrl?: string;
  appleMapsProfileUrl?: string;
  placeType?: string | string[];
  placeTags?: string | string[];
  reviewText?: string;
  reviewRating?: number;
  reviewDatetimeUtc?: string;
  reviewLink?: string;
  ownerAnswer?: string;
  /** Whether the owner responded to this review */
  hasOwnerResponse?: boolean;
  /** Reviewer ratings/questions (e.g., Food: 5, Service: 4) */
  reviewQuestions?: Record<string, string>;
  reviewsTags?: string[];
  embedding?: number[];
  /** Added by vector search results */
  similarityScore?: number;
}

// Defines the fields that are available for sorting to users.
export enum SortField {
    Name = 'name',
    DateAdded = 'createdDate',
    LastModified = 'lastModifiedDate',
}

export enum SortDirection {
    Ascending = 'asc',
    Descending = 'desc',
}

export interface SortOption {
    field: SortField;
    direction: SortDirection;
}

export const DEFAULT_SORT_OPTION = {
    field: SortField.DateAdded,
    direction: SortDirection.Descending,
};
