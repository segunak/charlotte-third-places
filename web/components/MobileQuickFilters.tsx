"use client";

import { FilterDrawer } from "@/components/FilterDrawer";
import { FilterFullWidthSegments } from "@/components/FilterFullWidthSegments";
import { FilterOptionRail } from "@/components/FilterOptionRail";
import { FilterStatusRow } from "@/components/FilterStatusRow";
import { FilterQuickSearch, FilterResetButton, OpenNowToggle } from "@/components/FilterUtilities";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { useFilters } from "@/contexts/FilterContext";
import { FEATURED_FILTER_VALUES } from "@/lib/filters";
import { Place } from "@/lib/types";
import React, { useState } from "react";

interface MobileQuickFiltersProps {
    comingSoonPlaces: Place[];
    comingSoonOpen: boolean;
    setComingSoonOpen: (open: boolean) => void;
}

export const MobileQuickFilters = React.memo(function MobileQuickFilters({
    comingSoonPlaces,
    comingSoonOpen,
    setComingSoonOpen,
}: MobileQuickFiltersProps) {
    const { filters } = useFilters();
    const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);

    return (
        <>
            <div className="bg-card rounded-lg border overflow-hidden">
                <div className="space-y-3 p-4">
                    <FilterStatusRow className="-mt-4" />

                    {/* Search bar */}
                    <FilterQuickSearch
                        className="h-10 rounded-xl bg-background text-sm shadow-xs"
                        placeholder="Search Places"
                    />

                    {/* Key filters */}
                    <div className="space-y-3">
                        <FilterOptionRail
                            field="neighborhood"
                            label={filters.neighborhood.label}
                            featuredValues={FEATURED_FILTER_VALUES.neighborhood}
                            layout="fieldset"
                            pickerMaxHeight="86dvh"
                        />
                        <FilterOptionRail
                            field="type"
                            label={filters.type.label}
                            featuredValues={FEATURED_FILTER_VALUES.type}
                            layout="fieldset"
                            pickerMaxHeight="86dvh"
                        />
                        <FilterOptionRail
                            field="tags"
                            label={filters.tags.label}
                            featuredValues={FEATURED_FILTER_VALUES.tags}
                            layout="fieldset"
                            pickerMaxHeight="86dvh"
                        />
                        <FilterFullWidthSegments
                            field="purchaseRequired"
                            value={filters.purchaseRequired.value as string}
                            label={filters.purchaseRequired.label}
                            options={[
                                { label: "Yes", value: "Yes" },
                                { label: "No", value: "No" },
                            ]}
                            layout="fieldset"
                        />
                        <div className="border-t border-border/60 pt-4">
                            <OpenNowToggle />
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="border-t border-border/60 pt-4">
                        <div className="grid grid-cols-2 gap-2">
                            <FilterResetButton variant="outline" className="h-11 rounded-full gap-2" showIcon />
                            <Button
                                className="h-11 rounded-full gap-2"
                                onClick={() => setIsMoreOptionsOpen(true)}
                            >
                                <Icons.filter className="h-3.5 w-3.5" />
                                More Filters
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Related destination */}
                {comingSoonPlaces.length > 0 && (
                    <div className="border-t bg-muted/30 px-4 py-3">
                        <button
                            type="button"
                            onClick={() => setComingSoonOpen(true)}
                            aria-haspopup="dialog"
                            aria-expanded={comingSoonOpen}
                            aria-label={`View ${comingSoonPlaces.length} places coming soon`}
                            className="grid h-11 w-full grid-cols-[minmax(0,1fr)_auto_0.75rem] items-center gap-3 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-muted focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50"
                        >
                            <span className="flex min-w-0 items-center gap-2">
                                <Icons.clock className="h-4 w-4 shrink-0 text-primary" />
                                Coming Soon
                            </span>
                            <span className="justify-self-end tabular-nums">
                                {comingSoonPlaces.length} {comingSoonPlaces.length === 1 ? "Place" : "Places"}
                            </span>
                            <Icons.chevronRightBold className="h-3 w-3 text-primary" aria-hidden="true" />
                        </button>
                    </div>
                )}
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
