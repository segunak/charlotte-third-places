"use client";

import React, { useState } from "react";
import { useFilters } from "@/contexts/FilterContext";
import { FilterQuickSearch, FilterSelect, FilterResetButton, OpenNowToggle } from "@/components/FilterUtilities";
import { FilterDrawer } from "@/components/FilterDrawer";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/Icons";
import { Place } from "@/lib/types";

interface MobileQuickFiltersProps {
    comingSoonPlaces: Place[];
    comingSoonOpen: boolean;
    setComingSoonOpen: (open: boolean) => void;
    visibleCount: number;
}

export const MobileQuickFilters = React.memo(function MobileQuickFilters({
    comingSoonPlaces,
    comingSoonOpen,
    setComingSoonOpen,
    visibleCount,
}: MobileQuickFiltersProps) {
    const { filters } = useFilters();
    const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);

    return (
        <>
            <div className="bg-card rounded-lg border overflow-hidden">
                <div className="space-y-3 p-4">
                    {/* Heading with live place count */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Quick Filters</h3>
                        <span className="text-sm text-muted-foreground tabular-nums">
                            {visibleCount} {visibleCount === 1 ? 'place' : 'places'}
                        </span>
                    </div>

                    {/* Search bar */}
                    <FilterQuickSearch />

                    {/* Key filters */}
                    <div className="space-y-3">
                        <FilterSelect
                            field="neighborhood"
                            value={filters.neighborhood.value}
                            label={filters.neighborhood.label}
                            placeholder={filters.neighborhood.placeholder}
                            predefinedOrder={filters.neighborhood.predefinedOrder}
                        />
                        <FilterSelect
                            field="type"
                            value={filters.type.value}
                            label={filters.type.label}
                            placeholder={filters.type.placeholder}
                            predefinedOrder={filters.type.predefinedOrder}
                        />
                        <FilterSelect
                            field="size"
                            value={filters.size.value}
                            label={filters.size.label}
                            placeholder={filters.size.placeholder}
                            predefinedOrder={filters.size.predefinedOrder}
                        />
                        <FilterSelect
                            field="tags"
                            value={filters.tags.value}
                            label={filters.tags.label}
                            placeholder={filters.tags.placeholder}
                            predefinedOrder={filters.tags.predefinedOrder}
                            matchMode={filters.tags.matchMode}
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <FilterResetButton variant="outline" />
                        </div>
                        <Button
                            className="flex-1"
                            onClick={() => setIsMoreOptionsOpen(true)}
                        >
                            All Filters
                        </Button>
                    </div>
                </div>

                {/* Footer zone — Open Now + Coming Soon */}
                <div className="border-t bg-muted/30 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <OpenNowToggle />
                        </div>
                        {comingSoonPlaces.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setComingSoonOpen(true)}
                                aria-haspopup="dialog"
                                aria-expanded={comingSoonOpen}
                                aria-label={`View ${comingSoonPlaces.length} places coming soon`}
                                className="flex-1 h-11 flex items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-bold text-muted-foreground transition hover:bg-card focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50"
                            >
                                <Icons.clock className="h-4 w-4 shrink-0 text-primary" />
                                Coming Soon ({comingSoonPlaces.length})
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* FilterDrawer component for more filters */}
            <FilterDrawer
                showSort={true}
                showButton={false}
                className="hidden"
                style={{}}
                open={isMoreOptionsOpen}
                onOpenChange={setIsMoreOptionsOpen}
            />
        </>
    );
});

MobileQuickFilters.displayName = "MobileQuickFilters";
