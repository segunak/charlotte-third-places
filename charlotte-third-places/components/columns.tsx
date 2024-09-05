"use client"

import { Place } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"

export const DataTableColumns: ColumnDef<Place>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "type",
    header: "Type",
    enableSorting: true, // Enables sorting for the Size column
    filterFn: "includesString", // Add a basic filtering functionality (e.g., exact match)
  },
  {
    accessorKey: "size",
    header: "Size",
  },
  {
    accessorKey: "neighborhood",
    header: "Neighborhood",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "purchaseRequired",
    header: "Purchase Required",
  },
  {
    accessorKey: "parkingSituation",
    header: "Parking Situation",
  },
  {
    accessorKey: "freeWifi",
    header: "Free Wifi",
  },
  {
    accessorKey: "hasCinnamonRolls",
    header: "Cinnamon Rolls",
  },
  {
    accessorKey: "hasReviews",
    header: "Has Reviews",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "website",
    header: "Website",
    cell: ({ row }) => (
      <a href={row.original.website} target="_blank" rel="noopener noreferrer">
        {row.original.website}
      </a>
    ),
  },
  {
    accessorKey: "googleMapsProfileURL",
    header: "Google Maps",
    cell: ({ row }) => (
      <a href={row.original.googleMapsProfileURL} target="_blank" rel="noopener noreferrer">
        View on Google Maps
      </a>
    ),
  },
  {
    accessorKey: "comments",
    header: "Comments",
  },
];

