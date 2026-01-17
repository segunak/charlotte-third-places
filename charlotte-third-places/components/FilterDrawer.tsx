"use client";

import React, { useState, useCallback, useRef } from "react";
import { useFilters } from "@/contexts/FilterContext";
import { FILTER_DEFS, FILTER_SENTINEL, FilterKey, MOBILE_CHIP_FIELDS } from "@/lib/filters";
import { FilterSelect, FilterResetButton, SortSelect } from "@/components/FilterUtilities";
import { FilterChips } from "@/components/FilterChips";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/Icons";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";

interface FilterDrawerProps {
  className?: string;
  showSort?: boolean;
  style?: React.CSSProperties;
  showButton?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

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
  // Active filter count excludes fields with no constraint:
  // - Single-select: value === 'all' sentinel
  // - Multi-select: value is empty array []
  const activeFilterCount = Object.values(filters).filter((filter) => {
    if (Array.isArray(filter.value)) {
      return filter.value.length > 0;
    }
    return filter.value !== FILTER_SENTINEL;
  }).length;
  // Track open state for all selects
  const [anyDropdownOpen, setAnyDropdownOpen] = useState(false);
  const handleDropdownStateChange = useCallback((open: boolean) => {
    setAnyDropdownOpen(open);
  }, []);

  const triggerRef = useRef<HTMLButtonElement>(null);

  // Track which select or modal is open
  const [activePopover, setActivePopover] = useState<string | null>(null);

  // Helper to generate a unique id for each filter select
  const getPopoverId = (field: string) => `filter-select-${field}`;

  // Callback to focus the trigger after modal closes
  const focusDrawerTrigger = useCallback(() => {
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, []);
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <Button
        ref={triggerRef}
        variant="outline"
        size="icon"
        className={`fixed bottom-20 right-3 z-50 bg-primary rounded-full shadow-lg transition-opacity duration-200
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
          <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
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
          <DrawerTitle>Filters</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 px-4 overflow-y-auto flex-1">
          {showSort && (
            <SortSelect className="font-normal text-muted-foreground" onDropdownOpenChange={handleDropdownStateChange} />
          )}
          <div className="space-y-4">
            {FILTER_DEFS.map(def => {
              const config = filters[def.key as FilterKey];
              const field = def.key;
              
              // Use chips for fields marked with useChips (all are single-select)
              if (MOBILE_CHIP_FIELDS.has(field)) {
                return (
                  <FilterChips
                    key={field}
                    field={field as FilterKey}
                    value={config.value as string}
                    label={config.label}
                  />
                );
              }
              
              // Use picker/select for other fields
              return (
                <FilterSelect
                  key={field}
                  field={field as FilterKey}
                  value={config.value}
                  label={config.label}
                  placeholder={config.placeholder}
                  predefinedOrder={config.predefinedOrder}
                  matchMode={config.matchMode}
                  onDropdownOpenChange={(open: boolean) => {
                    handleDropdownStateChange(open);
                    setActivePopover(open ? getPopoverId(field) : null);
                  }}
                  onModalClose={focusDrawerTrigger}
                  isActivePopover={activePopover === getPopoverId(field)}
                  anyPopoverOpen={!!activePopover}
                />
              );
            })}
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

          <Separator className="mb-4 mt-4" />
          <div className="grid grid-cols-2 gap-3 w-full mb-4">
            <FilterResetButton variant="outline" disabled={anyDropdownOpen} />

            <DrawerClose asChild>
              <Button className="disabled:opacity-100" disabled={anyDropdownOpen}>
                Save
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
});

FilterDrawer.displayName = "FilterDrawer";