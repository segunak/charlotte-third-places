"use client";

import { memo, useCallback, useEffect, useRef, useState, useMemo } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

// Constants
const ITEM_HEIGHT = 40; // Slightly taller for touch-friendly buttons
const MAX_VISIBLE_ITEMS = 12;
const LIST_PADDING = 8;

interface VirtualizedPickerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    options: string[];
    value: string;
    label: string;
    placeholder?: string;
    onSelect: (value: string) => void;
}

/**
 * Data passed to each virtualized row for rendering.
 */
interface ItemData {
    options: string[];
    selectedValue: string;
    highlightedIndex: number;
    onSelect: (value: string) => void;
    label: string;
}

/**
 * Memoized row component - must be defined outside VirtualizedPickerModal
 * to prevent recreation on every render (which defeats virtualization).
 */
const VirtualizedItem = memo(function VirtualizedItem({
    index,
    style,
    data,
}: ListChildComponentProps<ItemData>) {
    const { options, selectedValue, highlightedIndex, onSelect, label } = data;

    // Index 0 is "All" (no filter), rest are options
    if (index === 0) {
        const isSelected = selectedValue === "all";
        const isHighlighted = highlightedIndex === index;
        return (
            <div style={style} className="px-2">
                <button
                    type="button"
                    className={cn(
                        "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isSelected
                            ? "bg-primary text-primary-foreground"
                            : isHighlighted
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => onSelect("all")}
                >
                    <span>All</span>
                    {isSelected && <CheckIcon className="h-4 w-4" />}
                </button>
            </div>
        );
    }

    // Regular option items (offset by 1 for "all" row)
    const optionIndex = index - 1;
    const option = options[optionIndex];
    const isSelected = selectedValue === option;
    const isHighlighted = highlightedIndex === index;

    return (
        <div style={style} className="px-2">
            <button
                type="button"
                className={cn(
                    "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isSelected
                        ? "bg-primary text-primary-foreground"
                        : isHighlighted
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => onSelect(option)}
            >
                <span className="truncate pr-2">{option}</span>
                {isSelected && <CheckIcon className="h-4 w-4 shrink-0" />}
            </button>
        </div>
    );
});

/**
 * VirtualizedPickerModal - A modal picker for high-cardinality filter fields
 * that uses react-window virtualization.
 *
 * Used for fields with 300+ options (name, neighborhood, type, tags) where
 * a dropdown would be awkward. The modal provides more space and a better
 * browsing experience for long lists.
 *
 * Performance: Only renders ~12 visible items instead of 300+.
 */
export function VirtualizedPickerModal({
    open,
    onOpenChange,
    options,
    value,
    label,
    onSelect,
}: VirtualizedPickerModalProps) {
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const listRef = useRef<List>(null);

    // Total items = 1 ("all" option) + options.length
    const totalItems = options.length + 1;

    // Calculate list height - cap at MAX_VISIBLE_ITEMS
    const listHeight = Math.min(totalItems, MAX_VISIBLE_ITEMS) * ITEM_HEIGHT + LIST_PADDING * 2;

    // Reset highlight and scroll to selected when opening
    useEffect(() => {
        if (open) {
            if (value === "all") {
                setHighlightedIndex(0);
            } else {
                const optionIndex = options.indexOf(value);
                setHighlightedIndex(optionIndex >= 0 ? optionIndex + 1 : 0);
            }
            // Scroll to selected item after a frame
            requestAnimationFrame(() => {
                if (listRef.current) {
                    const scrollIndex = value === "all" ? 0 : options.indexOf(value) + 1;
                    if (scrollIndex > 0) {
                        listRef.current.scrollToItem(scrollIndex, "center");
                    }
                }
            });
        }
    }, [open, options, value]);

    // Handle selection
    const handleSelect = useCallback(
        (newValue: string) => {
            onSelect(newValue);
            onOpenChange(false);
        },
        [onSelect, onOpenChange]
    );

    // Keyboard navigation
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setHighlightedIndex((prev) => {
                        const next = Math.min(prev + 1, totalItems - 1);
                        listRef.current?.scrollToItem(next, "smart");
                        return next;
                    });
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setHighlightedIndex((prev) => {
                        const next = Math.max(prev - 1, 0);
                        listRef.current?.scrollToItem(next, "smart");
                        return next;
                    });
                    break;
                case "Enter":
                    e.preventDefault();
                    if (highlightedIndex === 0) {
                        handleSelect("all");
                    } else if (highlightedIndex >= 1) {
                        handleSelect(options[highlightedIndex - 1]);
                    }
                    break;
                case "Home":
                    e.preventDefault();
                    setHighlightedIndex(0);
                    listRef.current?.scrollToItem(0, "start");
                    break;
                case "End":
                    e.preventDefault();
                    setHighlightedIndex(totalItems - 1);
                    listRef.current?.scrollToItem(totalItems - 1, "end");
                    break;
                default:
                    // Type-ahead: jump to first item starting with typed character
                    if (e.key.length === 1 && e.key.match(/[a-z0-9]/i)) {
                        const char = e.key.toLowerCase();
                        const matchIndex = options.findIndex((opt) =>
                            opt.toLowerCase().startsWith(char)
                        );
                        if (matchIndex >= 0) {
                            const newIndex = matchIndex + 1;
                            setHighlightedIndex(newIndex);
                            listRef.current?.scrollToItem(newIndex, "smart");
                        }
                    }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, highlightedIndex, options, totalItems, handleSelect]);

    // Memoize item data to prevent unnecessary re-renders of virtualized rows
    const itemData = useMemo<ItemData>(
        () => ({
            options,
            selectedValue: value,
            highlightedIndex,
            onSelect: handleSelect,
            label,
        }),
        [options, value, highlightedIndex, handleSelect, label]
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-md rounded-lg bg-background p-4 w-full max-w-full overflow-hidden"
                onOpenAutoFocus={(e) => e.preventDefault()}
                crossCloseIconSize="h-6 w-6"
                data-filter-context
            >
                <DialogTitle className="text-center w-full mb-3">
                    Select {label}
                </DialogTitle>
                <div
                    className="rounded-md border bg-background overflow-hidden"
                    role="listbox"
                    aria-label={label}
                >
                    <List
                        ref={listRef}
                        height={listHeight}
                        itemCount={totalItems}
                        itemSize={ITEM_HEIGHT}
                        width="100%"
                        itemData={itemData}
                        overscanCount={5}
                    >
                        {VirtualizedItem}
                    </List>
                </div>
            </DialogContent>
        </Dialog>
    );
}
