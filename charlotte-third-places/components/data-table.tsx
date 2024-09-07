"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "@/styles/ag-grid-theme-builder.css"; // See https://www.ag-grid.com/react-data-grid/applying-theme-builder-styling-grid/
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AgGridReact } from '@ag-grid-community/react';
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
    const [quickFilterText, setQuickFilterText] = useState<string>('');
    const [filteredData, setFilteredData] = useState(rowData);

    const [filters, setFilters] = useState({
        type: { value: "all", placeholder: "Type" },
        size: { value: "all", placeholder: "Size" },
        neighborhood: { value: "all", placeholder: "Neighborhood" },
        purchaseRequired: { value: "all", placeholder: "Purchase Required" },
    });

    const getDistinctValues = (field: string, predefinedOrder: string[] = []) => {
        const values = rowData
            .map((item: any) => item[field])
            .filter(Boolean); // Filter out falsy values

        // Remove duplicates
        const distinctValues = Array.from(new Set(values));

        // Sort based on predefined order, or alphabetically if no predefined order is given
        return distinctValues.sort((a, b) => {
            const indexA = predefinedOrder.indexOf(a);
            const indexB = predefinedOrder.indexOf(b);

            if (predefinedOrder.length === 0) {
                // If no predefined order, sort alphabetically
                return a.localeCompare(b);
            }

            if (indexA === -1 && indexB === -1) return a.localeCompare(b); // Alphabetical sort for extras
            if (indexA === -1) return 1; // Place unknown values after predefined
            if (indexB === -1) return -1;
            return indexA - indexB; // Sort based on predefined order
        });
    };

    // Handle filter changes including clearing the filter
    const handleFilterChange = (field: keyof typeof filters, value: string) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [field]: {
                value,
                placeholder: prevFilters[field].placeholder  // Retain the correct placeholder
            }
        }));

        gridRef.current?.api.onFilterChanged(); // Notify AG Grid to reapply filters
    };

    // Handle quick search input
    const handleQuickFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQuickFilterText(event.target.value);
    };

    // AG Grid: Check if external filter is applied
    const isExternalFilterPresent = useCallback(() => {
        return Object.values(filters).some(filter => filter.value !== "all");
    }, [filters]);

    // AG Grid: Filter the data based on external filters
    const doesExternalFilterPass = useCallback((node: IRowNode) => {
        const { type, size, neighborhood, purchaseRequired } = filters;
        return (
            (type.value === "all" || node.data.type === type.value) &&
            (size.value === "all" || node.data.size === size.value) &&
            (neighborhood.value === "all" || node.data.neighborhood === neighborhood.value) &&
            (purchaseRequired.value === "all" || node.data.purchaseRequired === purchaseRequired.value)
        );
    }, [filters]);

    // Reset all filters
    const handleResetFilters = () => {
        setFilters({
            type: { value: "all", placeholder: "Type" },
            size: { value: "all", placeholder: "Size" },
            neighborhood: { value: "all", placeholder: "Neighborhood" },
            purchaseRequired: { value: "all", placeholder: "Purchase Required" },
        });
        setQuickFilterText(""); // Clear the quick search input
        gridRef.current?.api.setFilterModel(null); // Clear all AG Grid filters
        gridRef.current?.api.onFilterChanged(); // Reapply filtering logic
    };

    useEffect(() => {
        const filtered = rowData.filter((item: any) => {
            return (
                (filters.type.value === "all" || item.type === filters.type.value) &&
                (filters.size.value === "all" || item.size === filters.size.value) &&
                (filters.neighborhood.value === "all" || item.neighborhood === filters.neighborhood.value) &&
                (filters.purchaseRequired.value === "all" || item.purchaseRequired === filters.purchaseRequired.value)
            );
        });
        setFilteredData(filtered);
    }, [filters, rowData]);

    return (
        <div>
            <div className="mb-4">
                <Input
                    type="text"
                    placeholder="Quick Search..."
                    onChange={handleQuickFilterChange}
                    value={quickFilterText}
                    className="w-full"
                />
            </div>

            <div className="grid sm:grid-cols-5 gap-5 mb-5">
                {/* Type Filter */}
                <Select onValueChange={(value) => handleFilterChange("type", value)}>
                    <SelectTrigger className={filters.type.value === "all" ? "w-full text-muted-foreground" : "w-full"}>
                        <SelectValue placeholder={filters.type.placeholder}>
                            {filters.type.value === "all" ? filters.type.placeholder : filters.type.value}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Type</SelectLabel>
                            <SelectItem value="all">All</SelectItem> {/* Clear Option */}
                            {getDistinctValues("type").map((type: string) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                {/* Size Filter */}
                <Select onValueChange={(value) => handleFilterChange("size", value)}>
                    <SelectTrigger className={filters.size.value === "all" ? "w-full text-muted-foreground" : "w-full"}>
                        <SelectValue placeholder={filters.size.placeholder}>
                            {filters.size.value === "all" ? filters.size.placeholder : filters.size.value}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Size</SelectLabel>
                            <SelectItem value="all">All</SelectItem> {/* Clear Option */}
                            {getDistinctValues("size", ["Small", "Medium", "Large"]).map((size: string) => (
                                <SelectItem key={size} value={size}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                {/* Neighborhood Filter */}
                <Select onValueChange={(value) => handleFilterChange("neighborhood", value)}>
                    <SelectTrigger className={filters.neighborhood.value === "all" ? "w-full text-muted-foreground" : "w-full"}>
                        <SelectValue placeholder={filters.neighborhood.placeholder}>
                            {filters.neighborhood.value === "all" ? filters.neighborhood.placeholder : filters.neighborhood.value}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Neighborhood</SelectLabel>
                            <SelectItem value="all">All</SelectItem> {/* Clear Option */}
                            {getDistinctValues("neighborhood").map((neighborhood: string) => (
                                <SelectItem key={neighborhood} value={neighborhood}>
                                    {neighborhood}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                {/* Purchase Required Filter */}
                <Select onValueChange={(value) => handleFilterChange("purchaseRequired", value)}>
                    <SelectTrigger className={filters.purchaseRequired.value === "all" ? "w-full text-muted-foreground" : "w-full"}>
                        <SelectValue placeholder={filters.purchaseRequired.placeholder}>
                            {filters.purchaseRequired.value === "all" ? filters.purchaseRequired.placeholder : filters.purchaseRequired.value}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Purchase Required</SelectLabel>
                            <SelectItem value="all">All</SelectItem> {/* Clear Option */}
                            {getDistinctValues("purchaseRequired", ["Yes", "No"]).map((purchaseRequired: string) => (
                                <SelectItem key={purchaseRequired} value={purchaseRequired}>
                                    {purchaseRequired}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>


                {/* Reset Filters Button */}
                <Button onClick={handleResetFilters}>
                    Reset Filters
                </Button>
            </div>

            <div className="ag-theme-custom" style={{ ...style }}>
                <AgGridReact
                    ref={gridRef}
                    rowData={filteredData}
                    columnDefs={colDefs}
                    autoSizeStrategy={autoSizeStrategy}
                    quickFilterText={quickFilterText}
                    isExternalFilterPresent={isExternalFilterPresent}
                    doesExternalFilterPass={doesExternalFilterPass}
                    suppressMovableColumns={true}
                />
            </div>
        </div>
    );
}
