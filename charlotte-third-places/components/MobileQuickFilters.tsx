"use client";

import React, { useContext, useState } from "react";
import { FilterContext } from "@/contexts/FilterContext";
import { FilterQuickSearch, FilterSelect, FilterResetButton } from "@/components/FilterUtilities";
import { FilterDrawer } from "@/components/FilterDrawer";
import { Button } from "@/components/ui/button";
import { OpeningSoonTrigger } from "@/components/OpeningSoonTrigger";
import { Place } from "@/lib/types";

// Expects only the subset of Opening Soon places it needs to drive the trigger.
export function MobileQuickFilters({ openingSoonPlaces }: { openingSoonPlaces: Place[] }) {
    const { filters } = useContext(FilterContext);
    const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);

    return (
        <>
            <div className="space-y-3 p-4 bg-card rounded-lg border">

                {/* Single heading for the entire section */}
                <h3 className="text-sm font-semibold">Quick Filters</h3>

                {/* Search bar */}
                <FilterQuickSearch />

                {/* Three key filters */}
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
                </div>

                {/* Action buttons row */}
                <div className="flex gap-2">
                    <div className="flex-1">
                        <FilterResetButton variant="outline" />
                    </div>
                    <Button
                        className="flex-1"
                        onClick={() => setIsMoreOptionsOpen(true)}
                    >
                        More Filters
                    </Button>
                </div>
                {/* Opening Soon trigger (mobile only) */}
                {openingSoonPlaces.length > 0 && (
                    <div className="pt-2 border-t mt-2">
                        <OpeningSoonTrigger places={openingSoonPlaces} />
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
}
