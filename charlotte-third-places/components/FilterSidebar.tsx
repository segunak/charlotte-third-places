"use client";

import React, { useState, useContext, useCallback } from "react";
import { FilterContext } from "@/contexts/FilterContext";
import { FILTER_DEFS, FILTER_SENTINEL, FilterKey } from "@/lib/filters";
import { FilterQuickSearch, FilterSelect, FilterResetButton, SortSelect } from "@/components/FilterUtilities";

interface FilterSidebarProps {
    className?: string;
    showSort?: boolean;
}

export function FilterSidebar({ className = "", showSort = false }: FilterSidebarProps) {
    const { filters } = useContext(FilterContext);
    // Active filter count excludes fields still at the 'all' sentinel (meaning no constraint)
    const activeFilterCount = Object.values(filters).filter((filter) => filter.value !== FILTER_SENTINEL).length;
    // Track open state for all selects
    const [anyDropdownOpen, setAnyDropdownOpen] = useState(false);

    // Handler to pass to selects
    const handleDropdownStateChange = useCallback((open: boolean) => {
        setAnyDropdownOpen(open);
    }, []);

    return (
        <div className={`${className} shadow-2xl rounded-md p-4`}>
            {showSort && (
                <div className="space-y-[.65rem] mb-6">
                    <h2 className="font-bold text-lg">Sort</h2>
                    <SortSelect onDropdownOpenChange={handleDropdownStateChange} />
                </div>
            )}
            <h2 className="font-bold text-lg">
                Filter
                {activeFilterCount > 0 && (
                    <span className={`absolute ${showSort ? 'top-[6.7rem] right-[10.7rem]' : 'top-[.5rem] right-[9.7rem]'} flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full`}>
                        {activeFilterCount}
                    </span>
                )}
            </h2>
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
}
