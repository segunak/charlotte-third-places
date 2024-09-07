"use client"

import { useCallback, useEffect, useRef, useState } from "react";
import "@/styles/ag-grid-theme-builder.css" // See https://www.ag-grid.com/react-data-grid/applying-theme-builder-styling-grid/
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/select"

ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface DataTableProps {
    rowData: Array<object>; // Accepts an array of objects for the row data
    colDefs: ColDef[]; // Accepts column definitions for AG Grid
    style?: React.CSSProperties; // Optional style prop with CSS properties
}

const autoSizeStrategy: SizeColumnsToContentStrategy = {
    type: 'fitCellContents'
};

export function DataTable({ rowData, colDefs, style }: DataTableProps) {
    const gridRef = useRef<AgGridReact>(null);
    const [quickFilterText, setQuickFilterText] = useState<string>('');
    const [filteredData, setFilteredData] = useState(rowData);
    const [filters, setFilters] = useState({
        type: "",
        size: "",
        neighborhood: "",
        purchaseRequired: "",
    });

    const getDistinctValues = (field: string) => {
        const values = rowData.map((item: any) => item[field]).filter(Boolean);
        return Array.from(new Set(values));
    };

    const handleFilterChange = (field: string, value: string) => {
        setFilters((prevFilters) => ({ ...prevFilters, [field]: value }));
        gridRef.current?.api.onFilterChanged(); // Trigger AG Grid to reapply filters
    };

    const handleQuickFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQuickFilterText(event.target.value);
    };

    const isExternalFilterPresent = useCallback(() => {
        // Check if any of the filters are applied
        return !!filters.type || !!filters.size || !!filters.neighborhood || !!filters.purchaseRequired;
    }, [filters]);

    const doesExternalFilterPass = useCallback((node: IRowNode) => {
        const { type, size, neighborhood, purchaseRequired } = filters;
        return (
            (!type || node.data.type === type) &&
            (!size || node.data.size === size) &&
            (!neighborhood || node.data.neighborhood === neighborhood) &&
            (!purchaseRequired || node.data.purchaseRequired === purchaseRequired)
        );
    }, [filters]);
    useEffect(() => {
        const filtered = rowData.filter((item: any) => {
            return (
                (!filters.type || item.type === filters.type) &&
                (!filters.size || item.size === filters.size) &&
                (!filters.neighborhood || item.neighborhood === filters.neighborhood) &&
                (!filters.purchaseRequired || item.purchaseRequired === filters.purchaseRequired)
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

            <div className="grid grid-cols-4 gap-4 mb-4">
                {/* Type Filter */}
                <Select onValueChange={(value) => handleFilterChange("type", value)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Type</SelectLabel>
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
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Size</SelectLabel>
                            {getDistinctValues("size").map((size: string) => (
                                <SelectItem key={size} value={size}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                {/* Neighborhood Filter */}
                <Select onValueChange={(value) => handleFilterChange("neighborhood", value)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Neighborhood" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Neighborhood</SelectLabel>
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
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Purchase Required" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Purchase Required</SelectLabel>
                            {getDistinctValues("purchaseRequired").map((purchaseRequired: string) => (
                                <SelectItem key={purchaseRequired} value={purchaseRequired}>
                                    {purchaseRequired}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
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
                />
            </div>
        </div>
    );
}
