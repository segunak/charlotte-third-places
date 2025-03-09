"use client";

import "@/styles/ag-grid-theme-builder.css"; // See https://www.ag-grid.com/react-data-grid/applying-theme-builder-styling-grid/
import { PlaceCard } from "@/components/PlaceCard";
import { normalizeTextForSearch } from '@/lib/utils';
import { AgGridReact } from '@ag-grid-community/react';
import { SortField, SortDirection } from "@/lib/types";
import { useWindowWidth } from '@/hooks/useWindowWidth';
import { FilterContext } from "@/contexts/FilterContext";
import { useContext, useCallback, useRef, useState, useMemo, useEffect } from "react";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry, ColDef, SizeColumnsToContentStrategy } from '@ag-grid-community/core';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface DataTableProps {
    rowData: Array<object>;
}

const autoSizeStrategy: SizeColumnsToContentStrategy = {
    type: 'fitCellContents',
};

export function DataTable({ rowData }: DataTableProps) {
    const gridRef = useRef<AgGridReact>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { filters, quickFilterText, sortOption } = useContext(FilterContext);

    const isFullWidthRow = useCallback((params: any) => {
        return true;
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timeout);
    }, []);

    const columnDefs = useMemo(() => {
        const gridColumns: ColDef[] = [
            {
                headerName: "",
                field: "dummy",
                flex: 1,
                resizable: false,
                cellRenderer: "agFullWidthCellRenderer"
            }
        ];

        return gridColumns;
    }, []);

    const applyFilters = useCallback(
        (data: any[]) => {
            return data.filter((place: any) => {
                const {
                    name,
                    type,
                    size,
                    neighborhood,
                    purchaseRequired,
                    parking,
                    freeWifi,
                    hasCinnamonRolls,
                } = filters;

                const isTypeMatch =
                    type.value === "all" || (place.type && place.type.includes(type.value));

                return (
                    isTypeMatch &&
                    (name.value === "all" || place.name === name.value) &&
                    (size.value === "all" || place.size === size.value) &&
                    (neighborhood.value === "all" || place.neighborhood === neighborhood.value) &&
                    (purchaseRequired.value === "all" || place.purchaseRequired === purchaseRequired.value) &&
                    (parking.value === "all" || place.parking === parking.value) &&
                    (freeWifi.value === "all" || place.freeWifi === freeWifi.value) &&
                    (hasCinnamonRolls.value === "all" || place.hasCinnamonRolls === hasCinnamonRolls.value)
                );
            });
        },
        [filters]
    );

    const applySorting = useCallback(
        (data: any[]) => {
            return [...data].sort((a: any, b: any) => {
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

    const filteredAndGroupedRowData = useMemo(() => {
        let filteredData = rowData;

        if (quickFilterText.trim() !== "") {
            const lowerCaseFilter = quickFilterText.toLowerCase();
            filteredData = filteredData.filter((place: any) =>
                normalizeTextForSearch(JSON.stringify(place)).includes(lowerCaseFilter)
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
        return grouped;
    }, [rowData, quickFilterText, applyFilters, applySorting, columnsPerRow]);

    const getRowHeight = useCallback(() => {
        const cardHeight = 215;
        return cardHeight;
    }, []);

    const fullWidthCellRenderer = useCallback(
        (params: any) => {
            const { group } = params.data;
            return (
                <div className="flex flex-wrap -mx-2">
                    {group.map((place: any, index: number) => (
                        // The breakpoints here are tied to the columnsPerRow calculation
                        <div key={index} className="w-full lg:w-1/2 3xl:w-1/3 4xl:w-1/4 5xl:w-1/5 px-2 mb-4">
                            <PlaceCard place={place} />
                        </div>
                    ))}
                </div>
            );
        }, []
    );

    return (
        <div className="relative flex-1">
            {isLoading && (
                <div className="mt-16 absolute inset-0 flex items-center justify-center bg-background z-10">
                    <div className="loader animate-spin ease-linear rounded-full border-4 border-t-4 border-primary h-12 w-12 border-t-transparent"></div>
                </div>
            )}
            <div className={`ag-theme-custom w-full ${isLoading ? "opacity-0" : ""}`}>
                <AgGridReact
                    ref={gridRef}
                    rowData={filteredAndGroupedRowData}
                    columnDefs={columnDefs}
                    autoSizeStrategy={autoSizeStrategy}
                    includeHiddenColumnsInQuickFilter={true}
                    suppressMovableColumns={true}
                    domLayout="autoHeight"
                    getRowHeight={getRowHeight}
                    isFullWidthRow={isFullWidthRow}
                    fullWidthCellRenderer={fullWidthCellRenderer}
                />
            </div>
        </div>
    );
}
