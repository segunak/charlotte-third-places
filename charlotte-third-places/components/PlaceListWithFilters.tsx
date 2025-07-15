"use client";

import { Place } from "@/lib/types";
import { FilterSidebar } from "@/components/FilterSidebar";
import { FilterDrawer } from "@/components/FilterDrawer";
import { MobileQuickFilters } from "@/components/MobileQuickFilters";
import React, { useEffect, useRef, useState, Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamically import DataTable for lazy loading
const DataTable = dynamic<{ rowData: Place[] }>(() => import("@/components/DataTable").then(mod => mod.DataTable), {
    ssr: false,
    loading: () => <div className="mt-16 flex items-center justify-center"><div className="loader animate-spin ease-linear rounded-full border-4 border-t-4 border-primary h-12 w-12 border-t-transparent"></div></div>,
});

interface PlaceListWithFiltersProps {
    places: Place[];
}

export function PlaceListWithFilters({ places }: PlaceListWithFiltersProps) {
    // Custom hook for intersection observer
    function useInView<T extends HTMLElement = HTMLElement>(options?: IntersectionObserverInit) {
        const ref = useRef<T | null>(null);
        const [inView, setInView] = useState(true); // Default to true for SSR/first render

        useEffect(() => {
            if (!ref.current) return;
            const observer = new window.IntersectionObserver(
                ([entry]) => setInView(entry.isIntersecting),
                options
            );
            observer.observe(ref.current);
            return () => observer.disconnect();
        }, [options]);

        return [ref, inView] as const;
    }

    const [dataTableRef, isDataTableInView] = useInView<HTMLDivElement>({ threshold: 0.01 });
    const [quickFiltersRef, isQuickFiltersInView] = useInView<HTMLDivElement>({ threshold: 0.3 });

    return (
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,_1fr)_265px]">
            <div className="col-span-1 space-y-4 mb-4 sm:mb-0 sm:pr-12">
                {/* Intro Text */}
                <div id="browse-section" className="text-2xl font-bold">Browse</div>
                <p className="text-pretty">
                    {/* Always visible portion */}
                    Browse the complete list of places.{" "}

                    {/* Mobile-only text */}
                    <span className="inline sm:hidden">
                        Use the menu below or the <span className="font-bold text-primary">filter button</span> in the lower-right corner for more options.
                    </span>

                    {/* Desktop-only text */}
                    <span className="hidden sm:inline">
                        Use the <span className="font-bold text-primary">sidebar on the right</span> to sort and filter.
                    </span>
                </p>

                <div className="sm:hidden" ref={quickFiltersRef}>
                    <MobileQuickFilters />
                </div>

                {/* DataTable Section */}
                <section ref={dataTableRef}>
                    <Suspense fallback={<div className="mt-16 flex items-center justify-center"><div className="loader animate-spin ease-linear rounded-full border-4 border-t-4 border-primary h-12 w-12 border-t-transparent"></div></div>}>
                        <DataTable rowData={places} />
                    </Suspense>
                </section>

                {/* Mobile only */}
                <div className="sm:hidden">
                    <FilterDrawer
                        showSort={true}
                        className="fixed right-3 z-50"
                        style={{ bottom: '5rem' }}
                        showButton={isQuickFiltersInView || isDataTableInView}
                    />
                </div>
            </div>

            {/* Second Column: Desktop Filter Sidebar */}
            <div className="hidden sm:block">
                <FilterSidebar
                    showSort={true}
                    className="max-w-[265px] border border-border sticky top-16 px-6 space-y-[.65rem]"
                />
            </div>
        </div>
    );
}
