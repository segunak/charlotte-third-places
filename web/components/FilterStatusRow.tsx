"use client";

import { Icons } from "@/components/Icons";
import { useFilteredPlaceSummary } from "@/hooks/useFilteredPlaceSummary";
import { cn } from "@/lib/utils";

interface FilterStatusRowProps {
    className?: string;
}

export function FilterStatusRow({ className }: FilterStatusRowProps) {
    const { appliedFilterCount, openNow, visibleCount } = useFilteredPlaceSummary();
    const filterStatus = `${appliedFilterCount} ${appliedFilterCount === 1 ? "Filter" : "Filters"} Applied`;

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={cn(
                "flex h-9 items-center justify-between border-b border-border/60 px-1 text-xs font-semibold",
                className
            )}
        >
            <span className="flex min-w-0 items-center gap-1.5">
                <Icons.infoCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                {openNow ? (
                    <>
                        <span className="text-emerald-700 dark:text-emerald-300">Open Now</span>
                        {appliedFilterCount > 0 && (
                            <>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-primary">{filterStatus}</span>
                            </>
                        )}
                    </>
                ) : appliedFilterCount > 0 ? (
                    <span className="text-primary">{filterStatus}</span>
                ) : (
                    <span className="text-muted-foreground">All Places</span>
                )}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5">
                <Icons.list className="h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
                <span className="font-bold text-foreground tabular-nums">
                    {visibleCount} {visibleCount === 1 ? "Place" : "Places"}
                </span>
            </span>
        </div>
    );
}