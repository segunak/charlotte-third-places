"use client";

import { useContext } from "react";
import { FilterContext } from "@/contexts/FilterContext";
import { FilterQuickSearch, FilterSelect, FilterResetButton } from "@/components/FilterUtilities";

interface FilterSidebarProps {
    className?: string; // Optional className prop to customize styles
}

export function FilterSidebar({ className = "" }: FilterSidebarProps) {
    const { filters } = useContext(FilterContext);

    return (
        <div className={`${className}`}>
            <h2 className="font-bold text-lg mt-4">Filters</h2>
            <FilterQuickSearch />
            {Object.entries(filters).map(([field, config]) => (
                <FilterSelect key={field} field={field as keyof typeof filters} config={config} />
            ))}
            <FilterResetButton />
        </div>
    );
}
