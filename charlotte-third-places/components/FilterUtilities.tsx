"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useContext, useCallback, useMemo } from "react";
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

const maxWidth = "md:min-w-[14.3rem] md:max-w-[14.3rem]";

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

export function FilterSelect({ field, config }: { field: keyof typeof filters; config: any }) {
    const { filters, setFilters, getDistinctValues, setDropdownOpen } = useContext(FilterContext);

    const handleFilterChange = useCallback(
        (value: string) => {
            setFilters((prevFilters) => ({
                ...prevFilters,
                [field]: { ...prevFilters[field], value },
            }));
        },
        [field, setFilters]
    );

    return (
        <div className={maxWidth}>
            <Select
                key={field}
                value={config.value}
                onValueChange={handleFilterChange}
                onOpenChange={(isOpen) => setDropdownOpen(isOpen)}
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

    const handleResetFilters = useCallback(() => {
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
            <Button onClick={handleResetFilters} className={cn("w-full z-40", dropdownOpen ? "pointer-events-none" : "")}>
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
                ? "Date Added (Oldest First)"
                : "Date Added (Newest First)";
        }
        if (sortOption.field === SortField.LastModified) {
            return sortOption.direction === SortDirection.Ascending
                ? "Last Modified (Oldest First)"
                : "Last Modified (Newest First)";
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
                    <SelectValue placeholder={placeholderText} >
                        {sortOption.field === SortField.Name
                            ? sortOption.direction === SortDirection.Ascending
                                ? "Name (A-Z)"
                                : "Name (Z-A)"
                            : sortOption.field === SortField.DateAdded
                                ? sortOption.direction === SortDirection.Ascending
                                    ? "Date Added (Oldest First)"
                                    : "Date Added (Newest First)"
                                : sortOption.direction === SortDirection.Ascending
                                    ? "Last Modified (Oldest First)"
                                    : "Last Modified (Newest First)"}
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
                            Date Added (Oldest First)
                        </SelectItem>
                        <SelectItem value={`${SortField.DateAdded}-${SortDirection.Descending}`}>
                            Date Added (Newest First)
                        </SelectItem>
                        <SelectItem value={`${SortField.LastModified}-${SortDirection.Ascending}`}>
                            Last Modified (Oldest First)
                        </SelectItem>
                        <SelectItem value={`${SortField.LastModified}-${SortDirection.Descending}`}>
                            Last Modified (Newest First)
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}
