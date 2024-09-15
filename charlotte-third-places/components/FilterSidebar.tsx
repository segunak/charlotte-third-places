"use client"

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

export function FilterSidebar() {
    const { filters, setFilters, quickFilterText, setQuickFilterText, getDistinctValues } = useContext(FilterContext);

    const handleFilterChange = useCallback((field: keyof typeof filters, value: string) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [field]: { ...prevFilters[field], value },
        }));
    }, [setFilters]);

    const handleQuickFilterChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setQuickFilterText(event.target.value);
        },
        [setQuickFilterText]
    );

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
        <div className="p-4 space-y-4 bg-background border-l border-border h-screen sticky top-12">
            <h2 className="font-bold text-lg mt-4">Filters</h2>

            <Input
                type="text"
                placeholder="Search All Fields..."
                value={quickFilterText}
                onChange={handleQuickFilterChange}
                className="w-full"
            />

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
                            {getDistinctValues(field as keyof typeof filters).map((item: string) => (
                                <SelectItem key={item} value={item}>
                                    {item}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            ))}

            <Button onClick={handleResetFilters} className="w-full">
                Reset Filters
            </Button>
        </div>
    );
}