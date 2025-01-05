"use client";

import { Place } from "@/lib/types";
import { DataTable } from "@/components/DataTable";
import { FilterDialog } from "@/components/FilterDialog";
import { FilterSidebar } from "@/components/FilterSidebar";
import React, { useEffect, useRef, useState } from "react";

interface PlaceListWithFiltersProps {
    places: Place[];
}

export function PlaceListWithFilters({ places }: PlaceListWithFiltersProps) {
    const dataTableRef = useRef<HTMLDivElement>(null);
    const [isDataTableInView, setIsDataTableInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsDataTableInView(entry.isIntersecting);
            },
            {
                root: null,
                threshold: 0.007,
            }
        );

        const currentDataTableRef = dataTableRef.current;
        if (currentDataTableRef) {
            observer.observe(currentDataTableRef);
        }

        return () => {
            if (currentDataTableRef) {
                observer.unobserve(currentDataTableRef);
            }
        };
    }, []);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,_1fr)_265px]">
            <div className="col-span-1 space-y-4 mb-4 sm:mb-0 sm:pr-12">
                {/* Intro Text */}
                <div className="text-2xl font-bold">List</div>
                <p className="text-pretty">
                    {/* Always visible portion */}
                    Browse the complete list of places below.{" "}
                    {/* Mobile-only text */}
                    <span className="inline sm:hidden">
                        Use the <span className="font-bold text-primary">button in the lower-right corner</span> to sort and filter.
                    </span>
                    {/* Desktop-only text */}
                    <span className="hidden sm:inline">
                        Use the <span className="font-bold text-primary">sidebar on the right</span> to sort and filter.
                    </span>
                </p>

                {/* DataTable Section */}
                <section ref={dataTableRef}>
                    <DataTable rowData={places} />
                </section>

                {/* Mobile Filter Dialog */}
                <div className="sm:hidden">
                    {isDataTableInView && (
                        <FilterDialog
                            showSort={true}
                            className="fixed right-3 z-50"
                            style={{ bottom: "5rem" }}
                        />
                    )}
                </div>
            </div>

            {/* Second Column: Desktop Filter Sidebar */}
            <div className="hidden sm:block">
                <FilterSidebar
                    showSort={true}
                    className="max-w-[265px] border border-border sticky top-16 px-6 space-y-[.65rem]"
                />
            </div>
        </div>
    );
}
