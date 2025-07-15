import Link from "next/link";
import * as React from "react";
import type { Metadata } from 'next'
import { getPlaces } from '@/lib/data-services';
import { PlaceMap } from "@/components/PlaceMap";
import { FilterDrawer } from '@/components/FilterDrawer';
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
                            <span className="hidden sm:inline">
                                Discover <ResponsiveLink href="https://en.wikipedia.org/wiki/Third_place">third places</ResponsiveLink> in Charlotte, North Carolina and its <ResponsiveLink href="https://en.wikipedia.org/wiki/Charlotte_metropolitan_area">surrounding areas</ResponsiveLink>. You can also browse the <Link href="/" className="custom-link">full list</Link>, <Link href="/contribute" className="custom-link">share feedback</Link>, or <Link href="/about" className="custom-link">learn about this project</Link>. {" "}
                            </span>
                            {/* Show "tap" on mobile, "click" on desktop */}
                            <span className="inline sm:hidden">Tap</span>
                            <span className="hidden sm:inline">Click</span>{" "}

                            any <span className="font-bold text-primary">marker</span> for more info about a place.
                            <span className="sm:hidden">
                                {" "}<span className="font-bold text-primary">Filter</span> using the button in the lower-right.
                            </span>
                        </p>
                    </div>
                    <div className="w-full h-[70vh] sm:h-[80vh] mb-0 sm:mb-4">
                        <PlaceMap places={places} />
                    </div>
                </section>

                {/*On mobile, this provides a button in the lower right for filtering */}
                <div className="sm:hidden">
                    <FilterDrawer showSort={false} className="fixed right-3 z-50" style={{ bottom: '5rem' }} />
                </div>

                {/*On desktop, this provides a dedicated sidebar for filtering */}
                <div className="hidden sm:block mt-8 mr-6">
                    <FilterSidebar showSort={false} className="max-w-[265px] border border-border sticky top-16 px-4 space-y-4" />
                </div>
            </div>
        </FilterProvider>
    );
}
