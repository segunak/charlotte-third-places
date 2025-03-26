import Link from "next/link";
import * as React from "react";
import type { Metadata } from 'next'
import { getPlaces } from '@/lib/data-services';
import { PlaceMap } from "@/components/PlaceMap";
import { FilterDialog } from '@/components/FilterDialog';
import { FilterProvider } from '@/contexts/FilterContext';
import { FilterSidebar } from '@/components/FilterSidebar';
import { ResponsiveLink } from "@/components/ResponsiveLink";

export const metadata: Metadata = {
    title: 'Map',
}

// See https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
export const dynamic = "force-static"

export default async function MapPage() {
    const places = await getPlaces();

    return (
        <FilterProvider places={places}>
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,_1fr)_265px] min-h-screen">
                <section className="px-4 sm:px-20 py-8">
                    <div className="mb-4 space-y-3">
                        <h1 className="text-3xl font-bold">
                            Explore <span className="text-primary">{places.length}</span> Third Places in{" "}
                            <span className="sm:hidden">Charlotte</span>
                            <span className="hidden sm:inline">Charlotte, North Carolina</span>
                        </h1>
                        <p className="text-pretty">
                            Discover <ResponsiveLink href="https://en.wikipedia.org/wiki/Third_place">third places</ResponsiveLink> in Charlotte, North Carolina and its <ResponsiveLink href="https://en.wikipedia.org/wiki/Charlotte_metropolitan_area">surrounding areas</ResponsiveLink> with the map below. {" "}
                            <span className="hidden sm:inline">
                                {" "} Prefer a list? Click <Link href="/" className="custom-link">here</Link>. Have a suggestion or enhancement? Click <Link href="/contribute" className="custom-link">here</Link>. To learn more about the site, click <Link href="/about" className="custom-link">here</Link>.
                            </span>
                        </p>
                        <p className="text-pretty">
                            Click any marker for more info about a place. Use the <span className="font-bold text-primary">Find Me</span> button in the upper-right corner to see your location on the map. {" "}
                            <span className="font-bold text-primary">Filter</span> using the {" "}
                            <span className="sm:hidden">
                                button in the <span className="font-bold text-primary">lower-right</span> corner.
                            </span>
                            <span className="hidden sm:inline">
                                <span className="font-bold text-primary">sidebar</span> on the right.
                            </span>
                        </p>
                    </div>
                    <div className="w-full h-[70vh] sm:h-[80vh] mb-0 sm:mb-4">
                        <PlaceMap places={places} />
                    </div>
                </section>

                {/*On mobile, this provides a button in the lower right for filtering */}
                <div className="sm:hidden">
                    <FilterDialog showSort={false} className="fixed right-3 z-50" style={{ bottom: '5rem' }} />
                </div>

                {/*On desktop, this provides a dedicated sidebar for filtering */}
                <div className="hidden sm:block mt-8 mr-6">
                    <FilterSidebar showSort={false} className="max-w-[265px] border border-border sticky top-16 px-4 space-y-4" />
                </div>
            </div>
        </FilterProvider>
    );
}
