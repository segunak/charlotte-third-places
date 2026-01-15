"use client";

import React, { useState, useCallback } from "react";
import { useFilters } from "@/contexts/FilterContext";
import { FILTER_DEFS, FILTER_SENTINEL, FilterKey } from "@/lib/filters";
import { FilterQuickSearch, FilterSelect, FilterResetButton } from "@/components/FilterUtilities";

interface FilterSidebarProps {
    className?: string;
}

export const FilterSidebar = React.memo(function FilterSidebar({ className = "" }: FilterSidebarProps) {
    const { filters } = useFilters();
    // Active filter count excludes fields still at the 'all' sentinel (meaning no constraint)
    const activeFilterCount = Object.values(filters).filter((filter) => filter.value !== FILTER_SENTINEL).length;
    // Track open state for all selects
    const [anyDropdownOpen, setAnyDropdownOpen] = useState(false);

    // Handler to pass to selects
    const handleDropdownStateChange = useCallback((open: boolean) => {
        setAnyDropdownOpen(open);
    }, []);

    return (
        <div data-testid="filter-sidebar" className={`${className} shadow-2xl rounded-md p-4 relative`}>
            <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-lg">Filter</h2>
                {activeFilterCount > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {activeFilterCount}
                    </span>
                )}
            </div>
            <FilterQuickSearch />
            {FILTER_DEFS.map(def => {
                const config = filters[def.key as FilterKey];
                return (
                    <FilterSelect
                        key={def.key}
                        field={def.key as FilterKey}
                        value={config.value}
                        label={config.label}
                        placeholder={config.placeholder}
                        predefinedOrder={config.predefinedOrder}
                        onDropdownOpenChange={handleDropdownStateChange}
                    />
                );
            })}

            <FilterResetButton variant="default" disabled={anyDropdownOpen} />
        </div>
    );
});

FilterSidebar.displayName = "FilterSidebar";
