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
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px]">
                {/* Main map content */}
                <div className="overflow-hidden">
                    <header className="px-4 sm:px-12 pt-4 mb-4 mx-auto">
                        <h1 className="text-2xl font-bold mb-2">Explore the Map</h1>
                        <p>Explore a map of various third places in Charlotte, North Carolina. Use the {" "}
                            <span className="sm:hidden">button in the lower-right corner</span>
                            <span className="hidden sm:inline">sidebar on the right</span>
                            {" "} to filter and search through the list.
                            <span className="font-bold custom-highlight">
                                {" "} Click on a marker to learn more about a place.
                            </span>
                        </p>
                    </header>

                    <div className="w-full h-screen px-4 sm:px-12 mx-auto mb-4 overflow-hidden">
                        <PlaceMap places={places} />
                    </div>
                </div>

                {/* On mobile, this provides a button in the lower right for filtering */}
                <div className="md:hidden">
                    <FilterDialog className="fixed right-3 z-50" style={{ bottom: '5rem' }} />
                </div>

                {/* On desktop, this provides a dedicated sidebar for filtering */}
                <div className="hidden md:block">
                    <FilterSidebar className="p-4 space-y-4 bg-background border-l border-border h-screen sticky top-12" />
                </div>
            </div>
        </FilterProvider>
    );
}
