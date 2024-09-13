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
        setFilters((prevFilters) => {
            const resetFilters = { ...prevFilters };
            Object.keys(resetFilters).forEach((key) => {
                resetFilters[key as keyof typeof prevFilters].value = "all";
            });
            return resetFilters;
        });
        setQuickFilterText("");
    }, []);

    const isFullWidthRow = useCallback((params: any) => {
        return true;
    }, []);

    const handlePlaceClick = useCallback((place: any) => {
        setSelectedRow(place);
    }, []);

    const columnDefs = useMemo(() => {
        const gridColumns: ColDef[] = [
            {
                headerName: "",
                field: "dummy",
                flex: 1,
                resizable: false,
                cellRenderer: "agFullWidthCellRenderer",
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
                    parkingSituation,
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
                    (parkingSituation.value === "all" || place.parkingSituation === parkingSituation.value) &&
                    (freeWifi.value === "all" || place.freeWifi === freeWifi.value) &&
                    (hasCinnamonRolls.value === "all" || place.hasCinnamonRolls === hasCinnamonRolls.value)
                );
            });
        },
        [filters]
    );

    const filteredAndGroupedRowData = useMemo(() => {
        // Apply quick filter text
        let filteredData = rowData;

        if (quickFilterText.trim() !== "") {
            const lowerCaseFilter = quickFilterText.toLowerCase();
            filteredData = filteredData.filter((place: any) =>
                normalizeTextForSearch(JSON.stringify(place)).includes(lowerCaseFilter)
            );
        }

        // Apply selected filters
        filteredData = applyFilters(filteredData);

        // Group the filtered data into groups of three
        const grouped = [];
        for (let i = 0; i < filteredData.length; i += 3) {
            const group = filteredData.slice(i, i + 3);
            grouped.push({ group });
        }
        return grouped;
    }, [rowData, quickFilterText, applyFilters]);

    const fullWidthCellRenderer = useCallback(
        (params: any) => {
            const { group } = params.data;
            return (
                <div className="flex flex-col sm:flex-row flex-wrap sm:space-x-4 space-y-4 sm:space-y-0">
                    {group.map((place: any, index: number) => (
                        <div key={index} className="w-full sm:w-1/3 sm:px-2">
                            <PlaceCard
                                place={place}
                                onClick={() => handlePlaceClick(place)}
                            />
                        </div>
                    ))}
                </div>
            );
        },
        [handlePlaceClick]
    );

    return (
        <div>
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

            <div className="flex flex-col h-screen">
                <div className="ag-theme-custom w-full mx-auto flex-grow overflow-y-auto">
                    <AgGridReact
                        ref={gridRef}
                        rowData={filteredAndGroupedRowData}
                        columnDefs={columnDefs}
                        autoSizeStrategy={autoSizeStrategy}
                        quickFilterText={quickFilterText}
                        includeHiddenColumnsInQuickFilter={true}
                        suppressMovableColumns={true}
                        domLayout="normal" // Ensures that grid height adjusts to content
                        rowHeight={175}
                        isFullWidthRow={isFullWidthRow}
                        fullWidthCellRenderer={fullWidthCellRenderer}
                    />
                </div>

                {/* Modal for Card Display */}
                {selectedRow && <PlaceModal place={selectedRow} onClose={() => setSelectedRow(null)} />}
            </div>
        </div>
    );
}
