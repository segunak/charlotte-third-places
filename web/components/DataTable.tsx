"use client";

import React from "react";
import { PlaceCard } from "@/components/PlaceCard";
import { FilteredEmptyState } from "@/components/FilteredEmptyState";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { normalizeTextForSearch } from '@/lib/utils';
import { Place } from "@/lib/types";
import { placeMatchesFilters, sortPlaces } from "@/lib/filters";
import { useWindowWidth } from '@/hooks/useWindowWidth';
import { useFilters, useQuickSearch, useSort } from "@/contexts/FilterContext";
import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { useVirtualizer, VirtualItem } from "@tanstack/react-virtual";

// Virtualization row height: card height + gap between rows
const ROW_HEIGHT = 219;

/**
 * Memoized row component for virtualized grid.
 * Compares by first place recordId to skip re-render when row content is unchanged.
 * This is critical for performance - prevents React from re-rendering all cards
 * when only the row position changes.
 */
interface VirtualizedRowProps {
    virtualRow: VirtualItem;
    group: Place[];
}

const VirtualizedRow = React.memo(function VirtualizedRow({ virtualRow, group }: VirtualizedRowProps) {
    return (
        <div
            data-index={virtualRow.index}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
            }}
        >
            <div className="flex flex-wrap -mx-2">
                {group.map((place: Place, idx: number) => (
                    <div
                        key={place.recordId || idx}
                        className="w-full lg:w-1/2 3xl:w-1/3 4xl:w-1/4 5xl:w-1/5 px-2 mb-4"
                    >
                        <PlaceCard place={place} />
                    </div>
                ))}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparator: skip re-render if same places in same positions
    const prevGroup = prevProps.group;
    const nextGroup = nextProps.group;
    
    if (prevGroup.length !== nextGroup.length) return false;
    if (prevGroup.length === 0) return true;
    
    // Compare all recordIds to catch any reordering or middle-item changes
    // This is safe because groups are small (typically 2-5 items per row)
    for (let i = 0; i < prevGroup.length; i++) {
        if (prevGroup[i]?.recordId !== nextGroup[i]?.recordId) return false;
    }
    return true;
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

    // Track sorting state for UI overlay (opacity dim during sort)
    const [isSorting, setIsSorting] = useState(false);
    const prevSortOption = useRef(sortOption);

    useEffect(() => {
        const timeout = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timeout);
    }, []);

    const applyFilters = useCallback(
        (data: any[]) => data.filter((place: any) => placeMatchesFilters(place, filters as any)),
        [filters]
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

    // Step 1: Filter and sort data synchronously, preserving object references
    // Critical: sortPlaces returns the original Place objects, not copies.
    // This allows React.memo's identity check to skip re-renders for unchanged places.
    const filteredAndSortedData = useMemo(() => {
        let data = rowData as Place[];
        if (quickFilterText.trim() !== "") {
            const lowerCaseFilter = normalizeTextForSearch(quickFilterText);
            data = data.filter((place) =>
                normalizeTextForSearch(place.name || '').includes(lowerCaseFilter)
            );
        }
        const filtered = applyFilters(data) as Place[];
        return sortPlaces(filtered, sortOption);
    }, [rowData, quickFilterText, applyFilters, sortOption]);

    // Show sorting overlay when sort option changes
    useEffect(() => {
        if (prevSortOption.current !== sortOption) {
            setIsSorting(true);
            prevSortOption.current = sortOption;
            // Clear overlay after a brief delay to show visual feedback
            const timeout = setTimeout(() => setIsSorting(false), 100);
            return () => clearTimeout(timeout);
        }
    }, [sortOption]);

    // Step 2: Use sorted data directly
    const displayData = filteredAndSortedData;
    const filteredCount = displayData.length;

    // Step 3: Group data for virtualization
    const filteredAndGroupedRowData = useMemo(() => {
        const grouped = [];
        for (let i = 0; i < displayData.length; i += columnsPerRow) {
            const group = displayData.slice(i, i + columnsPerRow);
            grouped.push({ group });
        }
        return grouped;
    }, [displayData, columnsPerRow]);

    // Notify parent about filtered count in a separate effect (not inside useMemo)
    // This follows React rules - side effects belong in useEffect, not useMemo
    useEffect(() => {
        if (!isLoading) {
            onFilteredCountChange?.(filteredCount);
        }
    }, [filteredCount, isLoading, onFilteredCountChange]);

    // NOTE: We intentionally access filteredAndGroupedRowData directly in the virtualizer
    // render loop below, rather than through a ref. Using a ref with useEffect caused a
    // race condition where stale/unfiltered data was displayed for one frame because
    // useEffect runs after paint. The useMemo result is already stable during render,
    // so direct access is both correct and simpler.

    // Scroll container ref for TanStack Virtual
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // TanStack Virtual virtualizer
    const virtualizer = useVirtualizer({
        count: filteredAndGroupedRowData.length,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 3,
    });

    return (
        <div className="relative flex-1 w-full overflow-visible">
            {/* Initial loading state */}
            {isLoading && (
                <div className="mt-16 absolute inset-0 flex items-center justify-center bg-background z-10">
                    <LoadingSpinner />
                </div>
            )}
            {/* Sorting overlay - shows previous results with opacity while worker sorts */}
            {!isLoading && isSorting && (
                <div className="absolute inset-0 bg-background/50 z-10 pointer-events-none" />
            )}
            {!isLoading && filteredAndGroupedRowData.length === 0 && (
                <FilteredEmptyState />
            )}
            <div
                className={`w-full ${isLoading ? "opacity-0" : ""} ${(!isLoading && filteredAndGroupedRowData.length === 0) ? "hidden" : ""}`}
                style={{ overflow: "visible" }}
            >
                {filteredAndGroupedRowData.length > 0 && (
                    <div
                        ref={scrollContainerRef}
                        style={{
                            height: filteredAndGroupedRowData.length * ROW_HEIGHT,
                            width: "100%",
                            overflow: "visible",
                        }}
                    >
                        <div
                            style={{
                                height: virtualizer.getTotalSize(),
                                width: "100%",
                                position: "relative",
                                overflow: "visible",
                            }}
                        >
                            {virtualizer.getVirtualItems().map((virtualRow) => {
                                // Bounds check: virtualizer may have stale items during transition
                                const rowData = filteredAndGroupedRowData[virtualRow.index];
                                if (!rowData) return null;
                                const { group } = rowData;
                                return (
                                    <VirtualizedRow
                                        key={virtualRow.key}
                                        virtualRow={virtualRow}
                                        group={group}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
