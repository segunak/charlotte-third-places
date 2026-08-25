"use client";

import { useFilterData, useFilters } from "@/contexts/FilterContext";
import type { FilterKey } from "@/lib/filters";
import { FILTER_SENTINEL } from "@/lib/filters";
import { cn } from "@/lib/utils";
import React, { useCallback } from "react";

interface FilterSegmentedControlProps {
    field: FilterKey;
    value: string;
    label: string;
}

export const FilterSegmentedControl = React.memo(function FilterSegmentedControl({
    field,
    value,
    label,
}: FilterSegmentedControlProps) {
    const { setFilters } = useFilters();
    const { getDistinctValues } = useFilterData();
    const options = getDistinctValues(field);

    const handleSegmentClick = useCallback(
        (segmentValue: string) => {
            setFilters((prevFilters) => {
                const newValue = prevFilters[field].value === segmentValue
                    ? FILTER_SENTINEL
                    : segmentValue;

                return {
                    ...prevFilters,
                    [field]: { ...prevFilters[field], value: newValue },
                };
            });
        },
        [field, setFilters]
    );

    const segments = options.map((option) => ({ value: option, label: option }));
    const gridColumns = segments.length === 4
        ? "grid-cols-4"
        : segments.length === 3
            ? "grid-cols-3"
            : "grid-cols-2";

    return (
        <fieldset className="min-w-0 space-y-2">
            <legend className="text-sm font-semibold text-foreground">{label}</legend>
            <div
                role="group"
                aria-label={label}
                className={cn("grid w-full gap-1 rounded-xl border border-border bg-muted/40 p-1", gridColumns)}
            >
                {segments.map((segment) => {
                    const isSelected = value === segment.value;

                    return (
                        <button
                            key={segment.value}
                            type="button"
                            aria-pressed={isSelected}
                            className={cn(
                                "h-10 min-w-0 whitespace-nowrap rounded-lg px-1 text-xs font-medium text-muted-foreground transition-colors",
                                "hover:bg-background/70 hover:text-foreground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50",
                                isSelected && "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:text-primary-foreground"
                            )}
                            onClick={() => handleSegmentClick(segment.value)}
                            data-selected={isSelected ? "" : undefined}
                        >
                            {segment.label}
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
});

FilterSegmentedControl.displayName = "FilterSegmentedControl";