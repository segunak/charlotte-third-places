import * as React from "react";
import { getPlaces } from '@/lib/data-services';
import { PlaceMap } from "@/components/PlaceMap";
import { FilterProvider } from '@/contexts/FilterContext';
import { FilterSidebar } from '@/components/FilterSidebar';
import { FilterDialog } from '@/components/FilterDialog';

// See https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration
// This results in Next.js refreshing the data from Airtable once for the whole site every 12 hours.
// In between, the site uses cached data.
export const revalidate = 43200; // Revalidate the data every 12 hours

export default async function MapPage() {
    const places = await getPlaces();

    return (
        <FilterProvider places={places}>
            <div className="flex flex-col md:flex-row px-4 sm:px-12 py-8 mx-auto">
                {/* Main map content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="mb-4">
                        <h1 className="text-2xl font-bold mb-2">Explore the Map</h1>
                        <p>Use the map below to explore various third places in Charlotte, North Carolina. <span className="font-bold custom-highlight">Click on a marker to learn more about a place.</span></p>
                    </header>

                    {/* Map container */}
                    <div className="flex-1 relative overflow-hidden rounded-lg border border-gray-200 shadow-xl">
                        <PlaceMap places={places} />
                    </div>
                </div>

                {/* On mobile, this provides a button in the lower right for filtering */}
                <div className="md:hidden">
                    <FilterDialog />
                </div>

                {/* On desktop, this provides a dedicated sidebar for filtering */}
                <div className="hidden md:block md:w-[220px] ml-4">
                    <FilterSidebar />
                </div>
            </div>
        </FilterProvider>
    );
}
