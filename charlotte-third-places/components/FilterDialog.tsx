"use client";

import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator"
import { useContext, useState, useEffect } from "react";
import { FilterContext } from "@/contexts/FilterContext";
import { FilterSelect, FilterResetButton, SortSelect } from "@/components/FilterUtilities";
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
    className?: string;
    style?: React.CSSProperties;
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
                <div className="space-y-4">
                    <h2 className="text-center text-lg font-semibold leading-none tracking-tight">Sort</h2>

                    <div className="space-y-4">
                        <SortSelect />
                    </div>

                    <h2 className="text-center text-lg font-semibold leading-none tracking-tight">Filter</h2>

                    <div className="space-y-4">
                        {Object.entries(filters).map(([field, config]) => (
                            <FilterSelect key={field} field={field as keyof typeof filters} config={config} />
                        ))}
                    </div>
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
