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
import type { FilterConfig } from "@/lib/types";

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

export function FilterSelect({ field, value, label, placeholder, predefinedOrder, resetSignal, onDropdownOpenChange, onModalClose, isActivePopover, anyPopoverOpen }: {
    field: keyof FilterConfig;
    value: string;
    label: string;
    placeholder: string;
    predefinedOrder: string[];
    resetSignal?: number;
    onDropdownOpenChange?: (open: boolean) => void;
    onModalClose?: () => void;
    isActivePopover?: boolean;
    anyPopoverOpen?: boolean;
}) {
    const { setFilters, getDistinctValues } = useContext(FilterContext);
    const isMobile = useIsMobile();
    const [pickerOpen, setPickerOpen] = useState(false);
    const [selectOpen, setSelectOpen] = useState(false);

    useEffect(() => {
        setPickerOpen(false);
    }, [resetSignal]);

    useEffect(() => {
        if (onDropdownOpenChange) {
            if (isMobile && (field === "name" || field === "type" || field === "neighborhood")) {
                onDropdownOpenChange(pickerOpen);
            } else {
                onDropdownOpenChange(selectOpen);
            }
        }
    }, [pickerOpen, selectOpen, onDropdownOpenChange, isMobile, field]);

    const handlePickerSelect = (newValue: string) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [field]: { ...prevFilters[field], value: newValue },
        }));
        setPickerOpen(false);
    };

    const handleFilterChange = useCallback(
        (newValue: string) => {
            setFilters((prevFilters) => {
                // Defensive: Only update the intended field, never replace the whole object
                if (!prevFilters[field]) return prevFilters;
                // Defensive: Only allow string values
                const safeValue = typeof newValue === "string" ? newValue : "all";
                return {
                    ...prevFilters,
                    [field]: { ...prevFilters[field], value: safeValue },
                };
            });
        },
        [field, setFilters]
    );

    // Only allow pointer events if this is the active popover or none are open
    const pointerEventsStyle = (!anyPopoverOpen || isActivePopover)
        ? undefined
        : { pointerEvents: 'none' as React.CSSProperties['pointerEvents'], opacity: 0.7 };

    if (isMobile && (field === "name" || field === "type" || field === "neighborhood")) {
        return (
            <div style={pointerEventsStyle}>
                <Button
                    variant={value === "all" ? "outline" : "default"}
                    className={cn(
                        "w-full hover:bg-primary/90 hover:text-accent-foreground justify-between",
                        value === "all"
                            ? "text-muted-foreground font-normal"
                            : "font-bold"
                    )}
                    onClick={() => setPickerOpen(true)}
                >
                    {value === "all" ? placeholder : value}
                </Button>
                {pickerOpen && (
                    <SearchablePickerModal
                        open={pickerOpen}
                        onOpenChange={(open) => {
                            setPickerOpen(open);
                            if (!open && onModalClose) {
                                setTimeout(onModalClose, 10);
                            }
                        }}
                        options={getDistinctValues(field)}
                        value={value}
                        label={label}
                        placeholder={placeholder}
                        onSelect={handlePickerSelect}
                    />
                )}
            </div>
        );
    }

    return (
        <div className={maxWidth} style={pointerEventsStyle}>
            <Select
                key={field}
                value={value}
                onValueChange={handleFilterChange}
                onOpenChange={setSelectOpen}
            >
                <SelectTrigger
                    className={cn(
                        "w-full hover:bg-primary/90 hover:text-accent-foreground",
                        value === "all"
                            ? "text-muted-foreground font-normal"
                            : "font-bold bg-primary text-primary-foreground"
                    )}
                >
                    <SelectValue placeholder={placeholder}>
                        {value === "all" ? placeholder : value}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent position="popper" side="top">
                    <SelectGroup>
                        <SelectLabel>{label}</SelectLabel>
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

export function FilterResetButton({ disabled }: { disabled?: boolean }) {
    const { setFilters, setQuickFilterText, setSortOption } = useContext(FilterContext);

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
                className="w-full"
                onClick={handleResetFilters}
                disabled={disabled}
            >
                Reset
            </Button>
        </div>
    );
}

export function SortSelect({ className, onDropdownOpenChange }: { className?: string; onDropdownOpenChange?: (open: boolean) => void }) {
    const { sortOption, setSortOption } = useContext(FilterContext);
    const [selectOpen, setSelectOpen] = useState(false);
    useEffect(() => {
        if (onDropdownOpenChange) onDropdownOpenChange(selectOpen);
    }, [selectOpen, onDropdownOpenChange]);

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
                onOpenChange={setSelectOpen}
            >
                <SelectTrigger className="w-full hover:bg-primary/90 hover:text-accent-foreground">
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
