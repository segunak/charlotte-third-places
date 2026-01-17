"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CaretSortIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon, Cross2Icon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// Base props shared between single and multi-select modes
interface BaseVirtualizedSelectProps {
    options: string[];
    placeholder: string;
    label: string;
    className?: string;
    onOpenChange?: (open: boolean) => void;
    /** Enable search input to filter options */
    searchable?: boolean;
}

// Single-select mode props
interface SingleSelectProps extends BaseVirtualizedSelectProps {
    multiple?: false;
    value: string;
    onValueChange: (value: string) => void;
    /** Whether to show the "All" default option (default: true) */
    showDefaultOption?: boolean;
    /** The default/unselected value for styling purposes. When value matches this, trigger shows placeholder styling. */
    defaultValue?: string;
}

// Multi-select mode props
interface MultiSelectProps extends BaseVirtualizedSelectProps {
    multiple: true;
    value: string[];
    onValueChange: (value: string[]) => void;
    /** showDefaultOption is ignored for multi-select (no "All" option) */
    showDefaultOption?: never;
    defaultValue?: never;
    /** Match mode for multi-select: 'and' (must have all) or 'or' (any match) */
    matchMode?: 'and' | 'or';
    /** Callback when match mode changes */
    onMatchModeChange?: (mode: 'and' | 'or') => void;
}

type VirtualizedSelectProps = SingleSelectProps | MultiSelectProps;

const ITEM_HEIGHT = 32;
const MAX_VISIBLE_ITEMS = 10;
// Width calculation constants
const CHAR_WIDTH = 9; // Character width for 14px Inter font
const BASE_PADDING = 56; // px-2 (8px) + pr-8 (32px for checkmark) + buffer (16px)
const CHECKBOX_WIDTH = 28; // Checkbox (16px) + margin-right (8px) + buffer (4px)
const MIN_CONTENT_WIDTH = 200;
// No max - let content determine width, constrained only by viewport via collisionPadding

/**
 * VirtualizedSelect - A high-performance Select component using TanStack Virtual.
 * 
 * Features:
 * - Virtualization: Only renders visible items for 60fps with 1000+ items
 * - Single-select mode: Traditional dropdown with optional "All" option
 * - Multi-select mode: Checkbox list with count badge, stays open on selection
 * - Searchable mode: Filter options with search input
 * - Frozen options pattern: Prevents flash during close animation
 * - Custom trigger styling: Active filter highlighting
 */
export function VirtualizedSelect(props: VirtualizedSelectProps) {
    const {
        options,
        placeholder,
        label,
        className,
        onOpenChange,
        searchable = false,
        multiple = false,
    } = props;

    const [open, setOpen] = React.useState(false);
    const [searchText, setSearchText] = React.useState("");
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const listboxId = React.useId();

    // Type guards for value handling
    const isMultiple = multiple === true;
    const singleValue = isMultiple ? "" : (props as SingleSelectProps).value;
    const multiValue = React.useMemo(
        () => isMultiple ? (props as MultiSelectProps).value : [],
        [isMultiple, props]
    );
    const showDefaultOption = !isMultiple && ((props as SingleSelectProps).showDefaultOption ?? true);
    const defaultValue = !isMultiple ? (props as SingleSelectProps).defaultValue : undefined;

    // Frozen snapshot pattern: keep list stable while closing to prevent flash
    const closingItemsRef = React.useRef<string[] | null>(null);
    const closingValueRef = React.useRef<string | string[] | null>(null);
    const isClosingRef = React.useRef(false);
    const [frozenTriggerWidth, setFrozenTriggerWidth] = React.useState<number | null>(null);

    // Build item list: optionally "All" + options (filtered by search if enabled)
    const baseItems = React.useMemo(() => {
        if (isMultiple) {
            // Multi-select: no "All" option
            return options;
        }
        return showDefaultOption ? ["all", ...options] : options;
    }, [options, showDefaultOption, isMultiple]);

    // Filter items by search text
    const filteredItems = React.useMemo(() => {
        if (!searchText.trim()) return baseItems;
        const lowerSearch = searchText.toLowerCase();
        return baseItems.filter(item => 
            item === "all" || item.toLowerCase().includes(lowerSearch)
        );
    }, [baseItems, searchText]);

    const displayItems = isClosingRef.current && closingItemsRef.current
        ? closingItemsRef.current
        : filteredItems;

    const displayValue = (isClosingRef.current && closingValueRef.current !== null)
        ? closingValueRef.current
        : (isMultiple ? multiValue : singleValue);

    const clearClosingSnapshot = React.useCallback(() => {
        closingItemsRef.current = null;
        closingValueRef.current = null;
        isClosingRef.current = false;
        setFrozenTriggerWidth(null);
    }, []);

    const beginClose = React.useCallback((snapshotItems: string[], snapshotValue: string | string[]) => {
        if (triggerRef.current) {
            setFrozenTriggerWidth(triggerRef.current.getBoundingClientRect().width);
        }
        closingItemsRef.current = snapshotItems;
        closingValueRef.current = snapshotValue;
        isClosingRef.current = true;
    }, []);

    // Clear the freeze when the parent's value prop catches up
    // Using useLayoutEffect to ensure snapshot clears before paint, preventing flash on reset
    React.useLayoutEffect(() => {
        if (isClosingRef.current && closingValueRef.current !== null) {
            const currentValue = isMultiple ? multiValue : singleValue;
            if (JSON.stringify(currentValue) === JSON.stringify(closingValueRef.current)) {
                clearClosingSnapshot();
            }
        }
    }, [singleValue, multiValue, isMultiple, clearClosingSnapshot]);

    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            clearClosingSnapshot();
            setSearchText("");
            setOpen(true);
            onOpenChange?.(true);
            return;
        }
        const currentValue = isMultiple ? multiValue : singleValue;
        beginClose([...filteredItems], currentValue);
        setOpen(false);
        onOpenChange?.(false);
    };

    // Single-select: select and close
    const handleSingleSelect = React.useCallback((selectedValue: string) => {
        if (isMultiple) return;
        beginClose([...filteredItems], selectedValue);
        (props as SingleSelectProps).onValueChange(selectedValue);
        setOpen(false);
        onOpenChange?.(false);
    }, [isMultiple, filteredItems, beginClose, props, onOpenChange]);

    // Multi-select: toggle item in array
    const handleMultiToggle = React.useCallback((item: string) => {
        if (!isMultiple) return;
        const currentValue = (props as MultiSelectProps).value;
        const newValue = currentValue.includes(item)
            ? currentValue.filter(v => v !== item)
            : [...currentValue, item];
        (props as MultiSelectProps).onValueChange(newValue);
    }, [isMultiple, props]);

    // Multi-select: clear all
    const handleClearAll = React.useCallback(() => {
        if (!isMultiple) return;
        (props as MultiSelectProps).onValueChange([]);
    }, [isMultiple, props]);

    const handleSelect = React.useCallback((item: string) => {
        if (isMultiple) {
            handleMultiToggle(item);
        } else {
            handleSingleSelect(item);
        }
    }, [isMultiple, handleMultiToggle, handleSingleSelect]);

    const listHeight = Math.min(displayItems.length, MAX_VISIBLE_ITEMS) * ITEM_HEIGHT;
    const hasScrollButtons = displayItems.length > MAX_VISIBLE_ITEMS;

    // TanStack Virtual virtualizer
    const virtualizer = useVirtualizer({
        count: displayItems.length,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: () => ITEM_HEIGHT,
        overscan: 5,
    });

    // Re-measure virtualizer when popover opens to ensure items render
    // Using useEffect instead of useLayoutEffect to avoid blocking paint
    React.useEffect(() => {
        if (open && !isClosingRef.current) {
            // Delay to ensure DOM is ready after popover animation
            const timer = setTimeout(() => {
                virtualizer.measure();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [open, virtualizer]);

    // Scroll to selected item when opening (single-select only)
    // Using useEffect instead of useLayoutEffect to avoid blocking paint
    React.useEffect(() => {
        if (!open || isClosingRef.current || isMultiple) {
            return;
        }
        const index = baseItems.indexOf(singleValue);
        if (index > 0) {
            // Delay scroll to ensure measurement happened first
            setTimeout(() => {
                virtualizer.scrollToIndex(index, { align: "center" });
            }, 10);
        }
    }, [open, singleValue, baseItems, virtualizer, isMultiple]);

    // Focus search input when opening
    React.useEffect(() => {
        if (open && searchable && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [open, searchable]);

    // Refs for scroll buttons to avoid re-renders on scroll
    const scrollUpButtonRef = React.useRef<HTMLButtonElement>(null);
    const scrollDownButtonRef = React.useRef<HTMLButtonElement>(null);

    const updateScrollButtonVisibility = React.useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const maxScroll = container.scrollHeight - container.clientHeight;
        const canScrollUp = container.scrollTop > 0;
        const canScrollDown = container.scrollTop < maxScroll - 1;
        
        if (scrollUpButtonRef.current) {
            scrollUpButtonRef.current.style.display = canScrollUp ? 'flex' : 'none';
        }
        if (scrollDownButtonRef.current) {
            scrollDownButtonRef.current.style.display = canScrollDown ? 'flex' : 'none';
        }
    }, []);

    const handleScroll = React.useCallback(() => {
        updateScrollButtonVisibility();
    }, [updateScrollButtonVisibility]);

    React.useEffect(() => {
        if (open && hasScrollButtons) {
            // Initial state: can't scroll up, can scroll down
            if (scrollUpButtonRef.current) {
                scrollUpButtonRef.current.style.display = 'none';
            }
            if (scrollDownButtonRef.current) {
                scrollDownButtonRef.current.style.display = 'flex';
            }
        }
    }, [open, hasScrollButtons]);

    const scrollUp = React.useCallback(() => {
        scrollContainerRef.current?.scrollBy({ top: -ITEM_HEIGHT * 3, behavior: 'smooth' });
    }, []);

    const scrollDown = React.useCallback(() => {
        scrollContainerRef.current?.scrollBy({ top: ITEM_HEIGHT * 3, behavior: 'smooth' });
    }, []);

    // Calculate width based on longest item
    // Multi-select needs extra width for checkbox
    const contentWidth = React.useMemo(() => {
        const longestItem = displayItems.reduce(
            (max, item) => (item.length > max.length ? item : max),
            ""
        );
        const checkboxExtra = isMultiple ? CHECKBOX_WIDTH : 0;
        const calculatedWidth = longestItem.length * CHAR_WIDTH + BASE_PADDING + checkboxExtra;
        return Math.max(calculatedWidth, MIN_CONTENT_WIDTH);
    }, [displayItems, isMultiple]);

    // Determine trigger display text and styling
    // Uses optimistic UI pattern: during close, derive from snapshot to prevent jank
    const getTriggerDisplay = (): { text: string; isDefault: boolean } => {
        // Always use displayValue which is snapshot-aware
        if (isMultiple) {
            const vals = displayValue as string[];
            const count = vals.length;
            if (count === 0) {
                return { text: placeholder, isDefault: true };
            }
            return { text: `${count} selected`, isDefault: false };
        }
        // Single-select: use displayValue (snapshot during close, prop otherwise)
        const val = displayValue as string;
        const isDefault = showDefaultOption
            ? val === "all"
            : defaultValue !== undefined && val === defaultValue;
        return {
            text: isDefault ? placeholder : val,
            isDefault,
        };
    };

    const { text: triggerText, isDefault: isDefaultState } = getTriggerDisplay();

    // Detect "active → default" transition to suppress CSS transition during reset
    // This prevents visual jarring when all filters reset simultaneously
    const wasActiveRef = React.useRef(!isDefaultState);
    const suppressTransition = wasActiveRef.current && isDefaultState;
    React.useLayoutEffect(() => {
        wasActiveRef.current = !isDefaultState;
    }, [isDefaultState]);

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <button
                    ref={triggerRef}
                    role="combobox"
                    aria-controls={listboxId}
                    aria-expanded={open}
                    aria-haspopup="listbox"
                    style={frozenTriggerWidth ? { width: `${frozenTriggerWidth}px` } : undefined}
                    className={cn(
                        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                        // Suppress transition when going from active→default (reset scenario)
                        // to prevent visual jarring when all filters reset simultaneously
                        suppressTransition ? "" : "transition-colors duration-150",
                        "hover:bg-primary/90 hover:text-primary-foreground",
                        isDefaultState
                            ? "text-muted-foreground font-normal"
                            : "font-bold bg-primary text-primary-foreground",
                        className
                    )}
                >
                    <span className="truncate">{triggerText}</span>
                    <CaretSortIcon className="h-4 w-4 opacity-50 ml-2 shrink-0" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className={cn("p-0", "data-[state=closed]:duration-0")}
                style={{
                    width: contentWidth,
                    minWidth: triggerRef.current?.getBoundingClientRect().width ?? 'auto'
                }}
                align="start"
                side="bottom"
                sideOffset={4}
                avoidCollisions={true}
                collisionPadding={{ top: 16, bottom: 16, left: 16, right: 16 }}
                sticky="partial"
            >
                {/* Label header */}
                <div className="px-2 py-1.5 text-sm font-semibold border-b whitespace-nowrap">
                    {label}
                </div>

                {/* Multi-select controls: Match mode chips + Clear all */}
                {isMultiple && (props as MultiSelectProps).onMatchModeChange && (
                    <div className="px-2 py-1.5 border-b flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Match:</span>
                            <button
                                type="button"
                                onClick={() => (props as MultiSelectProps).onMatchModeChange?.('and')}
                                className={cn(
                                    "px-2 py-0.5 text-xs rounded-md border transition-colors",
                                    ((props as MultiSelectProps).matchMode ?? 'and') === 'and'
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-transparent text-muted-foreground border-input hover:bg-accent"
                                )}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => (props as MultiSelectProps).onMatchModeChange?.('or')}
                                className={cn(
                                    "px-2 py-0.5 text-xs rounded-md border transition-colors",
                                    (props as MultiSelectProps).matchMode === 'or'
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-transparent text-muted-foreground border-input hover:bg-accent"
                                )}
                            >
                                Any
                            </button>
                        </div>
                        {multiValue.length > 0 && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                            >
                                <Cross2Icon className="h-3 w-3" />
                                Clear
                            </button>
                        )}
                    </div>
                )}

                {/* Search input */}
                {searchable && (
                    <div className="px-2 py-1.5 border-b">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Search..."
                                className="w-full pl-8 pr-2 py-1 text-sm bg-transparent border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                    </div>
                )}

                {/* Scroll up button - visibility controlled by ref, not state */}
                {hasScrollButtons && (
                    <button
                        ref={scrollUpButtonRef}
                        type="button"
                        className="cursor-default items-center justify-center py-1 w-full hover:bg-accent"
                        style={{ display: 'none' }}
                        onClick={scrollUp}
                        aria-hidden="true"
                    >
                        <ChevronUpIcon className="h-4 w-4" />
                    </button>
                )}

                {/* Empty state */}
                {displayItems.length === 0 && (
                    <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                        No results found
                    </div>
                )}

                {/* Virtualized list */}
                {displayItems.length > 0 && (
                    <div
                        id={listboxId}
                        role="listbox"
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="scrollbar-none"
                        style={{
                            height: listHeight,
                            width: contentWidth,
                            overflow: 'auto',
                            scrollbarWidth: 'none',
                            overscrollBehavior: 'contain',
                        }}
                    >
                        <div
                            style={{
                                height: virtualizer.getTotalSize(),
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {virtualizer.getVirtualItems().map((virtualRow) => {
                                const item = displayItems[virtualRow.index];
                                const isSelected = isMultiple
                                    ? (displayValue as string[]).includes(item)
                                    : item === displayValue;

                                return (
                                    <div
                                        key={virtualRow.key}
                                        data-index={virtualRow.index}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                        className={cn(
                                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 pr-8 text-sm outline-none",
                                            "hover:bg-accent hover:text-accent-foreground",
                                            isSelected && "bg-accent text-accent-foreground"
                                        )}
                                        onClick={() => handleSelect(item)}
                                        role="option"
                                        aria-selected={isSelected}
                                    >
                                        {isMultiple && (
                                            <span className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded border",
                                                isSelected ? "bg-primary border-primary" : "border-input"
                                            )}>
                                                {isSelected && <CheckIcon className="h-3 w-3 text-primary-foreground" />}
                                            </span>
                                        )}
                                        <span className="truncate">
                                            {item === "all" ? "All" : item}
                                        </span>
                                        {!isMultiple && isSelected && (
                                            <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                                                <CheckIcon className="h-4 w-4" />
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Scroll down button - visibility controlled by ref, not state */}
                {hasScrollButtons && (
                    <button
                        ref={scrollDownButtonRef}
                        type="button"
                        className="cursor-default items-center justify-center py-1 w-full hover:bg-accent"
                        style={{ display: 'flex' }}
                        onClick={scrollDown}
                        aria-hidden="true"
                    >
                        <ChevronDownIcon className="h-4 w-4" />
                    </button>
                )}
            </PopoverContent>
        </Popover>
    );
}
