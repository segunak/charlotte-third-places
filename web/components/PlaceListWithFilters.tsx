"use client";

import { Place } from "@/lib/types";
import { FilterSidebar } from "@/components/FilterSidebar";
import { FilterDrawer } from "@/components/FilterDrawer";
import { MobileQuickFilters } from "@/components/MobileQuickFilters";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import React, { useState, Suspense, useMemo } from "react";
import dynamic from "next/dynamic";
import { SortSelect, OpenNowToggle } from "@/components/FilterUtilities";
import { Icons } from "@/components/Icons";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/useInView";
import { useOpenNow, usePlaces } from "@/contexts/FilterContext";
import { isPlaceOpenNow, getCharlotteTimeNow } from "@/lib/operating-hours";

// Dynamically import DataTable for lazy loading with count callback
const DataTable = dynamic<{ rowData: Place[]; onFilteredCountChange?: (count: number) => void }>(() => import("@/components/DataTable").then(mod => mod.DataTable), {
    ssr: false,
    loading: () => <div className="mt-16 flex items-center justify-center"><LoadingSpinner /></div>,
});

export function PlaceListWithFilters() {
    const { places } = usePlaces();
    // Use external hook with primitive parameters for stable dependencies
    // DataTable uses threshold 0 (any pixel visible) because it's a tall virtualized list
    // QuickFilters uses threshold 0.3 (30% visible) for more precise visibility detection
    const [dataTableRef, isDataTableInView] = useInView<HTMLElement>(0);
    const [quickFiltersRef, isQuickFiltersInView] = useInView<HTMLDivElement>(0.3);
    const [comingSoonOpen, setComingSoonOpen] = useState(false);
    const { openNow, setOpenNow, openNowCount } = useOpenNow();

    // Pre-compute open-now places using a single timezone snapshot (2 Intl calls, not 2×N)
    const openNowPlaces = useMemo(() => {
        const time = getCharlotteTimeNow();
        return places.filter(p => isPlaceOpenNow(p.operatingHours ?? [], time));
    }, [places]);

    // When Open Now is active, DataTable receives only open places
    const displayPlaces = openNow ? openNowPlaces : places;

    // "Coming Soon" = places with operational status "Coming Soon" in Airtable.
    // This is a BUSINESS lifecycle concept (not yet open to the public), completely separate
    // from the hours-based "Open Now" filter or the "Opens Soon" hours status.
    // Derives from ALL places, not displayPlaces, so it's always visible regardless of Open Now toggle.
    const comingSoonPlaces = useMemo(() => places.filter(p => p.operational === 'Coming Soon'), [places]);
    const [visibleCount, setVisibleCount] = useState<number>(places.length);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_260px]">
            <div className="col-span-1 space-y-4 mb-4 sm:mb-0 sm:pr-12">
                {/* Intro Text */}
                <div id="browse-section" data-testid="browse-section" className="text-2xl font-bold">Browse</div>
                <p className="text-pretty">
                    {/* Always visible portion */}
                    Browse the complete list of places.{" "}

                    {/* Mobile-only text */}
                    <span className="inline sm:hidden">
                        Use the menu below or the <span className="font-bold text-primary">filter button</span> in the lower-right corner for more options.
                    </span>

                    {/* Desktop-only text */}
                    <span className="hidden sm:inline">
                        Use the <span className="font-bold text-primary">sidebar on the right</span> to filter.
                    </span>
                </p>

                <div className="sm:hidden" ref={quickFiltersRef}>
                    <MobileQuickFilters
                        comingSoonPlaces={comingSoonPlaces}
                        comingSoonOpen={comingSoonOpen}
                        setComingSoonOpen={setComingSoonOpen}
                        visibleCount={visibleCount}
                    />
                </div>

                {/* Desktop Unified Results Toolbar */}
                <div className="hidden sm:flex flex-wrap items-center gap-6 border-b border-border/60 pb-4 mt-2">
                    {/* Sort */}
                    <div className="flex items-center gap-3">
                        <span className="text-base font-semibold tracking-tight">Sort</span>
                        <div className="text-sm"><SortSelect /></div>
                    </div>
                    {/* Open Now Toggle */}
                    <Button
                        variant="ghost"
                        onClick={() => setOpenNow(!openNow)}
                        aria-pressed={openNow}
                        className={openNow
                            ? "rounded-md border border-emerald-300 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-sm h-8 px-3 font-bold gap-1"
                            : "rounded-md border border-border/60 bg-card hover:bg-muted text-muted-foreground text-sm h-8 px-3 font-bold gap-1"
                        }
                    >
                        <Icons.clock className="h-4 w-4 text-emerald-500" />
                        Open Now ({openNowCount})
                    </Button>
                    {/* Coming Soon Pill — neutral idle state matching Open Now's off-state */}
                    {comingSoonPlaces.length > 0 && (
                        <Button
                            variant="ghost"
                            onClick={() => setComingSoonOpen(true)}
                            aria-haspopup="dialog"
                            aria-expanded={comingSoonOpen}
                            className="rounded-md border border-border/60 bg-card hover:bg-muted text-muted-foreground text-sm h-8 px-3 font-bold gap-1"
                        >
                            <Icons.clock className="h-4 w-4 text-primary" />
                            Coming Soon ({comingSoonPlaces.length})
                        </Button>
                    )}
                    <div className="grow" />
                    <div className="flex items-center gap-3">
                        <span className="text-base font-semibold tracking-tight tabular-nums">{visibleCount} {visibleCount === 1 ? 'place' : 'places'}</span>
                    </div>
                </div>

                {comingSoonPlaces.length > 0 && (
                    <ComingSoonModal
                        open={comingSoonOpen}
                        onOpenChange={setComingSoonOpen}
                        places={comingSoonPlaces}
                    />
                )}

                {/* DataTable Section */}
                <section ref={dataTableRef}>
                    <Suspense fallback={<div className="mt-16 flex items-center justify-center"><LoadingSpinner /></div>}>
                        {/* DataTable receives the already mobile-filtered array (displayedPlaces).
                            This keeps DataTable focused on presentation + generic filtering/sorting logic only. */}
                        <DataTable rowData={displayPlaces} onFilteredCountChange={setVisibleCount} />
                    </Suspense>
                </section>

                {/* Mobile only */}
                <div className="sm:hidden">
                    <FilterDrawer
                        showSort={true}
                        showButton={isQuickFiltersInView || isDataTableInView}
                    />
                </div>
            </div>

            {/* Second Column: Desktop Filter Sidebar */}
            <div className="hidden sm:block">
                <FilterSidebar
                    className="max-w-[260px] border border-border sticky top-16 px-6 space-y-[.65rem]"
                />
            </div>
        </div>
    );
}
