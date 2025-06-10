"use client";

import React, { useContext } from "react";
import { FilterContext } from "@/contexts/FilterContext";
import { FilterQuickSearch, FilterSelect, FilterResetButton } from "@/components/FilterUtilities";

export function MobileQuickFilters() {
    const { filters } = useContext(FilterContext);

    return (
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
            
            {/* Reset button */}
            <FilterResetButton />
        </div>
    );
}
