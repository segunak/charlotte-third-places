"use client";

// See https://www.ag-grid.com/react-data-grid/applying-theme-builder-styling-grid/
import "@/styles/ag-grid-theme-builder.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceModal } from "@/components/PlaceModal";
import { AgGridReact } from '@ag-grid-community/react';
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
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
    colDefs: ColDef[]; // Accepts column definitions for AG Grid
}

const autoSizeStrategy: SizeColumnsToContentStrategy = {
    type: 'fitCellContents',
};

export function DataTable({ rowData, colDefs }: DataTableProps) {
    const gridRef = useRef<AgGridReact>(null);
    const [filteredData, setFilteredData] = useState(rowData);
    const [quickFilterText, setQuickFilterText] = useState<string>('');
    const [selectedRow, setSelectedRow] = useState<any | null>(null);  // For selected card on click

    // Unified filter object
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

    // Get distinct values for dropdowns
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

    // Handle filter changes
    const handleFilterChange = useCallback((field: keyof typeof filters, value: string) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [field]: { ...prevFilters[field], value }
        }));
        gridRef.current?.api.onFilterChanged(); // Trigger AG Grid filter
    }, []);

    // Handle quick search changes
    const handleQuickFilterChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setQuickFilterText(event.target.value);
    }, []);

    // Reset filters to default values
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
    const updatedColDefs = useMemo(() => {
        // Only show "Place" column but allow filtering based on hidden columns
        return [
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
                wrapText: true, // Ensure text doesn't overflow the card width
            },
            // Hidden columns, available for filtering but not visible in the grid
            { field: "type", hide: true },
            { field: "size", hide: true },
            { field: "neighborhood", hide: true },
            { field: "purchaseRequired", hide: true },
            { field: "parkingSituation", hide: true },
            { field: "freeWifi", hide: true },
            { field: "hasCinnamonRolls", hide: true },
            { field: "website", hide: true },
            { field: "googleMapsProfileURL", hide: true },
            { field: "coverPhotoURL", hide: true }
        ];
    }, [handleRowClick]);

    return (
        <div>
            {/* Filters and Search */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-5 mb-5 m-px">
                <Input
                    type="text"
                    placeholder="Search All Columns..."
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
                    rowData={filteredData}
                    columnDefs={updatedColDefs}
                    autoSizeStrategy={autoSizeStrategy}
                    quickFilterText={quickFilterText}
                    isExternalFilterPresent={isExternalFilterPresent}
                    doesExternalFilterPass={doesExternalFilterPass}
                    suppressMovableColumns={true}
                    onRowClicked={handleRowClick}
                    domLayout="autoHeight" // Ensures that grid height adjusts to content
                    rowHeight={175}
                    isFullWidthRow={isFullWidthRow}
                    fullWidthCellRenderer={fullWidthCellRenderer}  // Renderer for full width row
                />
            </div>

            {/* Modal for Card Display */}
            {selectedRow && <PlaceModal place={selectedRow} onClose={() => setSelectedRow(null)} />}
        </div>
    );
}
