"use client";

import React, { useCallback, useState, useEffect, useLayoutEffect, useTransition, useRef } from "react";
import { flushSync } from "react-dom";
import { useDebouncedCallback } from "use-debounce";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuickSearch, useFilters, useFilterData, useSort, useFilterActions } from "@/contexts/FilterContext";
import { DEFAULT_SORT_OPTION } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { SearchablePickerModal } from "@/components/SearchablePickerModal";
import { VirtualizedSelect } from "@/components/VirtualizedSelect";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Icons } from "@/components/Icons";
import { MOBILE_PICKER_FIELDS, SORT_DEFS, SORT_USES_MOBILE_PICKER, DESKTOP_PICKER_FIELDS, MULTI_SELECT_FIELDS, DEFAULT_FILTER_CONFIG } from "@/lib/filters";
import type { FilterKey } from "@/lib/filters";

const maxWidth = "max-w-full";

export function FilterQuickSearch() {
    const { quickFilterText, setQuickFilterText } = useQuickSearch();
    // Local state for immediate input feedback
    const [localValue, setLocalValue] = useState(quickFilterText);
    const [, startTransition] = useTransition();

    // Sync local state when context value changes externally (e.g., reset)
    // Using useLayoutEffect to ensure sync happens before paint, preventing flash on reset
    useLayoutEffect(() => {
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

interface FilterSelectProps {
    field: FilterKey;
    value: string | string[];
    label: string;
    placeholder: string;
    predefinedOrder: string[];
    matchMode?: 'and' | 'or';
    resetSignal?: number;
    onDropdownOpenChange?: (open: boolean) => void;
    onModalClose?: () => void;
    isActivePopover?: boolean;
    anyPopoverOpen?: boolean;
}

export const FilterSelect = React.memo(function FilterSelect({ field, value, label, placeholder, predefinedOrder, matchMode, resetSignal, onDropdownOpenChange, onModalClose, isActivePopover, anyPopoverOpen }: FilterSelectProps) {
    const { setFilters } = useFilters();
    const { getDistinctValues } = useFilterData();
    const isMobile = useIsMobile();
    const [pickerOpen, setPickerOpen] = useState(false);

    const isMultiSelect = MULTI_SELECT_FIELDS.has(field);
    const isDesktopPicker = DESKTOP_PICKER_FIELDS.has(field);
    // Normalize value for comparison
    const singleValue = isMultiSelect ? "" : (value as string);
    const multiValue = isMultiSelect ? (value as string[]) : [];

    // Handler for match mode changes
    const handleMatchModeChange = useCallback(
        (newMode: 'and' | 'or') => {
            setFilters((prevFilters) => {
                if (!prevFilters[field]) return prevFilters;
                return {
                    ...prevFilters,
                    [field]: { ...prevFilters[field], matchMode: newMode },
                };
            });
        },
        [field, setFilters]
    );

    // Close picker when reset signal changes - use useLayoutEffect to prevent flash
    useLayoutEffect(() => {
        setPickerOpen(false);
    }, [resetSignal]);

    useEffect(() => {
        // Only need to track pickerOpen for mobile picker case
        // VirtualizedSelect handles its own onOpenChange callback
        if (onDropdownOpenChange && isMobile && MOBILE_PICKER_FIELDS.has(field)) {
            onDropdownOpenChange(pickerOpen);
        }
    }, [pickerOpen, onDropdownOpenChange, isMobile, field]);

    const handlePickerSelect = (newValue: string) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [field]: { ...prevFilters[field], value: newValue },
        }));
        setPickerOpen(false);
    };

    // Handler for single-select value changes
    // Note: Removed startTransition to prevent race condition with VirtualizedSelect's
    // snapshot pattern. The deferred update caused a 1-2s jank when selecting "All".
    const handleSingleFilterChange = useCallback(
        (newValue: string) => {
            setFilters((prevFilters) => {
                if (!prevFilters[field]) return prevFilters;
                const safeValue = typeof newValue === "string" ? newValue : "all";
                return {
                    ...prevFilters,
                    [field]: { ...prevFilters[field], value: safeValue },
                };
            });
        },
        [field, setFilters]
    );

    // Handler for multi-select value changes
    const handleMultiFilterChange = useCallback(
        (newValue: string[]) => {
            setFilters((prevFilters) => {
                if (!prevFilters[field]) return prevFilters;
                return {
                    ...prevFilters,
                    [field]: { ...prevFilters[field], value: newValue },
                };
            });
        },
        [field, setFilters]
    );

    // Only allow pointer events if this is the active popover or none are open
    const pointerEventsStyle: React.CSSProperties | undefined = (!anyPopoverOpen || isActivePopover)
        ? undefined
        : { pointerEvents: 'none', opacity: 0.7 };

    // Helper to get display text for trigger
    const getDisplayText = (): string => {
        if (isMultiSelect) {
            return multiValue.length === 0 ? placeholder : `${multiValue.length} selected`;
        }
        return singleValue === "all" ? placeholder : singleValue;
    };

    // Helper to determine if trigger should use "active" styling
    const isActiveFilter = isMultiSelect ? multiValue.length > 0 : singleValue !== "all";

    // Detect "active → default" transition to suppress CSS transition during reset
    // This prevents visual jarring when all filters reset simultaneously
    const wasActiveRef = useRef(isActiveFilter);
    const suppressTransition = wasActiveRef.current && !isActiveFilter;
    useLayoutEffect(() => {
        wasActiveRef.current = isActiveFilter;
    }, [isActiveFilter]);

    // Mobile: Use SearchablePickerModal for high-cardinality fields
    if (isMobile && MOBILE_PICKER_FIELDS.has(field)) {
        const handleOpenChange = (open: boolean) => {
            setPickerOpen(open);
            if (!open && onModalClose) {
                setTimeout(onModalClose, 10);
            }
        };

        return (
            <div style={pointerEventsStyle}>
                {/* This is a custom implementation of the same styling seen in select.tsx's SelectTrigger which is the shadcn/ui select built on top of Radix UI. For certain fields, I want my own custom modal with a search bar, built in SearchablePickerModal.tsx, but want it to appear the same as a select. For consistency, the styling here makes it look like any other select but clicking it opens the SearchablePickerModal.*/}
                <button
                    type="button"
                    className={cn(
                        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
                        "focus:outline-hidden focus:ring-0 focus:shadow-none",
                        !isActiveFilter
                            ? "text-muted-foreground font-normal"
                            : "font-bold bg-primary text-primary-foreground"
                    )}
                    onClick={() => setPickerOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={pickerOpen}
                >
                    <span className="truncate flex-1 text-left">{getDisplayText()}</span>
                    <CaretSortIcon className="h-4 w-4 opacity-50 ml-2" />
                </button>
                {pickerOpen && isMultiSelect && (
                    <SearchablePickerModal
                        open={pickerOpen}
                        onOpenChange={handleOpenChange}
                        options={getDistinctValues(field)}
                        value={multiValue}
                        label={label}
                        placeholder={placeholder}
                        onSelect={handleMultiFilterChange}
                        multiple
                        matchMode={matchMode}
                        onMatchModeChange={handleMatchModeChange}
                    />
                )}
                {pickerOpen && !isMultiSelect && (
                    <SearchablePickerModal
                        open={pickerOpen}
                        onOpenChange={handleOpenChange}
                        options={getDistinctValues(field)}
                        value={singleValue}
                        label={label}
                        placeholder={placeholder}
                        onSelect={handlePickerSelect}
                    />
                )}
            </div>
        );
    }

    // Desktop: Use SearchablePickerModal for desktopPicker fields, VirtualizedSelect for others
    if (!isMobile) {
        if (isDesktopPicker) {
            const handleDesktopModalOpenChange = (open: boolean) => {
                setPickerOpen(open);
                if (onDropdownOpenChange) {
                    onDropdownOpenChange(open);
                }
            };

            return (
                <div className={maxWidth} style={pointerEventsStyle}>
                    <button
                        type="button"
                        className={cn(
                            "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
                            // Suppress transition when going from active→default (reset scenario)
                            suppressTransition ? "" : "transition-colors",
                            !isActiveFilter
                                ? "text-muted-foreground font-normal hover:bg-primary/90 hover:text-primary-foreground"
                                : "font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                        onClick={() => setPickerOpen(true)}
                        aria-haspopup="dialog"
                        aria-expanded={pickerOpen}
                    >
                        <span className="truncate flex-1 text-left">{getDisplayText()}</span>
                        <CaretSortIcon className="h-4 w-4 opacity-50 ml-2" />
                    </button>
                    {pickerOpen && isMultiSelect && (
                        <SearchablePickerModal
                            open={pickerOpen}
                            onOpenChange={handleDesktopModalOpenChange}
                            options={getDistinctValues(field)}
                            value={multiValue}
                            label={label}
                            placeholder={placeholder}
                            onSelect={handleMultiFilterChange}
                            multiple
                            matchMode={matchMode}
                            onMatchModeChange={handleMatchModeChange}
                        />
                    )}
                    {pickerOpen && !isMultiSelect && (
                        <SearchablePickerModal
                            open={pickerOpen}
                            onOpenChange={handleDesktopModalOpenChange}
                            options={getDistinctValues(field)}
                            value={singleValue}
                            label={label}
                            placeholder={placeholder}
                            onSelect={handlePickerSelect}
                        />
                    )}
                </div>
            );
        }
        // Desktop non-picker fields use VirtualizedSelect
        if (isMultiSelect) {
            return (
                <div className={maxWidth} style={pointerEventsStyle}>
                    <VirtualizedSelect
                        options={getDistinctValues(field)}
                        value={multiValue}
                        onValueChange={handleMultiFilterChange}
                        placeholder={placeholder}
                        label={label}
                        onOpenChange={onDropdownOpenChange}
                        multiple
                        matchMode={matchMode}
                        onMatchModeChange={handleMatchModeChange}
                    />
                </div>
            );
        }
        return (
            <div className={maxWidth} style={pointerEventsStyle}>
                <VirtualizedSelect
                    options={getDistinctValues(field)}
                    value={singleValue}
                    onValueChange={handleSingleFilterChange}
                    placeholder={placeholder}
                    label={label}
                    onOpenChange={onDropdownOpenChange}
                />
            </div>
        );
    }

    // Mobile low-cardinality fields: use VirtualizedSelect for consistency
    // (Mobile high-cardinality fields already handled above with SearchablePickerModal)
    if (isMultiSelect) {
        return (
            <div className={maxWidth} style={pointerEventsStyle}>
                <VirtualizedSelect
                    options={getDistinctValues(field)}
                    value={multiValue}
                    onValueChange={handleMultiFilterChange}
                    placeholder={placeholder}
                    label={label}
                    onOpenChange={onDropdownOpenChange}
                    multiple
                    matchMode={matchMode}
                    onMatchModeChange={handleMatchModeChange}
                />
            </div>
        );
    }
    return (
        <div className={maxWidth} style={pointerEventsStyle}>
            <VirtualizedSelect
                options={getDistinctValues(field)}
                value={singleValue}
                onValueChange={handleSingleFilterChange}
                placeholder={placeholder}
                label={label}
                onOpenChange={onDropdownOpenChange}
            />
        </div>
    );
});

FilterSelect.displayName = "FilterSelect";

export function FilterResetButton({ disabled, variant, fullWidth = true, className }: { disabled?: boolean; variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"; fullWidth?: boolean; className?: string }) {
    const { resetAll } = useFilterActions();

    const handleResetFilters = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        // Prevent any event bubbling that might affect parent dialogs
        e.preventDefault();
        e.stopPropagation();

        // Use flushSync to force synchronous rendering, eliminating visual lag
        // where selects briefly show stale values before resetting to placeholders
        flushSync(() => {
            resetAll();
        });
    }, [resetAll]);

    return (
        <Button
            className={cn(fullWidth ? "w-full" : "w-auto px-4", className)}
            variant={variant}
            onClick={handleResetFilters}
            disabled={disabled}
        >
            Reset
        </Button>
    );
}

export function SortSelect({ className, onDropdownOpenChange }: { className?: string; onDropdownOpenChange?: (open: boolean) => void }) {
    const { sortOption, setSortOption } = useSort();
    const [pickerOpen, setPickerOpen] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
        // Only need to track pickerOpen for mobile picker case
        // VirtualizedSelect handles its own onOpenChange callback
        if (onDropdownOpenChange && isMobile && SORT_USES_MOBILE_PICKER) {
            onDropdownOpenChange(pickerOpen);
        }
    }, [pickerOpen, onDropdownOpenChange, isMobile]);

    // Note: Removed startTransition to prevent race condition with VirtualizedSelect's
    // frozen snapshot pattern. The deferred update caused first selection to appear
    // unresponsive. useDeferredValue in DataTable provides the non-blocking benefit.
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
    const defaultSortDef = SORT_DEFS.find(d => d.key === defaultSortKey);
    const defaultSortLabel = defaultSortDef?.label ?? "";

    // Mobile: use SearchablePickerModal
    if (isMobile && SORT_USES_MOBILE_PICKER) {
        const isDefaultSort = currentSortKey === defaultSortKey;
        return (
            <div className={cn(maxWidth, className)}>
                <button
                    type="button"
                    className={cn(
                        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-0 focus:shadow-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
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

    // Desktop: use VirtualizedSelect for consistent performance
    return (
        <div className={cn(maxWidth, className)}>
            <VirtualizedSelect
                options={SORT_DEFS.map(d => d.label)}
                value={currentSortDef?.label ?? ""}
                onValueChange={(label) => {
                    const sortDef = SORT_DEFS.find(d => d.label === label);
                    if (sortDef) {
                        handleSortChange(sortDef.key);
                    }
                }}
                placeholder={defaultSortLabel}
                label="Sort By"
                onOpenChange={onDropdownOpenChange}
                showDefaultOption={false}
                defaultValue={defaultSortLabel}
                className="w-60"
            />
        </div>
    );
}

