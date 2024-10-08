"use client";

import { useContext } from "react";
import { FilterContext } from "@/contexts/FilterContext";
import { FilterQuickSearch, FilterSelect, FilterResetButton, SortSelect } from "@/components/FilterUtilities";

interface FilterSidebarProps {
    className?: string;
    showSort?: boolean;
}

export function FilterSidebar({ className = "", showSort = false }: FilterSidebarProps) {
    const { filters } = useContext(FilterContext);
    const activeFilterCount = Object.values(filters).filter((filter) => filter.value !== 'all').length;

    return (
        <div className={`${className} mt-4`}>
            {showSort && (
                <div className="space-y-[.65rem]">
                    <h2 className="font-bold text-lg">Sort</h2>
                    <SortSelect />
                </div>
            )}
            <h2 className="font-bold text-lg">
                Filter
                {activeFilterCount > 0 && (
                    <span className={`absolute ${showSort ? 'top-[6.3rem] right-[10.7rem]' : 'top-[.5rem] right-[11rem]'} flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full`}
                    >
                        {activeFilterCount}
                    </span>
                )}
            </h2>
            <FilterQuickSearch />
            {Object.entries(filters).map(([field, config]) => (
                <FilterSelect key={field} field={field as keyof typeof filters} config={config} />
            ))}
            <FilterResetButton />
        </div>
    );
}
