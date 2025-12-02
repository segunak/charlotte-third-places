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
  place?: string;
  neighborhood?: string;
  address?: string;
  type?: string | string[];
  tags?: string | string[];
  description?: string;
  googleMapsProfileUrl?: string;
  appleMapsProfileUrl?: string;
  website?: string;
  freeWifi?: boolean;
  parking?: string;
  size?: string;
  purchaseRequired?: boolean;
  placeRating?: number;
  reviewsCount?: number;
  workingHours?: Record<string, string>;
  about?: Record<string, unknown>;
  typicalTimeSpent?: string;
  embedding?: number[];
  /** Added by vector search results */
  similarityScore?: number;
}

export interface ChunkDocument {
  id: string;
  placeId: string;
  placeName?: string;
  neighborhood?: string;
  address?: string;
  placeType?: string | string[];
  placeTags?: string | string[];
  reviewText?: string;
  reviewRating?: number;
  reviewDatetimeUtc?: string;
  reviewLink?: string;
  ownerAnswer?: string;
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
