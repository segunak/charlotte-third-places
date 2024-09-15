"use client";

import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { useContext, useState, useEffect } from "react";
import { FilterContext } from "@/contexts/FilterContext";
import { FilterQuickSearch, FilterSelect, FilterResetButton } from "@/components/FilterUtilities";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog";

export function FilterDialog() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { filters } = useContext(FilterContext);

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            {!isDialogOpen && (
                <DialogTrigger className="fixed right-3 z-60" style={{ bottom: '4.5rem' }} asChild>
                    <Button className="px-3 py-2" aria-label="Open Filters">
                        <Icons.filter className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent
                className="sm:max-w-md rounded-lg bg-background p-6"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>Filters</DialogTitle>
                    <DialogDescription>Use the fields below to filter places.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <FilterQuickSearch />

                    {Object.entries(filters).map(([field, config]) => (
                        <FilterSelect key={field} field={field as keyof typeof filters} config={config} />
                    ))}
                </div>

                <DialogFooter className="flex flex-col space-y-2 mt-4">
                    <FilterResetButton />
                    <DialogClose asChild>
                        <Button variant="outline" className="w-full">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
