"use client";

// See https://www.ag-grid.com/react-data-grid/applying-theme-builder-styling-grid/
import "@/styles/ag-grid-theme-builder.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile"
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
    style?: React.CSSProperties; // Optional style prop with CSS properties
}

const autoSizeStrategy: SizeColumnsToContentStrategy = {
    type: 'fitCellContents',
};

export function DataTable({ rowData, colDefs, style }: DataTableProps) {
    const gridRef = useRef<AgGridReact>(null);
    const [filteredData, setFilteredData] = useState(rowData);
    const [quickFilterText, setQuickFilterText] = useState<string>('');
    const [selectedRow, setSelectedRow] = useState<any | null>(null);  // For selected card on click
    const isMobile = useIsMobile();

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
        // Helper function to determine if a field matches the filter value.
        // 1. If the filterValue is "all", return true (i.e., no filter applied for this field).
        // 2. If the fieldValue is an array (e.g., multiple types), check if it includes the filterValue.
        // 3. Otherwise, check if the fieldValue matches the filterValue exactly.
        const isFieldMatch = (fieldValue: string | string[], filterValue: string) =>
            filterValue === "all" ||
            (Array.isArray(fieldValue) ? fieldValue.includes(filterValue) : fieldValue === filterValue);

        // Destructuring filter values from the filters object for easier reference.
        const { name, type, size, neighborhood, purchaseRequired, parkingSituation, freeWifi, hasCinnamonRolls } = filters;

        // Return true if all fields in the row node pass their respective filter.
        // This checks each field against its corresponding filter using the helper function `isFieldMatch`.
        return (
            isFieldMatch(node.data.name, name.value) &&
            isFieldMatch(node.data.type, type.value) &&
            isFieldMatch(node.data.size, size.value) &&
            isFieldMatch(node.data.neighborhood, neighborhood.value) &&
            isFieldMatch(node.data.purchaseRequired, purchaseRequired.value) &&
            isFieldMatch(node.data.parkingSituation, parkingSituation.value) &&
            isFieldMatch(node.data.freeWifi, freeWifi.value) &&
            isFieldMatch(node.data.hasCinnamonRolls, hasCinnamonRolls.value)
        );
    }, [filters]);


    // Memoized column definitions
    const updatedColDefs = useMemo(() => {
        if (isMobile) {
            // Mobile view - Single "Place" column that shows the PlaceCard
            return [
                {
                    headerName: "Place",
                    field: "name",  // We can use 'name' field to trigger the modal on row click
                    cellRenderer: (params: any) => (
                        <PlaceCard
                            place={params.data}
                            onClick={() => handleRowClick({ data: params.data })}
                        />
                    ),
                    autoHeight: true,  // Enable autoHeight for mobile to adjust row height based on card content
                    suppressMovableColumns: true,  // No column movement needed on mobile
                    flex: 1,  // Flex-grow to fit the grid width and prevent horizontal scrolling
                    wrapText: true, // Ensure text doesn't overflow the card width
                }
            ];
        }

        // Desktop view - Show all columns
        return colDefs.map((col) => {
            if (col.field === "type" || col.field === "ambience") {
                return {
                    ...col,
                    valueFormatter: (params: any) =>
                        Array.isArray(params.value) ? params.value.join(", ") : params.value, // Handle array values
                };
            }
            return col;
        });
    }, [colDefs, isMobile, handleRowClick]);

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

            <div className="ag-theme-custom" style={{ ...style }}>
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
                    rowHeight={isMobile ? 150 : undefined}  // Adjust row height on mobile for PlaceCard
                />
            </div>

            {/* Modal for Card Display */}
            {selectedRow && <PlaceModal place={selectedRow} onClose={() => setSelectedRow(null)} />}
        </div>
    );
}
