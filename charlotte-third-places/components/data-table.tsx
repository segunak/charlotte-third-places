"use client"

import { useState } from "react";
import "@/styles/ag-grid-theme-builder.css" // See https://www.ag-grid.com/react-data-grid/applying-theme-builder-styling-grid/
import { Input } from "@/components/ui/input";
import { AgGridReact } from '@ag-grid-community/react';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry, ColDef, SizeColumnsToContentStrategy } from '@ag-grid-community/core';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface DataTableProps {
    rowData: Array<object>; // Accepts an array of objects for the row data
    colDefs: ColDef[]; // Accepts column definitions for AG Grid
    style?: React.CSSProperties; // Optional style prop with CSS properties
}

const autoSizeStrategy: SizeColumnsToContentStrategy = {
    type: 'fitCellContents'
};

export function DataTable({ rowData, colDefs, style }: DataTableProps) {
    const [quickFilterText, setQuickFilterText] = useState<string>('');
    const handleQuickFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQuickFilterText(event.target.value);
    };

    return (
        <div>
            <div className="mb-4">
                <Input
                    type="text"
                    placeholder="Quick Filter..."
                    onChange={handleQuickFilterChange}
                    value={quickFilterText}
                    className="w-full"
                />
            </div>
            <div className="ag-theme-custom" style={{ ...style }}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={colDefs}
                    autoSizeStrategy={autoSizeStrategy}
                    quickFilterText={quickFilterText}
                />
            </div>
        </div>
    );
}
