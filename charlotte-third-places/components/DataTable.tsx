"use client";

import { PlaceCard } from "@/components/PlaceCard";
import { FilteredEmptyState } from "@/components/FilteredEmptyState";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { normalizeTextForSearch } from '@/lib/utils';
import { SortField, SortDirection } from "@/lib/types";
import { placeMatchesFilters } from "@/lib/filters";
import { useWindowWidth } from '@/hooks/useWindowWidth';
import { useFilters, useQuickSearch, useSort } from "@/contexts/FilterContext";
import { useCallback, useState, useMemo, useEffect, memo } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

/**
 * Memoized Row component for react-window virtualization.
 * Extracted outside DataTable to prevent recreation on every render,
 * which would defeat react-window's optimization.
 */
interface RowData {
    groups: Array<{ group: any[] }>;
}

const VirtualizedRow = memo(function VirtualizedRow({ index, style, data }: ListChildComponentProps<RowData>) {
    const { group } = data.groups[index];
    return (
        <div style={style}>
            <div className="flex flex-wrap -mx-2">
                {group.map((place: any, idx: number) => (
                    <div key={place.recordId || idx} className="w-full lg:w-1/2 3xl:w-1/3 4xl:w-1/4 5xl:w-1/5 px-2 mb-4">
                        <PlaceCard place={place} />
                    </div>
                ))}
            </div>
        </div>
    );
});

interface DataTableProps {
    rowData: Array<object>;
    /**
     * Callback invoked with the count of rows remaining after quick text search, filter criteria,
     * and sorting have been applied. This allows parent components to reflect a live "visible items" count
     * without duplicating filtering logic here. The callback is only called after the initial loading
     * placeholder has resolved to avoid transient zero states.
     */
    onFilteredCountChange?: (count: number) => void;
}

export function DataTable({ rowData, onFilteredCountChange }: DataTableProps) {
    const [isLoading, setIsLoading] = useState(true);
    // Consume granular contexts for optimal render performance
    const { filters } = useFilters();
    const { quickFilterText } = useQuickSearch();
    const { sortOption } = useSort();

    useEffect(() => {
        const timeout = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timeout);
    }, []);

    const applyFilters = useCallback(
        (data: any[]) => data.filter((place: any) => placeMatchesFilters(place, filters as any)),
        [filters]
    );

    const applySorting = useCallback(
        (data: any[]) => {
            return [...data].sort((a: any, b: any) => {
                // First priority: Featured places come first
                if (a.featured !== b.featured) {
                    return b.featured ? 1 : -1; // featured places (true) come before non-featured (false)
                }

                // Apply user's selected sorting next
                const { field, direction } = sortOption;

                // Compare values based on the selected sort field (name, createdDate, lastModifiedDate)
                const valueA = a[field] || "";
                const valueB = b[field] || "";

                if (field === SortField.Name) {
                    return direction === SortDirection.Ascending
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);
                }

                // For date fields, compare as dates
                const dateA = new Date(valueA).getTime();
                const dateB = new Date(valueB).getTime();
                return direction === SortDirection.Ascending ? dateA - dateB : dateB - dateA;
            });
        },
        [sortOption]
    );

    const windowWidth = useWindowWidth();

    // Aligns with Tailwind breakpoints at https://tailwindcss.com/docs/responsive-design
    // See tailwind.config.ts for 3xl and higher custom breakpoints
    const columnsPerRow = useMemo(() => {
        if (windowWidth >= 3200) return 5;  // 5xl and higher -> 5 columns, 5 cards per row
        if (windowWidth >= 2560) return 4;  // 4xl and higher -> 4 columns, 4 cards per row
        if (windowWidth >= 1920) return 3;  // 3xl and higher -> 3 columns, 3 cards per row
        if (windowWidth >= 1024) return 2;  // lg and higher  -> 2 columns, 2 cards per row
        return 1; // Anything smaller than lg, 1 column, 1 card per row
    }, [windowWidth]);

    const { grouped: filteredAndGroupedRowData, filteredCount } = useMemo(() => {
        let filteredData = rowData;
        if (quickFilterText.trim() !== "") {
            const lowerCaseFilter = normalizeTextForSearch(quickFilterText);
            filteredData = filteredData.filter((place: any) =>
                normalizeTextForSearch(place.name || '').includes(lowerCaseFilter)
            );
        }

        filteredData = applyFilters(filteredData);
        // Apply sorting to the filtered data
        filteredData = applySorting(filteredData);

        const grouped = [];
        for (let i = 0; i < filteredData.length; i += columnsPerRow) {
            const group = filteredData.slice(i, i + columnsPerRow);
            grouped.push({ group });
        }
        return { grouped, filteredCount: filteredData.length };
    }, [rowData, quickFilterText, applyFilters, applySorting, columnsPerRow]);

    // Notify parent about filtered count in a separate effect (not inside useMemo)
    // This follows React rules - side effects belong in useEffect, not useMemo
    useEffect(() => {
        if (!isLoading) {
            onFilteredCountChange?.(filteredCount);
        }
    }, [filteredCount, isLoading, onFilteredCountChange]);

    // Virtualization sizes must include spacing because children margins don't affect
    // react-window's absolute positioning. Reserve a small, explicit gap per row.
    const getRowHeight = useCallback(() => {
        const CARD_HEIGHT = 215;
        const ROW_GAP = 4;
        return CARD_HEIGHT + ROW_GAP;
    }, []);

    // Memoized itemData for react-window to prevent unnecessary row re-renders
    const itemData = useMemo<RowData>(() => ({
        groups: filteredAndGroupedRowData,
    }), [filteredAndGroupedRowData]);

    return (
        <div className="relative flex-1 w-full overflow-visible">
            {isLoading && (
                <div className="mt-16 absolute inset-0 flex items-center justify-center bg-background z-10">
                    <LoadingSpinner />
                </div>
            )}
            {!isLoading && filteredAndGroupedRowData.length === 0 && (
                <FilteredEmptyState />
            )}
            <div className={`w-full ${isLoading ? "opacity-0" : ""} ${(!isLoading && filteredAndGroupedRowData.length === 0) ? "hidden" : ""}`} style={{ overflow: "visible" }}>
                {filteredAndGroupedRowData.length > 0 && (
                    <List
                        height={filteredAndGroupedRowData.length * getRowHeight()}
                        itemCount={filteredAndGroupedRowData.length}
                        itemSize={getRowHeight()}
                        itemData={itemData}
                        width={"100%"}
                        style={{ overflow: "visible" }}
                    >
                        {VirtualizedRow}
                    </List>
                )}
            </div>
        </div>
    );
}
