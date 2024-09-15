"use client";

import { useContext } from "react";
import { FilterContext } from "@/contexts/FilterContext";
import { FilterQuickSearch, FilterSelect, FilterResetButton } from "@/components/FilterUtilities";

export function FilterSidebar() {
    const { filters } = useContext(FilterContext);

    return (
        <div className="p-4 space-y-4 bg-background border-l border-border h-screen sticky top-12">
            <h2 className="font-bold text-lg mt-4">Filters</h2>
            <FilterQuickSearch />
            {Object.entries(filters).map(([field, config]) => (
                <FilterSelect key={field} field={field as keyof typeof filters} config={config} />
            ))}
            <FilterResetButton />
        </div>
    );
}
