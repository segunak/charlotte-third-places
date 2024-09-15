"use client";

import { createContext, useState, useMemo, ReactNode, useCallback } from "react";

interface FilterOption {
    value: string;
    placeholder: string;
    label: string;
    predefinedOrder: string[];
}

export interface FilterConfig {
    name: FilterOption;
    type: FilterOption;
    size: FilterOption;
    neighborhood: FilterOption;
    purchaseRequired: FilterOption;
    parkingSituation: FilterOption;
    freeWifi: FilterOption;
    hasCinnamonRolls: FilterOption;
}

interface FilterContextType {
    filters: FilterConfig;
    setFilters: React.Dispatch<React.SetStateAction<FilterConfig>>;
    quickFilterText: string;
    setQuickFilterText: React.Dispatch<React.SetStateAction<string>>;
    getDistinctValues: (field: keyof FilterConfig) => string[];
}

export const FilterContext = createContext<FilterContextType>({
    filters: {
        name: { value: "all", placeholder: "Name", label: "Name", predefinedOrder: [] },
        type: { value: "all", placeholder: "Type", label: "Type", predefinedOrder: [] },
        size: { value: "all", placeholder: "Size", label: "Size", predefinedOrder: ["Small", "Medium", "Large"] },
        neighborhood: { value: "all", placeholder: "Neighborhood", label: "Neighborhood", predefinedOrder: [] },
        purchaseRequired: { value: "all", placeholder: "Purchase Required", label: "Purchase Required", predefinedOrder: ["Yes", "No"] },
        parkingSituation: { value: "all", placeholder: "Parking Situation", label: "Parking Situation", predefinedOrder: [] },
        freeWifi: { value: "all", placeholder: "Free Wifi", label: "Free Wifi", predefinedOrder: ["Yes", "No"] },
        hasCinnamonRolls: { value: "all", placeholder: "Has Cinnamon Rolls", label: "Has Cinnamon Rolls", predefinedOrder: ["Yes", "No", "Sometimes"] }
    },
    setFilters: () => { },
    quickFilterText: "",
    setQuickFilterText: () => { },
    getDistinctValues: () => []
});

// Define the FilterProvider to manage filter state and context
export const FilterProvider = ({
    children,
    places,
}: {
    children: ReactNode;
    places: Array<any>; // Expecting a list of place objects
}) => {
    const [quickFilterText, setQuickFilterText] = useState<string>("");

    const filterConfig = useMemo(
        () => ({
            name: {
                value: "all",
                placeholder: "Name",
                label: "Name",
                predefinedOrder: [],
            },
            type: {
                value: "all",
                placeholder: "Type",
                label: "Type",
                predefinedOrder: [],
            },
            size: {
                value: "all",
                placeholder: "Size",
                label: "Size",
                predefinedOrder: ["Small", "Medium", "Large"],
            },
            neighborhood: {
                value: "all",
                placeholder: "Neighborhood",
                label: "Neighborhood",
                predefinedOrder: [],
            },
            purchaseRequired: {
                value: "all",
                placeholder: "Purchase Required",
                label: "Purchase Required",
                predefinedOrder: ["Yes", "No"],
            },
            parkingSituation: {
                value: "all",
                placeholder: "Parking Situation",
                label: "Parking Situation",
                predefinedOrder: [],
            },
            freeWifi: {
                value: "all",
                placeholder: "Free Wifi",
                label: "Free Wifi",
                predefinedOrder: ["Yes", "No"],
            },
            hasCinnamonRolls: {
                value: "all",
                placeholder: "Has Cinnamon Rolls",
                label: "Has Cinnamon Rolls",
                predefinedOrder: ["Yes", "No", "Sometimes"],
            },
        }),
        []
    );

    const [filters, setFilters] = useState<FilterConfig>(filterConfig);

    // Function to get distinct values for dropdowns
    const getDistinctValues = useCallback(
        (field: keyof FilterConfig) => {
            const values = places
                .map((place: any) => place[field]) // Extract field from each place
                .flat() // Handle arrays like 'type'
                .filter(Boolean); // Remove falsy values

            const distinctValues = Array.from(new Set(values)); // Remove duplicates

            // Sort based on predefined order if available, otherwise alphabetically
            return distinctValues.sort((a, b) => {
                const predefinedOrder = filters[field].predefinedOrder;
                const indexA = predefinedOrder.indexOf(a);
                const indexB = predefinedOrder.indexOf(b);
                if (predefinedOrder.length === 0) return a.localeCompare(b);
                if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
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
                getDistinctValues
            }}
        >
            {children}
        </FilterContext.Provider>
    );
};
