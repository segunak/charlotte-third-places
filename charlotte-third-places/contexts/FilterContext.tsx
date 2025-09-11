"use client";

import { createContext, useState, useCallback, ReactNode } from "react";
import { DEFAULT_SORT_OPTION, SortOption } from "@/lib/types";
import { DEFAULT_FILTER_CONFIG, FILTER_DEFS, FilterConfig, FilterKey } from "@/lib/filters";

interface FilterContextType {
    filters: FilterConfig;
    setFilters: React.Dispatch<React.SetStateAction<FilterConfig>>;
    quickFilterText: string;
    setQuickFilterText: React.Dispatch<React.SetStateAction<string>>;
    getDistinctValues: (field: FilterKey) => string[];
    sortOption: SortOption;
    setSortOption: React.Dispatch<React.SetStateAction<SortOption>>;
}

export const FilterContext = createContext<FilterContextType>({
    filters: DEFAULT_FILTER_CONFIG,
    setFilters: () => { },
    quickFilterText: "",
    setQuickFilterText: () => { },
    getDistinctValues: () => [],
    sortOption: DEFAULT_SORT_OPTION,
    setSortOption: () => { },
});

export const FilterProvider = ({
    children,
    places,
}: {
    children: ReactNode;
    places: Array<any>;
}) => {
    // Basic states
    const [quickFilterText, setQuickFilterText] = useState<string>("");
    const [filters, setFilters] = useState<FilterConfig>(DEFAULT_FILTER_CONFIG);
    const [sortOption, setSortOption] = useState<SortOption>(DEFAULT_SORT_OPTION);

    // A function that returns distinct values for each filter field,
    // respecting `predefinedOrder` if present, otherwise sorting alphabetically.
    const getDistinctValues = useCallback(
        (field: FilterKey) => {
            // Produces the list of candidate values a user can select (excluding the 'all' sentinel which is UI-only).
            const def = FILTER_DEFS.find(d => d.key === field)!;
            const rawValues: string[] = places
                .map((p: any) => def.accessor(p))
                .flat()
                .filter((v: any) => typeof v === 'string' && v.length > 0);

            const distinctValues = Array.from(new Set(rawValues));
            const predefinedOrder = filters[field].predefinedOrder;

            return distinctValues.sort((a, b) => {
                if (predefinedOrder.length === 0) return a.localeCompare(b);
                const ia = predefinedOrder.indexOf(a);
                const ib = predefinedOrder.indexOf(b);
                if (ia === -1 && ib === -1) return a.localeCompare(b);
                if (ia === -1) return 1;
                if (ib === -1) return -1;
                return ia - ib;
            });
        },
        [places, filters]
    );

    return (
        <FilterContext.Provider
            value={{
                filters,
                setFilters,
                quickFilterText,
                setQuickFilterText,
                getDistinctValues,
                sortOption,
                setSortOption,
            }}
        >
            {children}
        </FilterContext.Provider>
    );
};
