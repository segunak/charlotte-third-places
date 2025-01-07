// General definition for the schema returned by Airtable
export type Place = {
    recordId: string;
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
    appleMapsProfileURL: string;
    photos: Array<string>;
    comments: string;
    latitude: number;
    longitude: number;
    createdDate: string;
    lastModifiedDate: string;
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

export interface FilterOption {
    value: string;
    placeholder: string;
    label: string;
    predefinedOrder: string[];
}

export interface FilterConfig {
    name: FilterOption;
    type: FilterOption;
    size: FilterOption;
    neighborhood: FilterOption;
    purchaseRequired: FilterOption;
    parkingSituation: FilterOption;
    freeWifi: FilterOption;
    hasCinnamonRolls: FilterOption;
}

export const DEFAULT_FILTER_CONFIG: FilterConfig = {
    name: {
        value: "all",
        placeholder: "Name",
        label: "Name",
        predefinedOrder: [],
    },
    type: {
        value: "all",
        placeholder: "Type",
        label: "Type",
        predefinedOrder: [],
    },
    size: {
        value: "all",
        placeholder: "Size",
        label: "Size",
        predefinedOrder: ["Small", "Medium", "Large"],
    },
    neighborhood: {
        value: "all",
        placeholder: "Neighborhood",
        label: "Neighborhood",
        predefinedOrder: [],
    },
    purchaseRequired: {
        value: "all",
        placeholder: "Purchase Required",
        label: "Purchase Required",
        predefinedOrder: ["Yes", "No"],
    },
    parkingSituation: {
        value: "all",
        placeholder: "Parking Situation",
        label: "Parking Situation",
        predefinedOrder: [],
    },
    freeWifi: {
        value: "all",
        placeholder: "Free Wifi",
        label: "Free Wifi",
        predefinedOrder: ["Yes", "No"],
    },
    hasCinnamonRolls: {
        value: "all",
        placeholder: "Has Cinnamon Rolls",
        label: "Has Cinnamon Rolls",
        predefinedOrder: ["Yes", "No", "Sometimes"],
    },
};