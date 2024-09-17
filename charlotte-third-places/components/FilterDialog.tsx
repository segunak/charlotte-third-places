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

interface FilterDialogProps {
    className?: string; // Optional className prop for customization
    style?: React.CSSProperties; // Optional style prop for inline styles
}

export function FilterDialog({ className = "", style = {} }: FilterDialogProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { filters } = useContext(FilterContext);
    const activeFilterCount = Object.values(filters).filter((filter) => filter.value !== 'all').length;

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            {!isDialogOpen && (
                <DialogTrigger
                    className={`${className}`}
                    style={{ ...style }}
                    asChild
                >
                    <Button className="px-3 py-2" aria-label="Open Filters">
                        <Icons.filter className="h-4 w-4" />
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1.5 right-0 w-4 h-4 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
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
                    {Object.entries(filters).map(([field, config]) => (
                        <FilterSelect key={field} field={field as keyof typeof filters} config={config} />
                    ))}
                </div>

                <DialogFooter className="flex flex-col space-y-4 mt-4">
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
