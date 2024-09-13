"use client";

import "@/styles/ag-grid-theme-builder.css"; // See https://www.ag-grid.com/react-data-grid/applying-theme-builder-styling-grid/
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceModal } from "@/components/PlaceModal";
import { AgGridReact } from '@ag-grid-community/react';
import { normalizeTextForSearch } from '@/lib/utils'
import { useCallback, useRef, useState, useMemo } from "react";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry, ColDef, SizeColumnsToContentStrategy, IRowNode } from '@ag-grid-community/core';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface DataTableProps {
    rowData: Array<object>; // Accepts an array of objects for the row data
}

const autoSizeStrategy: SizeColumnsToContentStrategy = {
    type: 'fitCellContents',
};

export function DataTable({ rowData }: DataTableProps) {
    const gridRef = useRef<AgGridReact>(null);
    const [quickFilterText, setQuickFilterText] = useState<string>('');
    const [selectedRow, setSelectedRow] = useState<any | null>(null);  // For selected card on click

    const filterConfig = useMemo(() => ({
        name: { value: "all", placeholder: "Name", label: "Name", predefinedOrder: [] },
        type: { value: "all", placeholder: "Type", label: "Type", predefinedOrder: [] },
        size: { value: "all", placeholder: "Size", label: "Size", predefinedOrder: ["Small", "Medium", "Large"] },
        neighborhood: { value: "all", placeholder: "Neighborhood", label: "Neighborhood", predefinedOrder: [] },
        purchaseRequired: { value: "all", placeholder: "Purchase Required", label: "Purchase Required", predefinedOrder: ["Yes", "No"] },
        parkingSituation: { value: "all", placeholder: "Parking Situation", label: "Parking Situation", predefinedOrder: [] },
        freeWifi: { value: "all", placeholder: "Free Wifi", label: "Free Wifi", predefinedOrder: ["Yes", "No"] },
        hasCinnamonRolls: { value: "all", placeholder: "Has Cinnamon Rolls", label: "Has Cinnamon Rolls", predefinedOrder: ["Yes", "No", "Sometimes"] }
    }), []);

    const [filters, setFilters] = useState(filterConfig);

    // Get distinct values for Select menu dropdowns
    const getDistinctValues = useCallback((field: string, predefinedOrder: string[] = []) => {
        const values = rowData
            .map((item: any) => item[field])
            .flat()  // Handle arrays like 'type'
            .filter(Boolean);  // Remove falsy values

        const distinctValues = Array.from(new Set(values));

        return distinctValues.sort((a, b) => {
            const indexA = predefinedOrder.indexOf(a);
            const indexB = predefinedOrder.indexOf(b);
            if (predefinedOrder.length === 0) {
                return a.localeCompare(b);
            }
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    }, [rowData]);

    const handleFilterChange = useCallback((field: keyof typeof filters, value: string) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [field]: { ...prevFilters[field], value }
        }));
        gridRef.current?.api.onFilterChanged(); // Trigger AG Grid filter
    }, []);


    const handleQuickFilterChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setQuickFilterText(event.target.value);
    }, []);


    const handleResetFilters = useCallback(() => {
        //setFilters(filterConfig);
        setFilters((prevFilters) => {
            const resetFilters = { ...prevFilters };
            Object.keys(resetFilters).forEach((key) => {
                resetFilters[key as keyof typeof prevFilters].value = "all";
            });
            return resetFilters;
        });
        setQuickFilterText("");
        gridRef.current?.api.setFilterModel(null);
        gridRef.current?.api.onFilterChanged();
    }, []);

    const handleRowClick = useCallback((event: any) => {
        setSelectedRow(event.data);
    }, []);

    // Custom filter logic for AG Grid
    const isExternalFilterPresent = useCallback(() => {
        return Object.values(filters).some(filter => filter.value !== "all");
    }, [filters]);

    const doesExternalFilterPass = useCallback((node: IRowNode) => {
        const { name, type, size, neighborhood, purchaseRequired, parkingSituation, freeWifi, hasCinnamonRolls } = filters;
        const isTypeMatch = type.value === "all" || (node.data.type && node.data.type.includes(type.value));

        return (
            isTypeMatch &&
            (name.value === "all" || node.data.name === name.value) &&
            (size.value === "all" || node.data.size === size.value) &&
            (neighborhood.value === "all" || node.data.neighborhood === neighborhood.value) &&
            (purchaseRequired.value === "all" || node.data.purchaseRequired === purchaseRequired.value) &&
            (parkingSituation.value === "all" || node.data.parkingSituation === parkingSituation.value) &&
            (freeWifi.value === "all" || node.data.freeWifi === freeWifi.value) &&
            (hasCinnamonRolls.value === "all" || node.data.hasCinnamonRolls === hasCinnamonRolls.value)
        );
    }, [filters]);

    const isFullWidthRow = useCallback((params: any) => {
        return true;
    }, []);

    const fullWidthCellRenderer = useCallback((params: any) => {
        return (
            <PlaceCard
                place={params.data}
                onClick={() => handleRowClick({ data: params.data })}
            />
        );
    }, [handleRowClick]);

    // Updated column definitions for hiding fields in the grid but allowing filtering
    const columnDefs = useMemo(() => {
        // Only show "Place" column but allow filtering based on hidden columns
        const gridColumns: ColDef[] = [
            {
                headerName: "Place",
                field: "name",
                cellRenderer: (params: any) => (
                    <PlaceCard
                        place={params.data}
                        onClick={() => handleRowClick({ data: params.data })}
                    />
                ),
                autoHeight: true,
                flex: 1,
                resizable: false,
                wrapText: true, // Ensure text doesn't overflow the card width
                getQuickFilterText: params => {
                    return normalizeTextForSearch(params.value);
                }
            },
            // Hidden columns, available for filtering but not visible in the grid. All columns
            // are accessible in PlaceModal.tsx after a user clicks a row because it's passed the full
            // data, as provided from Airtable in the calling app/page.tsx. The definitions here of hidden
            // columns has value in that they can be used to filter/search even though their values aren't seen
            // until a user clicks a place.
            {
                field: "type",
                hide: true,
                getQuickFilterText: params => {
                    return normalizeTextForSearch(params.value);
                }
            },
            {
                field: "size",
                hide: true,
                getQuickFilterText: params => {
                    return normalizeTextForSearch(params.value);
                }
            },
            {
                field: "ambience",
                hide: true,
                getQuickFilterText: params => {
                    return normalizeTextForSearch(params.value);
                }
            },
            {
                field: "address",
                hide: true,
                getQuickFilterText: params => {
                    return normalizeTextForSearch(params.value);
                }
            },
            {
                field: "neighborhood",
                hide: true,
                getQuickFilterText: params => {
                    return normalizeTextForSearch(params.value);
                }
            },
            { field: "purchaseRequired", hide: true },
            {
                field: "parkingSituation",
                hide: true,
                getQuickFilterText: params => {
                    return normalizeTextForSearch(params.value);
                }
            },
            { field: "freeWifi", hide: true }, // Used for filtering, but not in quick search as the value are just Yes/No.
            { field: "hasCinnamonRolls", hide: true }, // Used for filtering, but not in quick search as the value are just Yes/No.
            {
                field: "description",
                hide: true,
                getQuickFilterText: params => {
                    return normalizeTextForSearch(params.value);
                }
            },
            {
                field: "comments",
                hide: true,
                getQuickFilterText: params => {
                    return normalizeTextForSearch(params.value);
                }
            }
        ];

        return gridColumns;
    }, [handleRowClick]);

    return (
        <div className="overflow-y-auto">
            {/* Filters and Search */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-5 m-px">
                <Input
                    type="text"
                    placeholder="Search All Fields..."
                    onChange={handleQuickFilterChange}
                    value={quickFilterText}
                    className="w-full"
                />

                {/* Dynamically Render Filters */}
                {Object.entries(filters).map(([field, config]) => (
                    <Select
                        key={field}
                        value={config.value}
                        onValueChange={(value) => handleFilterChange(field as keyof typeof filters, value)}
                    >
                        <SelectTrigger className={config.value === "all" ? "w-full text-muted-foreground" : "w-full"}>
                            <SelectValue placeholder={config.placeholder}>
                                {config.value === "all" ? config.placeholder : config.value}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>{config.label}</SelectLabel>
                                <SelectItem value="all">All</SelectItem>
                                {getDistinctValues(field, config.predefinedOrder).map((item: string) => (
                                    <SelectItem key={item} value={item}>
                                        {item}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                ))}

                {/* Reset Filters Button */}
                <Button onClick={handleResetFilters} className="w-full">
                    Reset Filters
                </Button>
            </div>

            <div className="ag-theme-custom w-full mx-auto">
                <AgGridReact
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    autoSizeStrategy={autoSizeStrategy}
                    quickFilterText={quickFilterText}
                    includeHiddenColumnsInQuickFilter={true}
                    isExternalFilterPresent={isExternalFilterPresent}
                    doesExternalFilterPass={doesExternalFilterPass}
                    suppressMovableColumns={true}
                    onRowClicked={handleRowClick}
                    domLayout="autoHeight" // Ensures that grid height adjusts to content
                    rowHeight={175}
                    isFullWidthRow={isFullWidthRow}
                    fullWidthCellRenderer={fullWidthCellRenderer}
                />
            </div>

            {/* Modal for Card Display */}
            {selectedRow && <PlaceModal place={selectedRow} onClose={() => setSelectedRow(null)} />}
        </div>
    );
}
