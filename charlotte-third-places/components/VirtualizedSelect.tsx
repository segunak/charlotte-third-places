"use client";

import * as React from "react";
import { FixedSizeList as List } from "react-window";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface VirtualizedSelectProps {
    options: string[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder: string;
    label: string;
    className?: string;
    onOpenChange?: (open: boolean) => void;
}

const ITEM_HEIGHT = 32;
const MAX_VISIBLE_ITEMS = 10;

/**
 * VirtualizedSelect - A high-performance Select component using react-window.
 * 
 * Uses Popover + FixedSizeList for maximum performance:
 * - Only renders visible items (virtualization)
 * - Frozen options pattern prevents flash during close animation
 * - Custom trigger styling for active filter highlighting
 * 
 * The frozen options pattern works by snapshotting the list content when
 * the popover starts closing, preventing re-renders during exit animation.
 */
export function VirtualizedSelect({
    options,
    value,
    onValueChange,
    placeholder,
    label,
    className,
    onOpenChange,
}: VirtualizedSelectProps) {
    const debugEnabled = typeof window !== "undefined" && (window as any).__VS_DEBUG_VIRTUALIZED_SELECT === true;
    const renderCountRef = React.useRef(0);
    const [open, setOpen] = React.useState(false);
    const listRef = React.useRef<List>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const listboxId = React.useId();

    // Frozen snapshot pattern: keep list stable while closing to prevent flash
    // Using refs instead of state for isClosing to avoid race conditions with concurrent state updates
    const closingItemsRef = React.useRef<string[] | null>(null);
    const closingValueRef = React.useRef<string | null>(null);
    const closeAnimationFrameRef = React.useRef<number | null>(null);
    const isClosingRef = React.useRef(false);
    const [frozenTriggerWidth, setFrozenTriggerWidth] = React.useState<number | null>(null);

    // All items: "All" option + actual options
    const allItems = React.useMemo(() => ["all", ...options], [options]);

    const displayItems = isClosingRef.current && closingItemsRef.current
        ? closingItemsRef.current
        : allItems;
    const displayValue = (isClosingRef.current && closingValueRef.current !== null)
        ? closingValueRef.current
        : value;

    renderCountRef.current += 1;
    React.useEffect(() => {
        if (!debugEnabled) return;
        const snapshot = {
            render: renderCountRef.current,
            open,
            value,
            displayValue,
            isClosing: isClosingRef.current,
            frozenTriggerWidth,
            itemsCount: displayItems.length,
        };
        console.log("[VirtualizedSelect] render", snapshot);
    });

    const clearClosingSnapshot = React.useCallback(() => {
        closingItemsRef.current = null;
        closingValueRef.current = null;
        isClosingRef.current = false;
        setFrozenTriggerWidth(null);
        if (debugEnabled) {
            console.log("[VirtualizedSelect] clearClosingSnapshot");
        }
    }, []);

    const beginClose = React.useCallback((snapshotItems: string[], snapshotValue: string) => {
        if (triggerRef.current) {
            setFrozenTriggerWidth(triggerRef.current.getBoundingClientRect().width);
        }
        closingItemsRef.current = snapshotItems;
        closingValueRef.current = snapshotValue;
        isClosingRef.current = true;
        if (debugEnabled) {
            console.log("[VirtualizedSelect] beginClose", {
                snapshotValue,
                snapshotCount: snapshotItems.length,
            });
        }
    }, []);

    // Clear the freeze when the parent's value prop catches up to what we selected.
    // This eliminates the race: we keep showing the frozen value until the parent confirms.
    React.useEffect(() => {
        if (isClosingRef.current && closingValueRef.current !== null) {
            if (value === closingValueRef.current) {
                // Parent caught up, safe to clear
                if (debugEnabled) {
                    console.log("[VirtualizedSelect] value caught up, clearing freeze", { value });
                }
                clearClosingSnapshot();
            }
        }
    }, [value, clearClosingSnapshot]);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (closeAnimationFrameRef.current !== null) {
                cancelAnimationFrame(closeAnimationFrameRef.current);
                closeAnimationFrameRef.current = null;
            }
        };
    }, []);

    const handleOpenChange = (newOpen: boolean) => {
        if (debugEnabled) {
            console.log("[VirtualizedSelect] handleOpenChange", { newOpen });
        }
        if (newOpen) {
            clearClosingSnapshot();
            setOpen(true);
            onOpenChange?.(true);
            return;
        }
        beginClose([...allItems], value);
        setOpen(false);
        onOpenChange?.(false);
    };

    const handleSelect = (selectedValue: string) => {
        if (debugEnabled) {
            console.log("[VirtualizedSelect] handleSelect", { selectedValue, currentValue: value });
        }
        // Freeze to the SELECTED value (destination), not the current value (source).
        // This eliminates the race between snapshot clearing and parent state update.
        beginClose([...allItems], selectedValue);
        onValueChange(selectedValue);
        setOpen(false);
        onOpenChange?.(false);
    };

    // Scroll to selected item when opening
    React.useLayoutEffect(() => {
        if (!open || isClosingRef.current || !listRef.current) {
            return;
        }
        const index = allItems.indexOf(value);
        if (index > 0) {
            listRef.current.scrollToItem(index, "center");
            if (debugEnabled) {
                console.log("[VirtualizedSelect] scrollToItem", { index, value });
            }
        }
    }, [open, value, allItems]);

    const listHeight = Math.min(displayItems.length, MAX_VISIBLE_ITEMS) * ITEM_HEIGHT;

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
                        "transition-colors duration-150",
                        "hover:bg-primary/90 hover:text-primary-foreground",
                        displayValue === "all"
                            ? "text-muted-foreground font-normal"
                            : "font-bold bg-primary text-primary-foreground",
                        className
                    )}
                >
                    <span className="truncate">
                        {displayValue === "all" ? placeholder : displayValue}
                    </span>
                    <CaretSortIcon className="h-4 w-4 opacity-50 ml-2 shrink-0" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className={cn(
                    "w-[var(--radix-popover-trigger-width)] p-0",
                    "data-[state=closed]:duration-0"
                )}
                align="start"
                sideOffset={4}
            >
                {/* Label header */}
                <div className="px-2 py-1.5 text-sm font-semibold border-b">
                    {label}
                </div>
                {/* Virtualized list */}
                <div id={listboxId} role="listbox">
                    <List
                        ref={listRef}
                        height={listHeight}
                        itemCount={displayItems.length}
                        itemSize={ITEM_HEIGHT}
                        width="100%"
                        className="scrollbar-thin"
                    >
                        {({ index, style }) => {
                            const item = displayItems[index];
                            const isSelected = item === displayValue;
                            return (
                                <div
                                    style={style}
                                    className={cn(
                                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 pr-8 text-sm outline-none",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        isSelected && "bg-accent text-accent-foreground"
                                    )}
                                    onClick={() => handleSelect(item)}
                                    role="option"
                                    aria-selected={isSelected}
                                >
                                    <span className="truncate">
                                        {item === "all" ? "All" : item}
                                    </span>
                                    {isSelected && (
                                        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                                            <CheckIcon className="h-4 w-4" />
                                        </span>
                                    )}
                                </div>
                            );
                        }}
                    </List>
                </div>
            </PopoverContent>
        </Popover>
    );
}
