// General definition for the schema returned by Airtable
export type Place = {
    airtableRecordId: string;
    name: string;
    type: Array<string>;
    size: string;
    ambience: Array<string>;
    neighborhood: string;
    address: string;
    purchaseRequired: string;
    parkingSituation: string;
    freeWifi: string;
    hasCinnamonRolls: string;
    hasReviews: string;
    description: string;
    website: string;
    googleMapsPlaceId: string;
    googleMapsProfileURL: string;
    coverPhotoURL: string;
    localCoverPhotoURL: string;
    comments: string;
    latitude: number;
    longitude: number;
    createdDate: string;
    lastModifiedDate: string;
}

// Default sorting option for the application
export enum SortField {
    Name = 'name',
    DateAdded = 'createdDate',
    LastModified = 'lastModifiedDate',
}

export enum SortDirection {
    Ascending = 'asc',
    Descending = 'desc',
}

export const DEFAULT_SORT_OPTION = {
    field: SortField.DateAdded,
    direction: SortDirection.Descending,
};
