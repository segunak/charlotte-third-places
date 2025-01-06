"use client";

import { createContext, useState, useCallback, ReactNode } from "react";
import {
    DEFAULT_SORT_OPTION,
    DEFAULT_FILTER_CONFIG,
    FilterConfig,
    SortOption
} from "@/lib/types";

interface FilterContextType {
    filters: FilterConfig;
    setFilters: React.Dispatch<React.SetStateAction<FilterConfig>>;
    quickFilterText: string;
    setQuickFilterText: React.Dispatch<React.SetStateAction<string>>;
    getDistinctValues: (field: keyof FilterConfig) => string[];
    sortOption: SortOption;
    setSortOption: React.Dispatch<React.SetStateAction<SortOption>>;
    dropdownOpen: boolean;
    setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handleDropdownStateChange: (isOpen: boolean) => void;
}

export const FilterContext = createContext<FilterContextType>({
    filters: DEFAULT_FILTER_CONFIG,
    setFilters: () => { },
    quickFilterText: "",
    setQuickFilterText: () => { },
    getDistinctValues: () => [],
    sortOption: DEFAULT_SORT_OPTION,
    setSortOption: () => { },
    dropdownOpen: false,
    setDropdownOpen: () => { },
    handleDropdownStateChange: () => { },
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
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [filters, setFilters] = useState<FilterConfig>(DEFAULT_FILTER_CONFIG);
    const [sortOption, setSortOption] = useState<SortOption>(DEFAULT_SORT_OPTION);

    // A small delay when closing a dropdown
    const handleDropdownStateChange = useCallback((isOpen: boolean) => {
        if (!isOpen) {
            setTimeout(() => {
                setDropdownOpen(isOpen);
            }, 100);
        } else {
            setDropdownOpen(isOpen);
        }
    }, []);

    // A function that returns distinct values for each filter field,
    // respecting `predefinedOrder` if present, otherwise sorting alphabetically.
    const getDistinctValues = useCallback(
        (field: keyof FilterConfig) => {
            const values = places
                .map((place: any) => place[field])
                .flat()        // If "type" is an array
                .filter(Boolean);

            const distinctValues = Array.from(new Set(values)); // remove duplicates

            return distinctValues.sort((a, b) => {
                const predefinedOrder = filters[field].predefinedOrder;
                const indexA = predefinedOrder.indexOf(a);
                const indexB = predefinedOrder.indexOf(b);

                // No predefined array or neither item found => alphabetical
                if (predefinedOrder.length === 0) {
                    return a.localeCompare(b);
                }
                if (indexA === -1 && indexB === -1) {
                    return a.localeCompare(b);
                }

                // If one item found in array, the other not => found item first
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;

                // If both found => compare indices
                return indexA - indexB;
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
                dropdownOpen,
                setDropdownOpen,
                handleDropdownStateChange,
            }}
        >
            {children}
        </FilterContext.Provider>
    );
};
