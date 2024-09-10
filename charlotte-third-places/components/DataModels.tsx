"use client"

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
  localCoverPhotoURL: string;
  comments: string;
}

/**
 * Normalizes text for improved searching and filtering in AG Grid.
 * This function removes diacritics, replaces specific ligatures,
 * removes most special characters, and converts the text to lowercase.
 * 
 * @param value - The input string to be normalized. Can be null or undefined.
 * @returns A normalized string suitable for case-insensitive, accent-insensitive searching.
 */
const normalizeTextForSearch = (value: string | null | undefined): string => {
  // Return an empty string if the input is null, undefined, or not a string
  if (value == null || typeof value !== 'string') {
    return '';
  }

  return value
    // Step 1: Normalize Unicode characters to their base form + diacritic mark
    .normalize('NFD')
    // Step 2: Remove all diacritic marks (accent characters)
    .replace(/[\u0300-\u036f]/g, '')
    // Step 3: Replace specific ligatures and special characters
    .replace(/[œ]/g, 'oe')  // Replace 'œ' with 'oe'
    .replace(/[æ]/g, 'ae')  // Replace 'æ' with 'ae'
    .replace(/[ø]/g, 'o')   // Replace 'ø' with 'o'
    .replace(/[ß]/g, 'ss')  // Replace 'ß' with 'ss'
    // Step 4: Remove all special characters except comma, apostrophe, and hyphen
    // \w matches any word character (alphanumeric + underscore)
    // \s matches any whitespace character
    .replace(/[^\w\s,'''-]/g, '')
    // Step 5: Convert the resulting string to lowercase for case-insensitive matching
    .toLowerCase();
};

// Column definitions for the AG Grid
export const gridColumns: ColDef[] = [
  {
    headerName: "Name",
    field: "name",
    pinned: 'left',
    filter: true,
    getQuickFilterText: params => {
      return normalizeTextForSearch(params.value);
    },
    filterParams: {
      filterOptions: ['contains'],
      buttons: ["reset"],
      maxNumConditions: 1,
      textFormatter: normalizeTextForSearch,
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
      textFormatter: normalizeTextForSearch,
    },
  },
  {
    headerName: "Size",
    field: "size",
    filter: true,
    filterParams: {
      filterOptions: ['contains'],
      buttons: ["reset"],
      maxNumConditions: 1,
      textFormatter: normalizeTextForSearch,
    },
  },
  // {
  //   headerName: "Ambience",
  //   field: "ambience",
  //   filter: true,
  //   filterParams: {
  //     filterOptions: ['contains'],
  //     buttons: ["reset"],
  //     maxNumConditions: 1,
  //     textFormatter: normalizeTextForSearch,
  //   },
  // }, // TODO - Make sure this column is fully populated and start displaying.
  {
    headerName: "Neighborhood",
    field: "neighborhood",
    filter: true,
    filterParams: {
      filterOptions: ['contains'],
      buttons: ["reset"],
      maxNumConditions: 1,
      textFormatter: normalizeTextForSearch,
    },
  },
  // {
  //   headerName: "Address",
  //   field: "address"
  // },
  {
    headerName: "Purchase Required",
    field: "purchaseRequired",
    filter: true,
    filterParams: {
      filterOptions: ['contains'],
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
      buttons: ["reset"],
      maxNumConditions: 1,
      textFormatter: normalizeTextForSearch,
    },
  },
  {
    headerName: "Free Wifi",
    field: "freeWifi",
    filter: true,
    filterParams: {
      filterOptions: ['contains'],
      buttons: ["reset"],
      maxNumConditions: 1,
      textFormatter: normalizeTextForSearch,
    },
  },
  {
    headerName: "Has Cinnamon Rolls",
    field: "hasCinnamonRolls",
    filter: true,
    filterParams: {
      filterOptions: ['contains'],
      buttons: ["reset"],
      maxNumConditions: 1,
      textFormatter: normalizeTextForSearch,
    },
  },
  // {
  //   headerName: "Description",
  //   field: "description"
  // },
  // {
  //   headerName: "Website",
  //   field: "website"
  // },
  // {
  //   headerName: "Google Maps Profile",
  //   field: "googleMapsProfileURL",
  //   cellRenderer: (props: any) => {
  //     return (
  //       <a href={props.value}  target="_blank" rel="noopener noreferrer" 
  //         style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>
  //         View Profile
  //       </a>
  //     );
  //   }
  // },
  // {
  //   headerName: "Cover Photo URL",
  //   field: "coverPhotoURL",
  //   cellRenderer: (props: any) => {
  //     return (
  //       <a href={props.value} target="_blank" rel="noopener noreferrer">
  //         View Photo
  //       </a>
  //     );
  //   }
  // },
  // {
  //   headerName: "Comments",
  //   field: "comments"
  // }
];
