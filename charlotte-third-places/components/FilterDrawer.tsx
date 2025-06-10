"use client";

import React, { useState, useContext, useCallback, useRef } from "react";
import { FilterContext } from "@/contexts/FilterContext";
import { FilterSelect, FilterResetButton, SortSelect } from "@/components/FilterUtilities";
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

export function FilterDrawer({
  className = "",
  showSort = false,
  style = {},
  showButton = true,
  open,
  onOpenChange,
}: {
  className?: string;
  showSort?: boolean;
  style?: React.CSSProperties;
  showButton?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : isDrawerOpen;
  const setIsOpen = onOpenChange || setIsDrawerOpen;

  const { filters } = useContext(FilterContext);
  const activeFilterCount = Object.values(filters).filter((filter) => filter.value !== 'all').length;
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
      <DrawerContent className="pb-safe">
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
          <DrawerTitle></DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 px-4">
          {showSort && (
            <div className="space-y-4">
              <h2 className="text-center text-lg font-semibold leading-none tracking-tight">Sort</h2>
              <SortSelect className="font-normal text-muted-foreground" onDropdownOpenChange={handleDropdownStateChange} />
            </div>
          )}
          <h2 className="text-center text-lg font-semibold leading-none tracking-tight">Filter</h2>
          <div className="space-y-4">
            {Object.entries(filters).map(([field, config]) => (
              <FilterSelect
                key={field}
                field={field as keyof typeof filters}
                value={config.value}
                label={config.label}
                placeholder={config.placeholder}
                predefinedOrder={config.predefinedOrder}
                onDropdownOpenChange={(open: boolean) => {
                  handleDropdownStateChange(open);
                  setActivePopover(open ? getPopoverId(field) : null);
                }}
                onModalClose={focusDrawerTrigger}
                isActivePopover={activePopover === getPopoverId(field)}
                anyPopoverOpen={!!activePopover}
              />
            ))}
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
          <FilterResetButton disabled={anyDropdownOpen} />
          <DrawerClose asChild>
            <Button className="w-full disabled:opacity-100" disabled={anyDropdownOpen}>
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}