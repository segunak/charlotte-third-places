import Link from "next/link";
import * as React from "react";
import { getPlaces } from '@/lib/data-services';
import { PlaceMap } from "@/components/PlaceMap";
import { FilterDialog } from '@/components/FilterDialog';
import { FilterProvider } from '@/contexts/FilterContext';
import { FilterSidebar } from '@/components/FilterSidebar';
import { ResponsiveLink } from "@/components/ResponsiveLink";

// See https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration
// This results in Next.js refreshing the data from Airtable once for the whole site every 12 hours.
// In between, the site uses cached data.
export const revalidate = 43200; // Revalidate the data every 12 hours

export default async function MapPage() {
    const places = await getPlaces();

    return (
        <FilterProvider places={places}>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_250px] min-h-screen">
                <section className="px-4 sm:px-20 py-8 mx-auto">
                    <div className="mb-4 space-y-3">
                        <h1 className="text-3xl font-bold">
                            Explore <span className="text-primary">{places.length}</span> Third Places in{" "}
                            <span className="sm:hidden">Charlotte</span>
                            <span className="hidden sm:inline">Charlotte, North Carolina</span>
                        </h1>
                        <p>
                            Discover <ResponsiveLink href="https://en.wikipedia.org/wiki/Third_place">third places</ResponsiveLink> in Charlotte, North Carolina and its <ResponsiveLink href="https://en.wikipedia.org/wiki/Charlotte_metropolitan_area">surrounding areas</ResponsiveLink> with the map below. {" "}
                            <span className="hidden sm:inline">
                                {" "} Prefer a list? Click <Link href="/" className="custom-link">here</Link>. Have a suggestion or enhancement? Click <Link href="/contribute" className="custom-link">here</Link>. To learn more about the site, click <Link href="/about" className="custom-link">here</Link>.
                            </span>
                            <span className="font-bold text-primary">
                                {" "} Filter and search the map using the {" "}
                                <span className="sm:hidden">button in the lower-right corner.</span>
                                <span className="hidden sm:inline">sidebar on the right.</span>
                                {" "}Click on any marker to see more information about that place.
                            </span>
                        </p>
                    </div>
                    <div className="w-full h-[60vh] sm:h-[80vh] mb-4 mx-auto">
                        <PlaceMap places={places} />
                    </div>
                </section>

                {/*On mobile, this provides a button in the lower right for filtering */}
                <div className="sm:hidden">
                    <FilterDialog className="fixed right-3 z-50" style={{ bottom: '5rem' }} />
                </div>

                {/*On desktop, this provides a dedicated sidebar for filtering */}
                <div className="hidden sm:block bg-background border-x border-border">
                    <FilterSidebar className="max-w-[250px] sticky top-16 h-0 p-4 space-y-4" />
                </div>
            </div>
        </FilterProvider>
    );
}
