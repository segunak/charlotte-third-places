"use client";

import React, { useContext, useCallback, useMemo, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FilterContext } from "@/contexts/FilterContext";
import { SortField, SortDirection, DEFAULT_SORT_OPTION } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { SearchablePickerModal } from "@/components/SearchablePickerModal";

const maxWidth = "max-w-full";

export function FilterQuickSearch() {
    const { quickFilterText, setQuickFilterText } = useContext(FilterContext);

    const handleQuickFilterChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setQuickFilterText(event.target.value);
        },
        [setQuickFilterText]
    );

    return (
        <div className={maxWidth}>
            <Input
                type="text"
                placeholder="Search All Fields..."
                value={quickFilterText}
                onChange={handleQuickFilterChange}
                className="w-full"
                autoFocus={false}
            />
        </div>
    );
}

export function FilterSelect({ field, config, resetSignal }: { field: keyof typeof filters; config: any; resetSignal?: number }) {
    const { filters, setFilters, getDistinctValues, handleDropdownStateChange } = useContext(FilterContext);
    const isMobile = useIsMobile();
    const [pickerOpen, setPickerOpen] = useState(false);

    useEffect(() => {
        setPickerOpen(false);
    }, [resetSignal]);
    
    // Store the previous value to detect changes from reset operations
    const prevValueRef = useRef(config.value);

    // Handle picker select manually to control closing behavior
    const handlePickerSelect = (value: string) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [field]: { ...prevFilters[field], value },
        }));
        setPickerOpen(false); // Only close here, not on external reset
    };

    const handleFilterChange = useCallback(
        (value: string) => {
            setFilters((prevFilters) => ({
                ...prevFilters,
                [field]: { ...prevFilters[field], value },
            }));
        },
        [field, setFilters]
    );

    // Use effect to track value changes due to reset
    useEffect(() => {
        // If the value changes to "all" but pickerOpen was true, it's likely a reset
        // Don't close the parent dialog in this case
        prevValueRef.current = config.value;
    }, [config.value]);

    // Always use modal picker for 'name', 'type', and 'neighborhood' fields on mobile
    if (isMobile && (field === "name" || field === "type" || field === "neighborhood")) {
        return (
            <>
                <Button
                    variant={config.value === "all" ? "outline" : "default"}
                    className={cn(
                        "w-full hover:bg-primary/90 hover:text-accent-foreground justify-between",
                        config.value === "all"
                            ? "text-muted-foreground font-normal"
                            : "font-bold"
                    )}
                    onClick={() => setPickerOpen(true)}
                >
                    {config.value === "all" ? config.placeholder : config.value}
                </Button>
                {/* Conditionally render the modal only when pickerOpen is true */}
                {pickerOpen && (
                    <SearchablePickerModal
                        open={pickerOpen}
                        onOpenChange={setPickerOpen}
                        options={getDistinctValues(field)}
                        value={config.value}
                        label={config.label}
                        placeholder={config.placeholder}
                        onSelect={handlePickerSelect}
                    />
                )}
            </>
        );
    }

    return (
        <div className={maxWidth}>
            <Select
                key={field}
                value={config.value}
                onValueChange={handleFilterChange}
                onOpenChange={(isOpen) => handleDropdownStateChange(isOpen)}
            >
                <SelectTrigger 
                className={cn(
                    "w-full hover:bg-primary/90 hover:text-accent-foreground",
                    config.value === "all"
                        ? "text-muted-foreground font-normal"
                        : "font-bold bg-primary text-primary-foreground"
                )}
                >
                    <SelectValue placeholder={config.placeholder}>
                        {config.value === "all" ? config.placeholder : config.value}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>{config.label}</SelectLabel>
                        <SelectItem value="all">All</SelectItem>
                        {getDistinctValues(field).map((item: string) => (
                            <SelectItem key={item} value={item}>
                                {item}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}

export function FilterResetButton() {
    const { setFilters, setQuickFilterText, setSortOption, dropdownOpen } = useContext(FilterContext);

    const handleResetFilters = useCallback((e: React.MouseEvent) => {
        // Prevent any event bubbling that might affect parent dialogs
        e.preventDefault();
        e.stopPropagation();
        
        setFilters((prevFilters) => {
            const resetFilters = { ...prevFilters };
            Object.keys(resetFilters).forEach((key) => {
                resetFilters[key as keyof typeof prevFilters].value = "all";
            });
            return resetFilters;
        });
        setQuickFilterText("");
        setSortOption(DEFAULT_SORT_OPTION);
    }, [setFilters, setQuickFilterText, setSortOption]);

    return (
        <div className={maxWidth}>
            <Button 
                className="w-full disabled:opacity-100" 
                onClick={handleResetFilters}
                disabled={dropdownOpen}
            >
                Reset
            </Button>
        </div>
    );
}

export function SortSelect({ className }: { className?: string }) {
    const { sortOption, setSortOption } = useContext(FilterContext);

    const handleSortChange = useCallback(
        (value: string) => {
            const [field, direction] = value.split("-");
            setSortOption({
                field: field as SortField,
                direction: direction as SortDirection,
            });
        },
        [setSortOption]
    );

    const placeholderText = useMemo(() => {
        if (sortOption.field === SortField.Name) {
            return sortOption.direction === SortDirection.Ascending ? "Name (A-Z)" : "Name (Z-A)";
        }
        if (sortOption.field === SortField.DateAdded) {
            return sortOption.direction === SortDirection.Ascending
                ? "Date Added (Old to New)"
                : "Date Added (New to Old)";
        }
        if (sortOption.field === SortField.LastModified) {
            return sortOption.direction === SortDirection.Ascending
                ? "Last Updated (Old to New)"
                : "Last Updated (New to Old)";
        }
        return "Sort by...";
    }, [sortOption]);

    return (
        <div className={cn(maxWidth, className)}>
            <Select
                value={`${sortOption.field}-${sortOption.direction}`}
                onValueChange={handleSortChange}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={placeholderText}>
                        {sortOption.field === SortField.Name
                            ? sortOption.direction === SortDirection.Ascending
                                ? "Name (A-Z)"
                                : "Name (Z-A)"
                            : sortOption.field === SortField.DateAdded
                                ? sortOption.direction === SortDirection.Ascending
                                    ? "Date Added (Old to New)"
                                    : "Date Added (New to Old)"
                                : sortOption.direction === SortDirection.Ascending
                                    ? "Last Updated (Old to New)"
                                    : "Last Updated (New to Old)"}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Sort By</SelectLabel>
                        <SelectItem value={`${SortField.Name}-${SortDirection.Ascending}`}>
                            Name (A-Z)
                        </SelectItem>
                        <SelectItem value={`${SortField.Name}-${SortDirection.Descending}`}>
                            Name (Z-A)
                        </SelectItem>
                        <SelectItem value={`${SortField.DateAdded}-${SortDirection.Ascending}`}>
                            Date Added (Old to New)
                        </SelectItem>
                        <SelectItem value={`${SortField.DateAdded}-${SortDirection.Descending}`}>
                            Date Added (New to Old)
                        </SelectItem>
                        <SelectItem value={`${SortField.LastModified}-${SortDirection.Ascending}`}>
                            Last Updated (Old to New)
                        </SelectItem>
                        <SelectItem value={`${SortField.LastModified}-${SortDirection.Descending}`}>
                            Last Updated (New to Old)
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}
