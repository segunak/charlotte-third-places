"use client";

import { FilterChip } from "@/components/FilterChip";
import { Icons } from "@/components/Icons";
import { SearchablePickerModal } from "@/components/SearchablePickerModal";
import { useFilterData, useFilters } from "@/contexts/FilterContext";
import { FILTER_DEFINITION_MAP } from "@/lib/filters";
import { useCallback, useMemo, useState } from "react";

type RailFilterKey = "neighborhood" | "type" | "tags";

const TYPE_MATCH_MODE_COPY = {
    andLabel: "Has All Types",
    orLabel: "Has Any Type",
    andDescription: "Places must match every selected type",
    orDescription: "Places can match any selected type",
    order: ["or", "and"] as Array<"and" | "or">,
};

interface FilterOptionRailProps {
    field: RailFilterKey;
    label: string;
    featuredValues?: readonly string[];
    onPickerOpenChange?: (open: boolean) => void;
}

export function FilterOptionRail({
    field,
    label,
    featuredValues = [],
    onPickerOpenChange,
}: FilterOptionRailProps) {
    const { filters, setFilters } = useFilters();
    const { getDistinctValues } = useFilterData();
    const [pickerOpen, setPickerOpen] = useState(false);
    const selectedValues = useMemo(() => {
        const value = filters[field].value;
        return Array.isArray(value) ? value : [];
    }, [field, filters]);
    const definition = FILTER_DEFINITION_MAP[field];
    const fixedMatchMode = definition.fixedMatchMode;
    const matchMode = fixedMatchMode ?? filters[field].matchMode ?? definition.defaultMatchMode ?? "and";

    const options = useMemo(
        () => Array.from(new Set(getDistinctValues(field))),
        [field, getDistinctValues]
    );
    const orderedOptions = useMemo(() => {
        const optionSet = new Set(options);
        const featuredSet = new Set<string>(featuredValues);

        return [
            ...featuredValues.filter(value => optionSet.has(value)),
            ...options
                .filter(value => !featuredSet.has(value))
                .sort((firstValue, secondValue) => firstValue.localeCompare(secondValue)),
        ];
    }, [featuredValues, options]);

    const handlePickerOpenChange = useCallback((open: boolean) => {
        setPickerOpen(open);
        onPickerOpenChange?.(open);
    }, [onPickerOpenChange]);

    const setSelectedValues = useCallback((values: string[]) => {
        setFilters(previousFilters => ({
            ...previousFilters,
            [field]: { ...previousFilters[field], value: values },
        }));
    }, [field, setFilters]);

    const toggleValue = useCallback((value: string) => {
        const nextValues = selectedValues.includes(value)
            ? selectedValues.filter(selectedValue => selectedValue !== value)
            : [...selectedValues, value];
        setSelectedValues(nextValues);
    }, [selectedValues, setSelectedValues]);

    const setMatchMode = useCallback((nextMatchMode: "and" | "or") => {
        setFilters(previousFilters => ({
            ...previousFilters,
            [field]: { ...previousFilters[field], matchMode: nextMatchMode },
        }));
    }, [field, setFilters]);

    return (
        <section className="space-y-3" aria-label={label}>
            <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-semibold text-foreground">{label}</h3>
                <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={pickerOpen}
                    className="inline-flex h-8 items-center gap-0.5 px-1 text-sm font-semibold text-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50"
                    onClick={() => handlePickerOpenChange(true)}
                >
                    See all {options.length}
                    <Icons.chevronRight className="h-3.5 w-3.5" />
                </button>
            </div>
            <div
                aria-label={`Scrollable ${label.toLowerCase()} options`}
                className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {orderedOptions.map(value => {
                    const isSelected = selectedValues.includes(value);

                    return (
                        <FilterChip
                            key={value}
                            selected={isSelected}
                            aria-label={value}
                            className="snap-start"
                            onClick={() => toggleValue(value)}
                        >
                            {value}
                        </FilterChip>
                    );
                })}
            </div>
            <SearchablePickerModal
                open={pickerOpen}
                onOpenChange={handlePickerOpenChange}
                options={options}
                value={selectedValues}
                label={label}
                onSelect={setSelectedValues}
                multiple
                matchMode={matchMode}
                onMatchModeChange={fixedMatchMode ? undefined : setMatchMode}
                matchModeHint={definition.fixedMatchModeHint}
                matchModeCopy={field === "type" ? TYPE_MATCH_MODE_COPY : undefined}
            />
        </section>
    );
}