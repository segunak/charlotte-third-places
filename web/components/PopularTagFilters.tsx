"use client";

import { FilterChip } from "@/components/FilterChip";
import { Icons } from "@/components/Icons";
import { SearchablePickerModal } from "@/components/SearchablePickerModal";
import { useFilterData, useFilters } from "@/contexts/FilterContext";
import { FEATURED_FILTER_VALUES } from "@/lib/filters";
import React, { useCallback, useState } from "react";

const FEATURED_TAGS = FEATURED_FILTER_VALUES.tags?.slice(0, 3) ?? [];

interface PopularTagFiltersProps {
    className?: string;
}

export const PopularTagFilters = React.memo(function PopularTagFilters({
    className,
}: PopularTagFiltersProps) {
    const { filters, setFilters } = useFilters();
    const { getDistinctValues } = useFilterData();
    const [allTagsOpen, setAllTagsOpen] = useState(false);
    const selectedTags = Array.isArray(filters.tags.value) ? filters.tags.value : [];
    const tagOptions = Array.from(new Set(getDistinctValues("tags")));
    const popularTagValues = new Set<string>(FEATURED_TAGS);
    const otherSelectedCount = selectedTags.filter(tag => !popularTagValues.has(tag)).length;

    const toggleTag = useCallback((tag: string) => {
        setFilters((prevFilters) => {
            const currentTags = Array.isArray(prevFilters.tags.value) ? prevFilters.tags.value : [];
            const nextTags = currentTags.includes(tag)
                ? currentTags.filter(currentTag => currentTag !== tag)
                : [...currentTags, tag];

            return {
                ...prevFilters,
                tags: { ...prevFilters.tags, value: nextTags },
            };
        });
    }, [setFilters]);

    const setSelectedTags = useCallback((tags: string[]) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            tags: { ...prevFilters.tags, value: tags },
        }));
    }, [setFilters]);

    const setMatchMode = useCallback((matchMode: "and" | "or") => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            tags: { ...prevFilters.tags, matchMode },
        }));
    }, [setFilters]);

    const handlePickerOpenChange = useCallback((open: boolean) => {
        setAllTagsOpen(open);
    }, []);

    const picker = (
        <SearchablePickerModal
            open={allTagsOpen}
            onOpenChange={handlePickerOpenChange}
            options={tagOptions}
            value={selectedTags}
            label="Tags"
            placeholder="Tags"
            onSelect={setSelectedTags}
            multiple
            matchMode={filters.tags.matchMode ?? "and"}
            onMatchModeChange={setMatchMode}
        />
    );

    return (
        <fieldset className={`rounded-xl border border-border bg-muted/20 px-2.5 pb-2.5 ${className ?? ""}`}>
            <legend className="mx-auto bg-card px-2 text-sm font-semibold text-foreground">Tags</legend>
            <div aria-label="Quick tag filters" className="grid w-full grid-cols-2 gap-2 pt-1">
                {FEATURED_TAGS.map((value) => {
                    const isSelected = selectedTags.includes(value);

                    return (
                        <FilterChip
                            key={value}
                            selected={isSelected}
                            aria-label={value}
                            className="w-full min-w-0 shrink justify-center text-xs"
                            onClick={() => toggleTag(value)}
                        >
                            {value}
                        </FilterChip>
                    );
                })}
                <FilterChip
                    aria-haspopup="dialog"
                    aria-expanded={allTagsOpen}
                    aria-label={otherSelectedCount > 0
                        ? `More Tags, ${otherSelectedCount} other selected`
                        : "More Tags"
                    }
                    className={otherSelectedCount > 0
                        ? "w-full min-w-0 shrink justify-center border-primary bg-primary/10 text-xs text-foreground"
                        : "w-full min-w-0 shrink justify-center text-xs"
                    }
                    onClick={() => handlePickerOpenChange(true)}
                >
                    {otherSelectedCount > 0 ? `More Tags (${otherSelectedCount})` : "More Tags"}
                    <Icons.chevronRight className="ml-0.5 h-3 w-3 text-muted-foreground" />
                </FilterChip>
            </div>
            {picker}
        </fieldset>
    );
});

PopularTagFilters.displayName = "PopularTagFilters";