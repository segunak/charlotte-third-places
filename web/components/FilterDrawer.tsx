"use client";

import { FilterFullWidthSegments } from "@/components/FilterFullWidthSegments";
import { FilterOptionRail } from "@/components/FilterOptionRail";
import { FilterStatusRow } from "@/components/FilterStatusRow";
import { FilterResetButton, SortSelect } from "@/components/FilterUtilities";
import { Icons } from "@/components/Icons";
import { PlaceSearchFilter } from "@/components/PlaceSearchFilter";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { useFilters, useOpenNow } from "@/contexts/FilterContext";
import { FEATURED_FILTER_VALUES, FILTER_SENTINEL, type FilterKey } from "@/lib/filters";
import React, { useCallback, useRef, useState } from "react";

interface FilterDrawerProps {
  className?: string;
  showSort?: boolean;
  style?: React.CSSProperties;
  showButton?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const FILTER_DRAWER_PICKER_MAX_HEIGHT = "86dvh";

const DRAWER_SEGMENTED_DEFS = [
  {
    field: "parking",
    label: "Free Parking",
    options: [
      { label: "Yes", value: "Free" },
      { label: "No", value: "Paid" },
    ],
  },
  {
    field: "freeWiFi",
    label: "Free Wi-Fi",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
  },
  {
    field: "purchaseRequired",
    label: "Purchase Required",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
  },
  {
    field: "size",
    label: "Size",
    options: [
      { label: "Small", value: "Small" },
      { label: "Medium", value: "Medium" },
      { label: "Large", value: "Large" },
    ],
    columnsClassName: "grid-cols-[0.9fr_1.3fr_1fr]",
  },
  {
    field: "hasCinnamonRolls",
    label: "Cinnamon Rolls",
    options: [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
      { label: "Sometimes", value: "Sometimes" },
    ],
    columnsClassName: "grid-cols-[0.85fr_0.75fr_1.6fr]",
  },
] as const satisfies ReadonlyArray<{
  field: FilterKey;
  label: string;
  options: readonly { label: string; value: string }[];
  columnsClassName?: string;
}>;

export const FilterDrawer = React.memo(function FilterDrawer({
  className = "",
  showSort = false,
  style = {},
  showButton = true,
  open,
  onOpenChange,
}: FilterDrawerProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : isDrawerOpen;
  const setIsOpen = onOpenChange || setIsDrawerOpen;

  const { filters } = useFilters();
  const { openNow } = useOpenNow();
  // Applied filter count excludes fields with no constraint:
  // - Single-select: value === 'all' sentinel
  // - Multi-select: value is empty array []
  const appliedFilterCount = Object.values(filters).filter((filter) => {
    if (Array.isArray(filter.value)) {
      return filter.value.length > 0;
    }
    return filter.value !== FILTER_SENTINEL;
  }).length;
  // Open Now lives outside the drawer, but the floating badge reflects the complete state.
  const activeFilterCount = appliedFilterCount + (openNow ? 1 : 0);
  // Track open state for all selects
  const [anyDropdownOpen, setAnyDropdownOpen] = useState(false);
  const handleDropdownStateChange = useCallback((open: boolean) => {
    setAnyDropdownOpen(open);
  }, []);

  const triggerRef = useRef<HTMLButtonElement>(null);

  // Callback to focus the trigger after modal closes
  const focusDrawerTrigger = useCallback(() => {
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, []);

  const handleNestedPickerOpenChange = useCallback((open: boolean) => {
    handleDropdownStateChange(open);
    if (!open) focusDrawerTrigger();
  }, [focusDrawerTrigger, handleDropdownStateChange]);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <Button
        ref={triggerRef}
        variant="outline"
        size="icon"
        className={`fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] right-3 z-50 mobile-map-control rounded-full shadow-lg transition-opacity duration-200
          ${className}
          ${!showButton ? "opacity-0 pointer-events-none" : "opacity-100"}
        `}
        style={style}
        onClick={() => setIsOpen(true)}
        aria-label="Open Filters"
        tabIndex={!showButton ? -1 : 0}
      >
        <Icons.filter className="h-4 w-4 text-white" />
        {activeFilterCount > 0 && (
          <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full ring-2 ring-white">
            {activeFilterCount}
          </span>
        )}
        <span className="sr-only">Open Filters</span> {/* Added for accessibility */}
      </Button>
      <DrawerContent className="pb-safe max-h-[95dvh] flex flex-col">
        {/* Overlay to absorb all pointer events when anyDropdownOpen is true */}
        {anyDropdownOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
              background: 'transparent',
              pointerEvents: 'auto',
            }}
            aria-hidden="true"
          />
        )}
        <DrawerHeader>
          <DrawerTitle className="sr-only">Filters</DrawerTitle>
          <FilterStatusRow className="-mt-4" />
        </DrawerHeader>
        <div className="px-4 overflow-y-auto flex-1">
          <div className="space-y-5">
            {showSort && (
              <section
                className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-2 max-[359px]:grid-cols-1"
                aria-label="Sort By"
              >
                <h3 className="text-sm font-semibold text-foreground">Sort By</h3>
                <SortSelect
                  className="font-normal text-muted-foreground"
                  onDropdownOpenChange={handleDropdownStateChange}
                />
              </section>
            )}

            {showSort && <Separator />}

            <div className="space-y-3">
              <PlaceSearchFilter
                onPickerOpenChange={handleNestedPickerOpenChange}
                pickerMaxHeight={FILTER_DRAWER_PICKER_MAX_HEIGHT}
              />

              <FilterOptionRail
                field="neighborhood"
                label="Neighborhood"
                featuredValues={FEATURED_FILTER_VALUES.neighborhood}
                onPickerOpenChange={handleNestedPickerOpenChange}
                pickerMaxHeight={FILTER_DRAWER_PICKER_MAX_HEIGHT}
              />

              <FilterOptionRail
                field="type"
                label="Type"
                featuredValues={FEATURED_FILTER_VALUES.type}
                onPickerOpenChange={handleNestedPickerOpenChange}
                pickerMaxHeight={FILTER_DRAWER_PICKER_MAX_HEIGHT}
              />

              <FilterOptionRail
                field="tags"
                label="Tags"
                featuredValues={FEATURED_FILTER_VALUES.tags}
                onPickerOpenChange={handleNestedPickerOpenChange}
                pickerMaxHeight={FILTER_DRAWER_PICKER_MAX_HEIGHT}
              />

              <div className="space-y-3">
                {DRAWER_SEGMENTED_DEFS.map(definition => (
                  <FilterFullWidthSegments
                    key={definition.field}
                    field={definition.field}
                    value={filters[definition.field].value as string}
                    label={definition.label}
                    options={definition.options}
                    columnsClassName={"columnsClassName" in definition
                      ? definition.columnsClassName
                      : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <DrawerFooter style={{ position: 'relative' }}>
          {anyDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10,
                background: 'transparent',
                pointerEvents: 'auto',
              }}
              aria-hidden="true"
            />
          )}

          <Separator className="mb-4" />
          <div className="flex justify-center gap-3 w-full">
            <FilterResetButton variant="outline" disabled={anyDropdownOpen} fullWidth={false} className="h-11 text-base w-[calc(50%-6px)]" />

            <DrawerClose asChild>
              <Button className="h-11 text-base w-[calc(50%-6px)] disabled:opacity-100" disabled={anyDropdownOpen}>
                Done
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
});

FilterDrawer.displayName = "FilterDrawer";