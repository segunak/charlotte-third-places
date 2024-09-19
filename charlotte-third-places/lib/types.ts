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
}