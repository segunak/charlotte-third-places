import { ColDef } from '@ag-grid-community/core';

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
  comments: string;
}

// Column definitions for the AG Grid defined in data-table.tsx and used in app/page.tsx (the homepage)
export const gridColumns: ColDef[] = [
  // {
  //   headerName: "Record ID",
  //   field: "airtableRecordId"
  // },
  {
    headerName: "Name",
    field: "name",
    pinned: 'left',
    filter: true,
    filterParams: {
      filterOptions: ['contains'],
      suppressFilterButton: false, // This will display the "Clear" button
      buttons: ["reset"],
      maxNumConditions: 1,
    },
  },
  {
    headerName: "Type",
    field: "type",
    filter: true,
    filterParams: {
      filterOptions: ['contains'],
      buttons: ["reset"],
      maxNumConditions: 1,
    },
  },
  {
    headerName: "Size",
    field: "size",
    filter: true,
    filterParams: {
      filterOptions: ['contains'],
      suppressFilterButton: false, // This will display the "Clear" button
      buttons: ["reset"],
      maxNumConditions: 1,
    },
  },
  // {
  //   headerName: "Ambience",
  //   field: "ambience"
  // }, // TODO - Make sure this column is fully populated and start displaying.
  {
    headerName: "Neighborhood",
    field: "neighborhood",
    filter: true,
    filterParams: {
      filterOptions: ['contains'],
      suppressFilterButton: false, // This will display the "Clear" button
      buttons: ["reset"],
      maxNumConditions: 1,
    },
  },
  {
    headerName: "Address",
    field: "address"
  },
  {
    headerName: "Purchase Required",
    field: "purchaseRequired",
    filter: true,
    filterParams: {
      filterOptions: ['contains'],
      suppressFilterButton: false, // This will display the "Clear" button
      buttons: ["reset"],
      maxNumConditions: 1,
    },
  },
  {
    headerName: "Parking Situation",
    field: "parkingSituation",
    filter: true,
    filterParams: {
      filterOptions: ['contains'],
      suppressFilterButton: false, // This will display the "Clear" button
      buttons: ["reset"],
      maxNumConditions: 1,
    },
  },
  {
    headerName: "Free Wifi",
    field: "freeWifi",
    filter: true,
    filterParams: {
      filterOptions: ['contains'],
      suppressFilterButton: false, // This will display the "Clear" button
      buttons: ["reset"],
      maxNumConditions: 1,
    },
  },
  {
    headerName: "Has Cinnamon Rolls",
    field: "hasCinnamonRolls",
    filter: true,
    filterParams: {
      filterOptions: ['contains'],
      suppressFilterButton: false, // This will display the "Clear" button
      buttons: ["reset"],
      maxNumConditions: 1,
    },
  },
  // {
  //   headerName: "Has Reviews",
  //   field: "hasReviews"
  // },
  {
    headerName: "Description",
    field: "description"
  },
  {
    headerName: "Website",
    field: "website"
  },
  // {
  //   headerName: "Google Maps Place ID",
  //   field: "googleMapsPlaceId"
  // },
  {
    headerName: "Google Maps Profile",
    field: "googleMapsProfileURL"
  },
  {
    headerName: "Cover Photo URL",
    field: "coverPhotoURL"
  },
  {
    headerName: "Comments",
    field: "comments"
  }
];
