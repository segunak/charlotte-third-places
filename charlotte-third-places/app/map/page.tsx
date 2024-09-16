import * as React from "react";
import { getPlaces } from '@/lib/data-services';
import { PlaceMap } from "@/components/PlaceMap";

// See https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration
// This results in Next.js refreshing the data from Airtable once for the whole site every 12 hours.
// In between, the site uses cached data.
export const revalidate = 43200; // Revalidate the data every 12 hours

export default async function MapPage() {
    const places = await getPlaces();

    return (
        <div className="grid grid-rows-[auto_1fr] px-4 sm:px-12 py-8 mx-auto">
            <header className="mb-4">
                <h1 className="text-2xl font-bold mb-2">Explore the Map</h1>
                <p>Use the map below to explore various third places in Charlotte, North Carolina. Click on a marker to learn more about a place.</p>
            </header>

            <div className="w-full h-[75dvh] sm:h-[90dvh] mx-auto overflow-hidden">
                <PlaceMap places={places} />
            </div>
        </div>
    );
}
