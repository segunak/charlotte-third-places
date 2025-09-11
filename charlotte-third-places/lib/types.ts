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
