"use client";

import { FilterFieldset } from "@/components/FilterFieldset";
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
    layout?: "inline" | "stacked" | "fieldset";
}

export const FilterFullWidthSegments = React.memo(function FilterFullWidthSegments({
    field,
    value,
    label,
    options,
    columnsClassName,
    layout = "inline",
}: FilterFullWidthSegmentsProps) {
    const { setFilters } = useFilters();
    const labelId = React.useId();
    const usesFieldset = layout === "fieldset";
    const isActive = value !== FILTER_SENTINEL;

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

    const segments = (
        <div
            role="group"
            aria-labelledby={labelId}
            className={cn(
                "grid w-full gap-0 rounded-lg border border-border bg-muted/40 p-0.5",
                columnsClassName ?? (options.length === 3 ? "grid-cols-3" : "grid-cols-2")
            )}
        >
            {options.map((option, index) => {
                const isSelected = value === option.value;
                const previousIsSelected = index > 0 && value === options[index - 1].value;
                const showDivider = index > 0 && !isSelected && !previousIsSelected;

                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={isSelected}
                        className={cn(
                            "relative h-8 min-w-0 whitespace-nowrap rounded-md px-1 text-xs font-medium text-muted-foreground transition-colors",
                            "hover:bg-background/70 hover:text-foreground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50",
                            isSelected && "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:text-primary-foreground"
                        )}
                        onClick={() => handleSegmentClick(option.value)}
                    >
                        {showDivider && (
                            <span
                                aria-hidden="true"
                                data-segment-divider=""
                                className="absolute inset-y-2 left-0 w-px bg-border/70"
                            />
                        )}
                        {option.label}
                    </button>
                );
            })}
        </div>
    );

    if (usesFieldset) {
        return (
            <FilterFieldset active={isActive} label={label} labelId={labelId}>
                {segments}
            </FilterFieldset>
        );
    }

    return (
        <div className={cn(
            "min-w-0",
            layout === "stacked"
                ? "space-y-2"
                : "grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-2 max-[359px]:grid-cols-1"
        )}>
            <span id={labelId} className="text-sm font-semibold text-foreground">{label}</span>
            {segments}
        </div>
    );
});

FilterFullWidthSegments.displayName = "FilterFullWidthSegments";