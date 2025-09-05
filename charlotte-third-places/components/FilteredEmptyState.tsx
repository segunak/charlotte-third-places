"use client";

import { FilterResetButton } from "@/components/FilterUtilities";
import { cn } from "@/lib/utils";
import React from "react";

interface FilteredEmptyStateProps {
    title?: string;
    description?: string;
    className?: string;
    fullHeight?: boolean; // When true, fill parent height (e.g., mobile deck container)
}

/**
 * Shared empty state displayed when active filters produce zero matching places.
 * Always includes a reset button to encourage clearing filters.
 */
export function FilteredEmptyState({
    title = "No places match those filters",
    description = "Try widening your search or resetting the filters to see all places again.",
    className,
    fullHeight = false
}: FilteredEmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center text-center gap-4 py-24 px-6 border rounded-xl bg-card/60",
                fullHeight && "h-full",
                className
            )}
        >
            <div className="space-y-2 max-w-md">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="w-40">
                <FilterResetButton variant="outline" />
            </div>
        </div>
    );
}
