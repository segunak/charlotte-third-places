"use client";

import { Place } from "@/lib/types";
import { FilterSidebar } from "@/components/FilterSidebar";
import { FilterDrawer } from "@/components/FilterDrawer";
import { MobileQuickFilters } from "@/components/MobileQuickFilters";
import { OpeningSoonModal } from "@/components/OpeningSoonModal";
import React, { useEffect, useRef, useState, Suspense, useMemo } from "react";
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
    const openingSoonPlaces = useMemo(() => places.filter(p => p.operational === 'Opening Soon'), [places]);
    const [openingSoonOpen, setOpeningSoonOpen] = useState(false);

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

                {/* Opening Soon Banner on Mobile and Desktop*/}
                {openingSoonPlaces.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setOpeningSoonOpen(true)}
                        aria-haspopup="dialog"
                        aria-expanded={openingSoonOpen}
                        aria-label={`View ${openingSoonPlaces.length} places opening soon`}
                        className="group w-full text-left mb-2 relative overflow-hidden rounded-lg border border-border bg-card/80 backdrop-blur-sm px-4 py-3 shadow-sm hover:shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 text-primary">
                                {/* clock icon */}
                                <span className="inline-block">
                                    {/* Reuse Icons.clock */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-foreground mb-0.5">
                                    {openingSoonPlaces.length} {openingSoonPlaces.length === 1 ? 'place' : 'places'} opening soon
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Preview spots before they open. Tap for details.
                                </p>
                            </div>
                            <div className="self-center text-primary transition-transform group-hover:translate-x-0.5">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                            </div>
                        </div>
                        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
                    </button>
                )}
                {openingSoonPlaces.length > 0 && (
                    <OpeningSoonModal
                        open={openingSoonOpen}
                        onOpenChange={setOpeningSoonOpen}
                        places={openingSoonPlaces}
                    />
                )}

                {/* DataTable Section */}
                <section ref={dataTableRef}>
                    <Suspense fallback={<div className="mt-16 flex items-center justify-center"><div className="loader animate-spin ease-linear rounded-full border-4 border-t-4 border-primary h-12 w-12 border-t-transparent"></div></div>}>
                        {/* DataTable receives the already mobile-filtered array (displayedPlaces).
                            This keeps DataTable focused on presentation + generic filtering/sorting logic only. */}
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
