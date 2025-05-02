"use client";

import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { FilterContext } from "@/contexts/FilterContext";
import React, { useState, useContext, useCallback, useEffect } from "react";
import { FilterSelect, FilterResetButton, SortSelect } from "@/components/FilterUtilities";
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
}: {
  className?: string;
  showSort?: boolean;
  style?: React.CSSProperties;
  showButton?: boolean;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { filters } = useContext(FilterContext);
  const activeFilterCount = Object.values(filters).filter((filter) => filter.value !== 'all').length;
  // Track open state for all selects
  const [anyDropdownOpen, setAnyDropdownOpen] = useState(false);
  const handleDropdownStateChange = useCallback((open: boolean) => {
    setAnyDropdownOpen(open);
  }, []);
  
  const triggerRef = React.useRef<HTMLButtonElement>(null);

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
  
  // When the drawer closes, make sure we reset any open popover/dropdown state
  useEffect(() => {
    if (!isDrawerOpen) {
      setActivePopover(null);
      setAnyDropdownOpen(false);
    }
  }, [isDrawerOpen]);

  // Prevent clicks from propagating through
  const preventPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <Button
        ref={triggerRef}
        variant="outline"
        size="icon"
        className={`fixed bottom-20 right-3 z-40 bg-primary rounded-full shadow-lg transition-opacity duration-200
          ${className}
          ${!showButton ? "opacity-0 pointer-events-none" : "opacity-100"}
        `}
        style={style}
        onClick={() => setIsDrawerOpen(true)}
        aria-label="Open Filters"
        tabIndex={!showButton ? -1 : 0}
      >
        <Icons.filter className="h-4 w-4 text-white" />
        {activeFilterCount > 0 && (
          <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {activeFilterCount}
          </span>
        )}
        <span className="sr-only">Open Filters</span>
      </Button>
      <DrawerContent 
        className="z-50" 
        onClick={preventPropagation}
        onOpenAutoFocus={(e) => {
          // Since FilterDrawer is only used on mobile, preventing auto-focus
          // is appropriate as mobile devices don't use tab navigation and 
          // we want to avoid triggering the on-screen keyboard
          e.preventDefault();
        }}
      >
        {/* Overlay to absorb all pointer events when anyDropdownOpen is true */}
        {anyDropdownOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 60,
              background: 'rgba(0, 0, 0, 0.05)',
              pointerEvents: 'auto',
            }}
            onClick={(e) => {
              e.stopPropagation();
              // Close any open dropdowns when clicking on the overlay
              setActivePopover(null);
              setAnyDropdownOpen(false);
            }}
            aria-hidden="true"
          />
        )}
        <DrawerHeader>
          <DrawerTitle></DrawerTitle>
        </DrawerHeader>
        <div className="drawer-content space-y-4 px-4 pb-4" onClick={preventPropagation}>
          {showSort && (
            <div className="space-y-4">
              <h2 className="text-center text-lg font-semibold leading-none tracking-tight">Sort</h2>
              <SortSelect 
                className="font-normal text-muted-foreground" 
                onDropdownOpenChange={handleDropdownStateChange}
                // Apply higher z-index to active popover
                style={{ zIndex: activePopover === 'sort-select' ? 70 : 50 }}
              />
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
                // Apply higher z-index to active popover
                style={{ zIndex: activePopover === getPopoverId(field) ? 70 : 50 }}
              />
            ))}
          </div>
        </div>
        <DrawerFooter style={{ position: 'relative', zIndex: 55 }} onClick={preventPropagation}>
          {anyDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 60,
                background: 'transparent',
                pointerEvents: 'auto',
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Clicking on this overlay in the footer should close all dropdowns
                setActivePopover(null);
                setAnyDropdownOpen(false);
              }}
              aria-hidden="true"
            />
          )}
          <FilterResetButton disabled={anyDropdownOpen} />
          <DrawerClose asChild>
            <Button 
              variant="outline" 
              className="w-full disabled:opacity-100" 
              disabled={anyDropdownOpen}
              tabIndex={anyDropdownOpen ? -1 : 0}
            >
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
