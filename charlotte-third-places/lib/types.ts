import { ColDef } from '@ag-grid-community/core';

export type Place = {
  airtableRecordId: string;
  name: string;
  type: string;
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
  comments: string;
}

export const gridColumns: ColDef[] = [
  { headerName: "Record ID", field: "airtableRecordId" },
  { headerName: "Name", field: "name", pinned: 'left', filter: true, filterParams: { buttons: 'reset | clear'} },
  { headerName: "Type", field: "type", filter: true },
  { headerName: "Size", field: "size", filter: true },
  { headerName: "Ambience", field: "ambience" }, // Will display array as is
  { headerName: "Neighborhood", field: "neighborhood", filter: true },
  { headerName: "Address", field: "address" },
  { headerName: "Purchase Required", field: "purchaseRequired"},
  { headerName: "Parking Situation", field: "parkingSituation" },
  { headerName: "Free Wifi", field: "freeWifi" },
  { headerName: "Has Cinnamon Rolls", field: "hasCinnamonRolls" },
  { headerName: "Has Reviews", field: "hasReviews" },
  { headerName: "Description", field: "description" },
  { headerName: "Website", field: "website" }, // Display the website URL as plain text
  { headerName: "Google Maps Place ID", field: "googleMapsPlaceId" },
  { headerName: "Google Maps Profile", field: "googleMapsProfileURL" }, // Display the Google Maps URL as plain text
  { headerName: "Cover Photo URL", field: "coverPhotoURL" }, // Display the cover photo URL as plain text
  { headerName: "Comments", field: "comments" }
];
