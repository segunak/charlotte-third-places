"use client";

import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { useContext, useState, useEffect } from "react";
import { FilterContext } from "@/contexts/FilterContext";
import { FilterQuickSearch, FilterSelect, FilterResetButton } from "@/components/FilterUtilities";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";

export function FilterDrawer() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { filters } = useContext(FilterContext);

    return (
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="right">
            <DrawerTrigger className="fixed right-3 z-60" style={{ bottom: '4.5rem' }} asChild>
                <Button className="px-3 py-2" aria-label="Open Filters">
                    <Icons.filter className="h-4 w-4" />
                </Button>
            </DrawerTrigger>

            {/* <DrawerContent className="fixed inset-x-0 bottom-0 z-[60] mt-24 flex h-full flex-col rounded-t-lg bg-background pb-[env(safe-area-inset-bottom)]"> */}
            <DrawerContent className="h-full rounded-t-lg z-60">
                <DrawerHeader className="p-4">
                    <DrawerTitle>Filters</DrawerTitle>
                </DrawerHeader>

                <div className="p-4 space-y-4">
                    <FilterQuickSearch />

                    {Object.entries(filters).map(([field, config]) => (
                        <FilterSelect key={field} field={field as keyof typeof filters} config={config} />
                    ))}
                </div>

                <DrawerFooter className="p-4 space-y-2">
                    <FilterResetButton />
                    <DrawerClose asChild>
                        <Button variant="outline" className="w-full">
                            Close
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
