import Link from "next/link";
import * as React from "react";
import type { Metadata } from 'next'
import { getPlaces } from '@/lib/data-services';
import { PlaceMap } from "@/components/PlaceMap";
import { FilterDrawer } from '@/components/FilterDrawer';
import { MobileFindMeButton } from '@/components/MobileFindMeButton';
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
            {/* Mobile: Full-screen map with no header text */}
            <div className="sm:hidden min-h-screen relative">
                <div className="w-full h-screen">
                    <PlaceMap places={places} fullScreen={true} />
                </div>
                <MobileFindMeButton className="fixed right-3 z-50" style={{ top: '5rem' }} />
                <FilterDrawer showSort={false} className="fixed right-3 z-50" style={{ bottom: '5rem' }} />
            </div>

            {/* Desktop */}
            <div className="hidden sm:grid grid-cols-[minmax(0,_1fr)_265px] min-h-screen">
                <section className="px-20 py-8 relative">
                    <div className="mb-4 space-y-3">
                        <h1 className="text-3xl font-bold">
                            Explore <span className="text-primary">{places.length}</span> Third Places in{" "}
                            Charlotte, North Carolina
                        </h1>
                        <p className="text-pretty">
                            Discover <ResponsiveLink href="https://en.wikipedia.org/wiki/Third_place">third places</ResponsiveLink> in Charlotte, North Carolina and its <ResponsiveLink href="https://en.wikipedia.org/wiki/Charlotte_metropolitan_area">surrounding areas</ResponsiveLink>. You can also browse the <Link href="/" className="custom-link">full list</Link>, <Link href="/contribute" className="custom-link">share feedback</Link>, or <Link href="/about" className="custom-link">learn about this project</Link>. {" "}
                            Click any <span className="font-bold text-primary">marker</span> for more info about a place.
                        </p>
                    </div>
                    <div className="w-full h-[80vh] mb-4">
                        <PlaceMap places={places} />
                    </div>
                </section>

                <div className="mt-8 mr-6">
                    <FilterSidebar showSort={false} className="max-w-[265px] border border-border sticky top-16 px-4 space-y-4" />
                </div>
            </div>
        </FilterProvider>
    );
}
