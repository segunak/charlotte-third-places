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
        name: { value: "all", placeholder: "Name" },
        type: { value: "all", placeholder: "Type" },
        size: { value: "all", placeholder: "Size" },
        neighborhood: { value: "all", placeholder: "Neighborhood" },
        purchaseRequired: { value: "all", placeholder: "Purchase Required" },
        parkingSituation: { value: "all", placeholder: "Parking Situation" },
        freeWifi: { value: "all", placeholder: "Free Wifi" },
        hasCinnamonRolls: { value: "all", placeholder: "Has Cinnamon Rolls" },
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
                return a.localeCompare(b);
            }

            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    };

    const handleFilterChange = (field: keyof typeof filters, value: string) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [field]: {
                value,
                placeholder: prevFilters[field].placeholder  // Retain the correct placeholder
            }
        }));

        gridRef.current?.api.onFilterChanged();
    };

    const handleQuickFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQuickFilterText(event.target.value);
    };

    const isExternalFilterPresent = useCallback(() => {
        return Object.values(filters).some(filter => filter.value !== "all");
    }, [filters]);

    const doesExternalFilterPass = useCallback((node: IRowNode) => {
        const { name, type, size, neighborhood, purchaseRequired, parkingSituation, freeWifi, hasCinnamonRolls } = filters;
        return (
            (name.value === "all" || node.data.name === name.value) &&
            (type.value === "all" || node.data.type === type.value) &&
            (size.value === "all" || node.data.size === size.value) &&
            (neighborhood.value === "all" || node.data.neighborhood === neighborhood.value) &&
            (purchaseRequired.value === "all" || node.data.purchaseRequired === purchaseRequired.value) &&
            (parkingSituation.value === "all" || node.data.parkingSituation === parkingSituation.value) &&
            (freeWifi.value === "all" || node.data.freeWifi === freeWifi.value) &&
            (hasCinnamonRolls.value === "all" || node.data.hasCinnamonRolls === hasCinnamonRolls.value)
        );
    }, [filters]);

    const handleResetFilters = () => {
        setFilters({
            name: { value: "all", placeholder: "Name" },
            type: { value: "all", placeholder: "Type" },
            size: { value: "all", placeholder: "Size" },
            neighborhood: { value: "all", placeholder: "Neighborhood" },
            purchaseRequired: { value: "all", placeholder: "Purchase Required" },
            parkingSituation: { value: "all", placeholder: "Parking Situation" },
            freeWifi: { value: "all", placeholder: "Free Wifi" },
            hasCinnamonRolls: { value: "all", placeholder: "Has Cinnamon Rolls" },
        });
        setQuickFilterText("");
        gridRef.current?.api.setFilterModel(null);
        gridRef.current?.api.onFilterChanged();
    };

    useEffect(() => {
        const filtered = rowData.filter((item: any) => {
            const { name, type, size, neighborhood, purchaseRequired, parkingSituation, freeWifi, hasCinnamonRolls } = filters;
            return (
                (name.value === "all" || item.name === name.value) &&
                (type.value === "all" || item.type === type.value) &&
                (size.value === "all" || item.size === size.value) &&
                (neighborhood.value === "all" || item.neighborhood === neighborhood.value) &&
                (purchaseRequired.value === "all" || item.purchaseRequired === purchaseRequired.value) &&
                (parkingSituation.value === "all" || item.parkingSituation === parkingSituation.value) &&
                (freeWifi.value === "all" || item.freeWifi === freeWifi.value) &&
                (hasCinnamonRolls.value === "all" || item.hasCinnamonRolls === hasCinnamonRolls.value)
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

            <div className="grid sm:grid-cols-4 gap-5 mb-5">
                {/* Name Filter */}
                <Select onValueChange={(value) => handleFilterChange("name", value)}>
                    <SelectTrigger className={filters.name.value === "all" ? "w-full text-muted-foreground" : "w-full"}>
                        <SelectValue placeholder={filters.name.placeholder}>
                            {filters.name.value === "all" ? filters.name.placeholder : filters.name.value}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Name</SelectLabel>
                            <SelectItem value="all">All</SelectItem>
                            {getDistinctValues("name").map((name: string) => (
                                <SelectItem key={name} value={name}>
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

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
                            <SelectItem value="all">All</SelectItem>
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
                            <SelectItem value="all">All</SelectItem>
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
                            <SelectItem value="all">All</SelectItem>
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
                            <SelectItem value="all">All</SelectItem>
                            {getDistinctValues("purchaseRequired", ["Yes", "No"]).map((purchaseRequired: string) => (
                                <SelectItem key={purchaseRequired} value={purchaseRequired}>
                                    {purchaseRequired}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                {/* Parking Situation Filter */}
                <Select onValueChange={(value) => handleFilterChange("parkingSituation", value)}>
                    <SelectTrigger className={filters.parkingSituation.value === "all" ? "w-full text-muted-foreground" : "w-full"}>
                        <SelectValue placeholder={filters.parkingSituation.placeholder}>
                            {filters.parkingSituation.value === "all" ? filters.parkingSituation.placeholder : filters.parkingSituation.value}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Parking Situation</SelectLabel>
                            <SelectItem value="all">All</SelectItem>
                            {getDistinctValues("parkingSituation").map((parkingSituation: string) => (
                                <SelectItem key={parkingSituation} value={parkingSituation}>
                                    {parkingSituation}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                {/* Free Wifi Filter */}
                <Select onValueChange={(value) => handleFilterChange("freeWifi", value)}>
                    <SelectTrigger className={filters.freeWifi.value === "all" ? "w-full text-muted-foreground" : "w-full"}>
                        <SelectValue placeholder={filters.freeWifi.placeholder}>
                            {filters.freeWifi.value === "all" ? filters.freeWifi.placeholder : filters.freeWifi.value}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Free Wifi</SelectLabel>
                            <SelectItem value="all">All</SelectItem>
                            {getDistinctValues("freeWifi").map((freeWifi: string) => (
                                <SelectItem key={freeWifi} value={freeWifi}>
                                    {freeWifi}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                {/* Has Cinnamon Rolls Filter */}
                <Select onValueChange={(value) => handleFilterChange("hasCinnamonRolls", value)}>
                    <SelectTrigger className={filters.hasCinnamonRolls.value === "all" ? "w-full text-muted-foreground" : "w-full"}>
                        <SelectValue placeholder={filters.hasCinnamonRolls.placeholder}>
                            {filters.hasCinnamonRolls.value === "all" ? filters.hasCinnamonRolls.placeholder : filters.hasCinnamonRolls.value}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Has Cinnamon Rolls</SelectLabel>
                            <SelectItem value="all">All</SelectItem>
                            {getDistinctValues("hasCinnamonRolls").map((hasCinnamonRolls: string) => (
                                <SelectItem key={hasCinnamonRolls} value={hasCinnamonRolls}>
                                    {hasCinnamonRolls}
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
