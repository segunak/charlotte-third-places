"use client";

import { useContext } from "react";
import { FilterContext } from "@/contexts/FilterContext";
import { FilterQuickSearch, FilterSelect, FilterResetButton } from "@/components/FilterUtilities";

interface FilterSidebarProps {
    className?: string; // Optional className prop to customize styles
}

export function FilterSidebar({ className = "" }: FilterSidebarProps) {
    const { filters } = useContext(FilterContext);
    const activeFilterCount = Object.values(filters).filter((filter) => filter.value !== 'all').length;

    return (
        <div className={`${className}`}>
            <h2 className="font-bold text-lg mt-4">
                Filters
                {activeFilterCount > 0 && (
                    <span className="absolute top-[1.5rem] right-[9.8rem] flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
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
