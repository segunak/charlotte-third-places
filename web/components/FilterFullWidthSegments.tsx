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
    const Container = usesFieldset ? "fieldset" : "div";
    const Label = usesFieldset ? "legend" : "span";

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
        <Container className={cn(
            "min-w-0",
            usesFieldset
                ? "w-full min-w-0 rounded-xl border border-border bg-muted/20 px-2.5 pb-2.5"
                : layout === "stacked"
                    ? "space-y-2"
                    : "grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-2 max-[359px]:grid-cols-1"
        )}>
            <Label id={labelId} className={cn(
                "text-sm font-semibold text-foreground",
                usesFieldset && "mx-auto bg-card px-2"
            )}>{label}</Label>
            <div
                role="group"
                aria-labelledby={labelId}
                className={cn(
                    "grid w-full gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5",
                    usesFieldset && "mt-1",
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
        </Container>
    );
});

FilterFullWidthSegments.displayName = "FilterFullWidthSegments";