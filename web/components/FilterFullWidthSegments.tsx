"use client";

import { useFilters } from "@/contexts/FilterContext";
import { FILTER_SENTINEL, type FilterKey } from "@/lib/filters";
import { cn } from "@/lib/utils";
import React, { useCallback } from "react";

interface SegmentOption {
    label: string;
    value: string;
}

interface FilterFullWidthSegmentsProps {
    field: FilterKey;
    value: string;
    label: string;
    options: readonly SegmentOption[];
    columnsClassName?: string;
}

export const FilterFullWidthSegments = React.memo(function FilterFullWidthSegments({
    field,
    value,
    label,
    options,
    columnsClassName,
}: FilterFullWidthSegmentsProps) {
    const { setFilters } = useFilters();
    const labelId = React.useId();

    const handleSegmentClick = useCallback((optionValue: string) => {
        setFilters(previousFilters => ({
            ...previousFilters,
            [field]: {
                ...previousFilters[field],
                value: previousFilters[field].value === optionValue
                    ? FILTER_SENTINEL
                    : optionValue,
            },
        }));
    }, [field, setFilters]);

    return (
        <div className="grid min-w-0 grid-cols-[8rem_minmax(0,1fr)] items-center gap-2 max-[359px]:grid-cols-1">
            <span id={labelId} className="text-sm font-semibold text-foreground">{label}</span>
            <div
                role="group"
                aria-labelledby={labelId}
                className={cn(
                    "grid w-full gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5",
                    columnsClassName ?? (options.length === 3 ? "grid-cols-3" : "grid-cols-2")
                )}
            >
                {options.map(option => {
                    const isSelected = value === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={isSelected}
                            className={cn(
                                "h-8 min-w-0 whitespace-nowrap rounded-md px-1 text-xs font-medium text-muted-foreground transition-colors",
                                "hover:bg-background/70 hover:text-foreground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50",
                                isSelected && "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:text-primary-foreground"
                            )}
                            onClick={() => handleSegmentClick(option.value)}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
});

FilterFullWidthSegments.displayName = "FilterFullWidthSegments";