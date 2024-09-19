"use client";

import "@/styles/ag-grid-theme-builder.css"; // See https://www.ag-grid.com/react-data-grid/applying-theme-builder-styling-grid/
import { PlaceCard } from "@/components/PlaceCard";
import { normalizeTextForSearch } from '@/lib/utils'
import { PlaceModal } from "@/components/PlaceModal";
import { AgGridReact } from '@ag-grid-community/react';
import { useWindowWidth } from '@/hooks/useWindowWidth';
import { FilterContext } from "@/contexts/FilterContext";
import { useContext, useCallback, useRef, useState, useMemo } from "react";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry, ColDef, SizeColumnsToContentStrategy } from '@ag-grid-community/core';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface DataTableProps {
    rowData: Array<object>; // Accepts an array of objects for the row data
}

const autoSizeStrategy: SizeColumnsToContentStrategy = {
    type: 'fitCellContents',
};

export function DataTable({ rowData }: DataTableProps) {
    const gridRef = useRef<AgGridReact>(null);
    const [selectedCard, setSelectedCard] = useState<any | null>(null);
    const { filters, quickFilterText } = useContext(FilterContext);

    const isFullWidthRow = useCallback((params: any) => {
        return true;
    }, []);

    const handlePlaceClick = useCallback((place: any) => {
        setSelectedCard(place);
    }, []);

    const columnDefs = useMemo(() => {
        const gridColumns: ColDef[] = [
            {
                headerName: "",
                field: "dummy",
                flex: 1,
                resizable: false,
                cellRenderer: "agFullWidthCellRenderer"
            }
        ];

        return gridColumns;
    }, []);

    const applyFilters = useCallback(
        (data: any[]) => {
            return data.filter((place: any) => {
                const {
                    name,
                    type,
                    size,
                    neighborhood,
                    purchaseRequired,
                    parkingSituation,
                    freeWifi,
                    hasCinnamonRolls,
                } = filters;

                const isTypeMatch =
                    type.value === "all" || (place.type && place.type.includes(type.value));

                return (
                    isTypeMatch &&
                    (name.value === "all" || place.name === name.value) &&
                    (size.value === "all" || place.size === size.value) &&
                    (neighborhood.value === "all" || place.neighborhood === neighborhood.value) &&
                    (purchaseRequired.value === "all" || place.purchaseRequired === purchaseRequired.value) &&
                    (parkingSituation.value === "all" || place.parkingSituation === parkingSituation.value) &&
                    (freeWifi.value === "all" || place.freeWifi === freeWifi.value) &&
                    (hasCinnamonRolls.value === "all" || place.hasCinnamonRolls === hasCinnamonRolls.value)
                );
            });
        },
        [filters]
    );

    const windowWidth = useWindowWidth();

    // Aligns with Tailwind breakpoints at https://tailwindcss.com/docs/responsive-design
    const columnsPerRow = useMemo(() => {
        if (windowWidth >= 768) return 2; // md and larger (2 cards)
        return 1; // anything smaller than md (1 card)
    }, [windowWidth]);


    const filteredAndGroupedRowData = useMemo(() => {
        let filteredData = rowData;

        if (quickFilterText.trim() !== "") {
            const lowerCaseFilter = quickFilterText.toLowerCase();
            filteredData = filteredData.filter((place: any) =>
                normalizeTextForSearch(JSON.stringify(place)).includes(lowerCaseFilter)
            );
        }

        filteredData = applyFilters(filteredData);

        const grouped = [];
        for (let i = 0; i < filteredData.length; i += columnsPerRow) {
            const group = filteredData.slice(i, i + columnsPerRow);
            grouped.push({ group });
        }
        return grouped;
    }, [rowData, quickFilterText, applyFilters, columnsPerRow]);

    const getRowHeight = useCallback(() => {
        const cardHeight = 215;
        return cardHeight;
    }, []);

    const fullWidthCellRenderer = useCallback(
        (params: any) => {
            const { group } = params.data;
            return (
                <div className="flex flex-wrap -mx-2">
                    {group.map((place: any, index: number) => (
                        <div key={index} className="w-full md:w-1/2 px-2 mb-4">
                            <PlaceCard
                                place={place}
                                onClick={() => handlePlaceClick(place)}
                            />
                        </div>
                    ))}
                </div>
            );
        },
        [handlePlaceClick]
    );

    return (
        <div className="flex-1">
            <div className="ag-theme-custom w-full">
                <AgGridReact
                    ref={gridRef}
                    rowData={filteredAndGroupedRowData}
                    columnDefs={columnDefs}
                    autoSizeStrategy={autoSizeStrategy}
                    includeHiddenColumnsInQuickFilter={true}
                    suppressMovableColumns={true}
                    domLayout="autoHeight" // Ensures that grid height adjusts to content
                    getRowHeight={getRowHeight}
                    isFullWidthRow={isFullWidthRow}
                    fullWidthCellRenderer={fullWidthCellRenderer}
                />
            </div>
            {
                selectedCard &&
                <PlaceModal place={selectedCard} onClose={() => setSelectedCard(null)} />
            }
        </div>
    );
}
