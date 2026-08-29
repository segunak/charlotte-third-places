"use client";

import { Icons } from "@/components/Icons";
import { SearchablePickerModal } from "@/components/SearchablePickerModal";
import { useFilterData, useFilters } from "@/contexts/FilterContext";
import { FILTER_SENTINEL } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { type CSSProperties, useCallback, useState } from "react";

interface PlaceSearchFilterProps {
    onPickerOpenChange?: (open: boolean) => void;
    pickerMaxHeight?: CSSProperties["maxHeight"];
}

export function PlaceSearchFilter({ onPickerOpenChange, pickerMaxHeight }: PlaceSearchFilterProps) {
    const { filters, setFilters } = useFilters();
    const { getDistinctValues } = useFilterData();
    const [pickerOpen, setPickerOpen] = useState(false);
    const selectedPlace = typeof filters.name.value === "string"
        ? filters.name.value
        : FILTER_SENTINEL;
    const hasSelection = selectedPlace !== FILTER_SENTINEL;

    const handlePickerOpenChange = useCallback((open: boolean) => {
        setPickerOpen(open);
        onPickerOpenChange?.(open);
    }, [onPickerOpenChange]);

    const setSelectedPlace = useCallback((value: string) => {
        setFilters(previousFilters => ({
            ...previousFilters,
            name: { ...previousFilters.name, value },
        }));
    }, [setFilters]);

    return (
        <section
            className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-2 max-[359px]:grid-cols-1"
            aria-label="Place Name"
        >
            <h3 className="text-sm font-semibold text-foreground">Place Name</h3>
            <div className={cn(
                "flex h-10 w-full items-center rounded-xl border border-input bg-background shadow-xs",
                hasSelection && "border-primary/50 bg-primary/5"
            )}>
                <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={pickerOpen}
                    className="flex h-full min-w-0 flex-1 items-center gap-2 px-3 text-left text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50"
                    onClick={() => handlePickerOpenChange(true)}
                >
                    <Icons.search className="h-4 w-4 shrink-0 text-primary" />
                    <span className={cn(
                        "min-w-0 flex-1 truncate",
                        hasSelection ? "font-semibold text-foreground" : "text-muted-foreground"
                    )}>
                        {hasSelection ? selectedPlace : "Search Places"}
                    </span>
                    {!hasSelection && <Icons.chevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                </button>
                {hasSelection && (
                    <button
                        type="button"
                        aria-label="Clear place filter"
                        className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50"
                        onClick={() => setSelectedPlace(FILTER_SENTINEL)}
                    >
                        <Icons.close className="h-4 w-4" />
                    </button>
                )}
            </div>
            <SearchablePickerModal
                open={pickerOpen}
                onOpenChange={handlePickerOpenChange}
                options={getDistinctValues("name")}
                value={selectedPlace}
                label="Place"
                title="Choose a Place"
                searchPlaceholder="Search Places"
                defaultOptionLabel="All Places"
                onSelect={setSelectedPlace}
                maxHeight={pickerMaxHeight}
            />
        </section>
    );
}