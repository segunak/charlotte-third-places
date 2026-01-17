"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
 * VirtualizedPickerModal - A modal picker for high-cardinality filter fields
 * that uses TanStack Virtual for virtualization.
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
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Total items = 1 ("all" option) + options.length
    const totalItems = options.length + 1;

    // Calculate list height - cap at MAX_VISIBLE_ITEMS
    const listHeight = Math.min(totalItems, MAX_VISIBLE_ITEMS) * ITEM_HEIGHT + LIST_PADDING * 2;

    // TanStack Virtual virtualizer
    const virtualizer = useVirtualizer({
        count: totalItems,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: () => ITEM_HEIGHT,
        overscan: 5,
    });

    // NOTE: We intentionally access options, value, and highlightedIndex directly in the
    // virtualizer render loop below, rather than through a ref. Using a ref with useEffect
    // caused a race condition where stale data was displayed for one frame because useEffect
    // runs after paint. Props and state are already current during render, so direct access
    // is both correct and simpler.

    // Reset highlight and scroll to selected when opening
    useEffect(() => {
        if (open) {
            let scrollIndex: number;
            if (value === "all") {
                setHighlightedIndex(0);
                scrollIndex = 0;
            } else {
                const optionIndex = options.indexOf(value);
                const newHighlight = optionIndex >= 0 ? optionIndex + 1 : 0;
                setHighlightedIndex(newHighlight);
                scrollIndex = newHighlight;
            }
            // Scroll to selected item after a frame
            requestAnimationFrame(() => {
                if (scrollIndex > 0) {
                    virtualizer.scrollToIndex(scrollIndex, { align: "center" });
                }
            });
        }
    }, [open, options, value, virtualizer]);

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
                        virtualizer.scrollToIndex(next, { align: "auto" });
                        return next;
                    });
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setHighlightedIndex((prev) => {
                        const next = Math.max(prev - 1, 0);
                        virtualizer.scrollToIndex(next, { align: "auto" });
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
                    virtualizer.scrollToIndex(0, { align: "start" });
                    break;
                case "End":
                    e.preventDefault();
                    setHighlightedIndex(totalItems - 1);
                    virtualizer.scrollToIndex(totalItems - 1, { align: "end" });
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
                            virtualizer.scrollToIndex(newIndex, { align: "auto" });
                        }
                    }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, highlightedIndex, options, totalItems, handleSelect, virtualizer]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-md rounded-lg bg-background p-4 w-full max-w-full overflow-hidden"
                onOpenAutoFocus={(e) => e.preventDefault()}
                crossCloseIconSize="h-6 w-6"
            >
                <DialogTitle className="text-center w-full mb-3">
                    Select {label}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    Choose a {label.toLowerCase()} from the list below
                </DialogDescription>
                <div
                    className="rounded-md border bg-background overflow-hidden"
                    role="listbox"
                    aria-label={label}
                >
                    <div
                        ref={scrollContainerRef}
                        style={{
                            height: listHeight,
                            width: "100%",
                            overflow: "auto",
                        }}
                    >
                        <div
                            style={{
                                height: virtualizer.getTotalSize(),
                                width: "100%",
                                position: "relative",
                            }}
                        >
                            {virtualizer.getVirtualItems().map((virtualRow) => {
                                const index = virtualRow.index;

                                // Index 0 is "All" (no filter), rest are options
                                if (index === 0) {
                                    const isSelected = value === "all";
                                    const isHighlighted = highlightedIndex === index;
                                    return (
                                        <div
                                            key={virtualRow.key}
                                            data-index={index}
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                            className="px-2"
                                        >
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
                                                onClick={() => handleSelect("all")}
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
                                const isSelected = value === option;
                                const isHighlighted = highlightedIndex === index;

                                return (
                                    <div
                                        key={virtualRow.key}
                                        data-index={index}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                        className="px-2"
                                    >
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
                                            onClick={() => handleSelect(option)}
                                        >
                                            <span className="truncate pr-2">{option}</span>
                                            {isSelected && <CheckIcon className="h-4 w-4 shrink-0" />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
