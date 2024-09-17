"use client";

import { useContext, useCallback } from "react";
import { FilterContext } from "@/contexts/FilterContext";
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

// Define the max-w value as a variable
const maxWidth = "md:min-w-52 md:max-w-52";

// Quick search input component
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

// Filter select component for each filter dropdown
export function FilterSelect({ field, config }: { field: keyof typeof filters; config: any }) {
    const { filters, setFilters, getDistinctValues } = useContext(FilterContext);

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

// Button to reset all filters
export function FilterResetButton() {
    const { setFilters, setQuickFilterText } = useContext(FilterContext);

    const handleResetFilters = useCallback(() => {
        setFilters((prevFilters) => {
            const resetFilters = { ...prevFilters };
            Object.keys(resetFilters).forEach((key) => {
                resetFilters[key as keyof typeof prevFilters].value = "all";
            });
            return resetFilters;
        });
        setQuickFilterText("");
    }, [setFilters, setQuickFilterText]);

    return (
        <div className={maxWidth}>
            <Button onClick={handleResetFilters} className="w-full">
                Reset Filters
            </Button>
        </div>
    );
}
