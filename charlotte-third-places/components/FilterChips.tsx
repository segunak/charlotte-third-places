"use client";

import React, { useContext, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FilterContext } from "@/contexts/FilterContext";
import { FILTER_SENTINEL } from "@/lib/filters";
import type { FilterKey } from "@/lib/filters";

interface FilterChipsProps {
    field: FilterKey;
    value: string;
    label: string;
}

export function FilterChips({ field, value, label }: FilterChipsProps) {
    const { setFilters, getDistinctValues } = useContext(FilterContext);
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
        <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">{label}</span>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const isSelected = value === option;
                    return (
                        <Button
                            key={option}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
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
        </div>
    );
}
