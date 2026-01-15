"use client";

import React, { useCallback, useState, useEffect, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useQuickSearch, useFilters, useFilterData, useSort } from "@/contexts/FilterContext";
import { SortField, SortDirection, DEFAULT_SORT_OPTION } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { SearchablePickerModal } from "@/components/SearchablePickerModal";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Icons } from "@/components/Icons";
import { MOBILE_PICKER_FIELDS, DESKTOP_PICKER_FIELDS, SORT_DEFS, SORT_USES_MOBILE_PICKER } from "@/lib/filters";
import type { FilterKey } from "@/lib/filters";

const maxWidth = "max-w-full";

export function FilterQuickSearch() {
    const { quickFilterText, setQuickFilterText } = useQuickSearch();
    // Local state for immediate input feedback
    const [localValue, setLocalValue] = useState(quickFilterText);
    const [, startTransition] = useTransition();

    // Sync local state when context value changes externally (e.g., reset)
    useEffect(() => {
        setLocalValue(quickFilterText);
    }, [quickFilterText]);

    // Debounce the context update by 150ms to reduce filtering work during typing
    const debouncedSetQuickFilterText = useDebouncedCallback(
        (value: string) => {
            startTransition(() => {
                setQuickFilterText(value);
            });
        },
        150
    );

    const handleQuickFilterChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value;
            setLocalValue(newValue); // Immediate UI update
            debouncedSetQuickFilterText(newValue); // Debounced context update
        },
        [debouncedSetQuickFilterText]
    );

    return (
        <div className={maxWidth}>
            <div className="relative">
                <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
                <Input
                    type="text"
                    value={localValue}
                    onChange={handleQuickFilterChange}
                    className="w-full pl-10"
                    autoFocus={false}
                    data-testid="quick-search-input"
                />
            </div>
        </div>
    );
}

export function FilterSelect({ field, value, label, placeholder, predefinedOrder, resetSignal, onDropdownOpenChange, onModalClose, isActivePopover, anyPopoverOpen }: {
    field: FilterKey;
    value: string;
    label: string;
    placeholder: string;
    predefinedOrder: string[];
    resetSignal?: number;
    onDropdownOpenChange?: (open: boolean) => void;
    onModalClose?: () => void;
    isActivePopover?: boolean;
    anyPopoverOpen?: boolean;
}) {
    const { setFilters } = useFilters();
    const { getDistinctValues } = useFilterData();
    const isMobile = useIsMobile();
    const [pickerOpen, setPickerOpen] = useState(false);
    const [selectOpen, setSelectOpen] = useState(false);
    const [, startTransition] = useTransition();

    useEffect(() => {
        setPickerOpen(false);
    }, [resetSignal]);

    useEffect(() => {
        if (onDropdownOpenChange) {
            if (isMobile && MOBILE_PICKER_FIELDS.has(field)) {
                onDropdownOpenChange(pickerOpen);
            } else {
                onDropdownOpenChange(selectOpen);
            }
        }
    }, [pickerOpen, selectOpen, onDropdownOpenChange, isMobile, field]);

    const handlePickerSelect = (newValue: string) => {
        startTransition(() => {
            setFilters((prevFilters) => ({
                ...prevFilters,
                [field]: { ...prevFilters[field], value: newValue },
            }));
        });
        setPickerOpen(false);
    };

    const handleFilterChange = useCallback(
        (newValue: string) => {
            startTransition(() => {
                setFilters((prevFilters) => {
                    // Defensive: Only update the intended field, never replace the whole object
                    if (!prevFilters[field]) return prevFilters;
                    // Defensive: Only allow string values
                    const safeValue = typeof newValue === "string" ? newValue : "all";
                    return {
                        ...prevFilters,
                        [field]: { ...prevFilters[field], value: safeValue },
                    };
                });
            });
        },
        [field, setFilters, startTransition]
    );

    // Only allow pointer events if this is the active popover or none are open
    const pointerEventsStyle: React.CSSProperties | undefined = (!anyPopoverOpen || isActivePopover)
        ? undefined
        : { pointerEvents: 'none', opacity: 0.7 };

    // Use searchable picker for:
    // 1. Mobile + high-cardinality fields (MOBILE_PICKER_FIELDS)
    // 2. Desktop + ultra-high-cardinality fields (DESKTOP_PICKER_FIELDS) - e.g., "name" with 60+ unique values
    const usePickerModal = (isMobile && MOBILE_PICKER_FIELDS.has(field)) || DESKTOP_PICKER_FIELDS.has(field);

    if (usePickerModal) {
        return (
            <div style={pointerEventsStyle}>
                {/* This is a custom implementation of the same styling seen in select.tsx's SelectTrigger which is the shadcn/ui select built on top of Radix UI. For certain fields, I want my own custom modal with a search bar, built in SearchablePickerModal.tsx, but want it to appear the same as a select. For consistency, the styling here makes it look like any other select but clicking it opens the SearchablePickerModal.*/}
                <button
                    type="button"
                    className={cn(
                        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
                        isMobile
                            ? "focus:outline-none focus:ring-0 focus:shadow-none"
                            : "hover:bg-primary/90 hover:text-primary-foreground",
                        value === "all"
                            ? "text-muted-foreground font-normal"
                            : "font-bold bg-primary text-primary-foreground"
                    )}
                    onClick={() => setPickerOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={pickerOpen}
                >
                    <span className="truncate flex-1 text-left">{value === 'all' ? placeholder : value}</span>
                    <CaretSortIcon className="h-4 w-4 opacity-50 ml-2" />
                </button>
                {pickerOpen && (
                    <SearchablePickerModal
                        open={pickerOpen}
                        onOpenChange={(open) => {
                            setPickerOpen(open);
                            if (!open && onModalClose) {
                                setTimeout(onModalClose, 10);
                            }
                        }}
                        options={getDistinctValues(field)}
                        value={value}
                        label={label}
                        placeholder={placeholder}
                        onSelect={handlePickerSelect}
                    />
                )}
            </div>
        );
    }

    // Desktop (and low-cardinality mobile): use native Select with lazy-rendered items
    // Items are only rendered when dropdown is open, avoiding 60+ SelectItem renders on state changes
    const isHighCardinality = MOBILE_PICKER_FIELDS.has(field);
    return (
        <div className={maxWidth} style={pointerEventsStyle}>
            <Select
                key={field}
                value={value}
                onValueChange={handleFilterChange}
                onOpenChange={setSelectOpen}
            >
                <SelectTrigger
                    className={cn(
                        "w-full",
                        isMobile
                            ? "focus:outline-none focus:ring-0 focus:shadow-none"
                            : "hover:bg-primary/90 hover:text-primary-foreground",
                        (value === 'all')
                            ? "text-muted-foreground font-normal"
                            : "font-bold bg-primary text-primary-foreground"
                    )}
                >
                    <SelectValue placeholder={placeholder}>
                        {value === 'all' ? placeholder : value}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent position="popper" side="top">
                    <SelectGroup>
                        <SelectLabel>{label}</SelectLabel>
                        <SelectItem value="all">Don't Filter By {label}</SelectItem>
                        {/* Lazy render: only mount SelectItems when dropdown is open for high-cardinality fields */}
                        {(!isHighCardinality || selectOpen) && getDistinctValues(field).map((item: string) => (
                            <SelectItem key={item} value={item}>
                                {item}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}

export function FilterResetButton({ disabled, variant, fullWidth = true }: { disabled?: boolean; variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"; fullWidth?: boolean }) {
    const { setFilters } = useFilters();
    const { setQuickFilterText } = useQuickSearch();
    const { setSortOption } = useSort();
    const [, startTransition] = useTransition();

    const handleResetFilters = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        // Prevent any event bubbling that might affect parent dialogs
        e.preventDefault();
        e.stopPropagation();

        // Use startTransition to mark reset as non-urgent, preventing UI blocking
        startTransition(() => {
            setFilters((prevFilters) => {
                const resetFilters = { ...prevFilters };
                Object.keys(resetFilters).forEach((key) => {
                    // Uniform reset: set every single-select filter back to 'all' (sentinel meaning no constraint)
                    (resetFilters as any)[key].value = "all";
                });
                return resetFilters;
            });

            setQuickFilterText("");
            setSortOption(DEFAULT_SORT_OPTION);
        });
    }, [setFilters, setQuickFilterText, setSortOption]);

    return (
        <div className={maxWidth}>
            <Button
                className={cn(fullWidth ? "w-full" : "w-auto px-4")}
                variant={variant}
                onClick={handleResetFilters}
                disabled={disabled}
            >
                Reset
            </Button>
        </div>
    );
}

export function SortSelect({ className, onDropdownOpenChange }: { className?: string; onDropdownOpenChange?: (open: boolean) => void }) {
    const { sortOption, setSortOption } = useSort();
    const [selectOpen, setSelectOpen] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
        if (onDropdownOpenChange) {
            if (isMobile && SORT_USES_MOBILE_PICKER) {
                onDropdownOpenChange(pickerOpen);
            } else {
                onDropdownOpenChange(selectOpen);
            }
        }
    }, [selectOpen, pickerOpen, onDropdownOpenChange, isMobile]);

    const handleSortChange = useCallback(
        (value: string) => {
            const sortDef = SORT_DEFS.find(d => d.key === value);
            if (sortDef) {
                setSortOption({
                    field: sortDef.field,
                    direction: sortDef.direction,
                });
            }
        },
        [setSortOption]
    );

    const currentSortKey = `${sortOption.field}-${sortOption.direction}`;
    const currentSortDef = SORT_DEFS.find(d => d.key === currentSortKey);
    const placeholderText = currentSortDef?.label ?? "Sort by...";
    const defaultSortKey = `${DEFAULT_SORT_OPTION.field}-${DEFAULT_SORT_OPTION.direction}`;
    const isDefaultSort = currentSortKey === defaultSortKey;

    // Mobile: use SearchablePickerModal
    if (isMobile && SORT_USES_MOBILE_PICKER) {
        return (
            <div className={cn(maxWidth, className)}>
                <button
                    type="button"
                    className={cn(
                        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:shadow-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
                        isDefaultSort
                            ? "text-muted-foreground font-normal"
                            : "font-bold bg-primary text-primary-foreground"
                    )}
                    onClick={() => setPickerOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={pickerOpen}
                >
                    <span className="truncate flex-1 text-left">{placeholderText}</span>
                    <CaretSortIcon className="h-4 w-4 opacity-50 ml-2" />
                </button>
                {pickerOpen && (
                    <SearchablePickerModal
                        open={pickerOpen}
                        onOpenChange={setPickerOpen}
                        options={SORT_DEFS.map(d => d.label)}
                        value={currentSortDef?.label ?? ""}
                        label="Sort"
                        onSelect={handleSortChange}
                        showSearch={false}
                        showDefaultOption={false}
                        title="Sort By"
                        optionKey={(label) => SORT_DEFS.find(d => d.label === label)?.key ?? ""}
                    />
                )}
            </div>
        );
    }

    // Desktop: use standard Select
    return (
        <div className={cn(maxWidth, className)}>
            <Select
                value={currentSortKey}
                onValueChange={handleSortChange}
                onOpenChange={setSelectOpen}
            >
                <SelectTrigger
                    className={cn(
                        "w-full",
                        isMobile
                            ? "focus:outline-none focus:ring-0 focus:shadow-none"
                            : "hover:bg-primary/90 hover:text-primary-foreground"
                    )}
                >
                    <SelectValue placeholder={placeholderText}>
                        {placeholderText}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Sort By</SelectLabel>
                        {SORT_DEFS.map((def) => (
                            <SelectItem key={def.key} value={def.key}>
                                {def.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}

