"use client";

import React, { useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFilters, useFilterData } from "@/contexts/FilterContext";
import { FILTER_SENTINEL } from "@/lib/filters";
import type { FilterKey } from "@/lib/filters";

interface FilterChipsProps {
    field: FilterKey;
    value: string;
    label: string;
}

export const FilterChips = React.memo(function FilterChips({ field, value, label }: FilterChipsProps) {
    const { setFilters } = useFilters();
    const { getDistinctValues } = useFilterData();
    const options = getDistinctValues(field);

    const handleChipClick = useCallback(
        (chipValue: string) => {
            setFilters((prevFilters) => {
                // If the chip is already selected, deselect it (return to "all")
                // Otherwise, select this chip
                const newValue = prevFilters[field].value === chipValue ? FILTER_SENTINEL : chipValue;
                return {
                    ...prevFilters,
                    [field]: { ...prevFilters[field], value: newValue },
                };
            });
        },
        [field, setFilters]
    );

    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">{label}:</span>
            {options.map((option) => {
                const isSelected = value === option;
                return (
                    <Button
                        key={option}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                            "transition-colors",
                            isSelected && "bg-primary text-primary-foreground"
                        )}
                        onClick={() => handleChipClick(option)}
                        data-selected={isSelected ? "" : undefined}
                    >
                        {option}
                    </Button>
                );
            })}
        </div>
    );
});

FilterChips.displayName = "FilterChips";
