"use client";

import { useContext, useState } from "react";
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
}: {
  className?: string;
  showSort?: boolean;
  style?: React.CSSProperties;
  showButton?: boolean;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { filters, dropdownOpen } = useContext(FilterContext);
  const activeFilterCount = Object.values(filters).filter((filter) => filter.value !== 'all').length;

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <Button
        variant="outline"
        size="icon"
        className={`fixed bottom-20 right-3 z-50 bg-primary rounded-full shadow-lg transition-opacity duration-200
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
        <span className="sr-only">Open Filters</span> {/* Added for accessibility */}
      </Button>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Sort & Filter</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 px-4 pb-4">
          {showSort && (
            <div className="space-y-4">
              <h2 className="text-center text-lg font-semibold leading-none tracking-tight">Sort</h2>
              <SortSelect />
            </div>
          )}
          <h2 className="text-center text-lg font-semibold leading-none tracking-tight">Filter</h2>
          <div className="space-y-4">
            {Object.entries(filters).map(([field, config]) => (
              <FilterSelect key={field} field={field as keyof typeof filters} config={config} />
            ))}
          </div>
        </div>
        <DrawerFooter>
          <FilterResetButton />
          <DrawerClose asChild>
            <Button variant="outline" className="w-full disabled:opacity-100" disabled={dropdownOpen}>
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
