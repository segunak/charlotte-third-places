"use client";

import { Icons } from "@/components/Icons";
import { SearchablePickerModal } from "@/components/SearchablePickerModal";
import { useFilterData, useFilters } from "@/contexts/FilterContext";
import { FILTER_DEFINITION_MAP } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";

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
    layout?: "inline" | "stacked" | "fieldset";
    pickerMaxHeight?: CSSProperties["maxHeight"];
}

export function FilterOptionRail({
    field,
    label,
    featuredValues = [],
    onPickerOpenChange,
    layout = "inline",
    pickerMaxHeight,
}: FilterOptionRailProps) {
    const { filters, setFilters } = useFilters();
    const { getDistinctValues } = useFilterData();
    const [pickerOpen, setPickerOpen] = useState(false);
    const railRef = useRef<HTMLDivElement>(null);
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
        const selectedOptions = Array.from(new Set(selectedValues))
            .filter(value => optionSet.has(value));
        const selectedOptionSet = new Set(selectedOptions);
        const featuredOptions = Array.from(new Set(featuredValues))
            .filter(value => optionSet.has(value) && !selectedOptionSet.has(value));
        const featuredOptionSet = new Set(featuredOptions);
        const remainingOptions = options
            .filter(value => !selectedOptionSet.has(value) && !featuredOptionSet.has(value))
            .sort((first, second) => first.localeCompare(second));

        return [...selectedOptions, ...featuredOptions, ...remainingOptions];
    }, [featuredValues, options, selectedValues]);
    const hasSelection = selectedValues.length > 0;
    const displayCount = hasSelection ? selectedValues.length : options.length;
    const usesFieldset = layout === "fieldset";
    const Container = usesFieldset ? "fieldset" : "section";
    const Label = usesFieldset ? "legend" : "h3";

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
        setFilters(previousFilters => {
            const currentValue = previousFilters[field].value;
            const currentValues = Array.isArray(currentValue) ? currentValue : [];
            const nextValues = currentValues.includes(value)
                ? currentValues.filter(selectedValue => selectedValue !== value)
                : [...currentValues, value];

            return {
                ...previousFilters,
                [field]: { ...previousFilters[field], value: nextValues },
            };
        });
    }, [field, setFilters]);

    const setMatchMode = useCallback((nextMatchMode: "and" | "or") => {
        setFilters(previousFilters => ({
            ...previousFilters,
            [field]: { ...previousFilters[field], matchMode: nextMatchMode },
        }));
    }, [field, setFilters]);

    useEffect(() => {
        if (railRef.current) {
            railRef.current.scrollLeft = 0;
        }
    }, [selectedValues]);

    return (
        <Container
            className={cn(
                usesFieldset
                    ? "w-full min-w-0 rounded-xl border border-border bg-muted/20 px-2.5 pb-2.5"
                    : layout === "stacked"
                        ? "space-y-2"
                        : "grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-2 max-[359px]:grid-cols-1"
            )}
            aria-label={label}
        >
            <Label className={cn(
                "text-sm font-semibold text-foreground",
                usesFieldset && "mx-auto bg-card px-2"
            )}>{label}</Label>
            <div
                className={cn(
                    "flex h-10 w-full min-w-0 items-center overflow-hidden rounded-xl border border-input bg-background shadow-xs",
                    usesFieldset && "mt-1",
                    hasSelection && "border-primary/50 bg-primary/5"
                )}
            >
                <div className="relative min-w-0 flex-1 self-stretch overflow-hidden">
                    <div
                        role="group"
                        aria-label={`${label} options`}
                        ref={railRef}
                        data-filter-option-rail=""
                        data-vaul-no-drag=""
                        className="h-full overflow-x-auto overscroll-x-contain [scrollbar-width:none] touch-pan-x touch-pan-y [&::-webkit-scrollbar]:hidden"
                    >
                        <div className="flex h-full min-w-max items-center gap-1.5 px-2 pr-8">
                            {orderedOptions.map(value => {
                                const selected = selectedValues.includes(value);

                                return (
                                    <button
                                        type="button"
                                        key={value}
                                        aria-pressed={selected}
                                        className={cn(
                                            "inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-full border px-2 text-[11px] font-medium focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50",
                                            selected
                                                ? "border-primary/30 bg-primary/10 text-primary"
                                                : "border-border/70 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                        )}
                                        onClick={() => toggleValue(value)}
                                    >
                                        {value}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <span className={cn(
                        "pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-r from-transparent",
                        hasSelection ? "to-primary/5" : "to-background"
                    )} />
                </div>
                <button
                    type="button"
                    aria-label={`${label}: ${hasSelection ? `${displayCount} selected` : `${displayCount} options`}`}
                    aria-haspopup="dialog"
                    aria-expanded={pickerOpen}
                    className={cn(
                        "relative z-10 flex h-full shrink-0 items-center gap-1 pl-2 pr-3 text-xs font-medium text-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50",
                        hasSelection ? "bg-primary/5" : "bg-background"
                    )}
                    onClick={() => handlePickerOpenChange(true)}
                >
                    <span className="tabular-nums">{displayCount}</span>
                    <Icons.chevronRight className="h-3.5 w-3.5" />
                </button>
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
                maxHeight={pickerMaxHeight}
            />
        </Container>
    );
}