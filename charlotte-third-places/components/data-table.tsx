"use client"

import { AgGridReact } from '@ag-grid-community/react';
import { ModuleRegistry, ColDef, SizeColumnsToContentStrategy } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import "@/styles/ag-grid-theme-builder.css" // See https://www.ag-grid.com/react-data-grid/applying-theme-builder-styling-grid/

ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface DataTableProps {
    rowData: Array<object>; // Accepts an array of objects for the row data
    colDefs: ColDef[]; // Accepts column definitions for AG Grid
    theme: string; // Accepts the theme class name as a string
    style?: React.CSSProperties; // Optional style prop with CSS properties
}

const autoSizeStrategy : SizeColumnsToContentStrategy   = {
    type: 'fitCellContents'
};

export function DataTable({ rowData, colDefs, style }: DataTableProps) {
    return (
        // wrapping container with theme & size
        <div
            className="ag-theme-custom"
            style={{ ...style }}
        >
            <AgGridReact
                rowData={rowData} // Row data passed as prop
                columnDefs={colDefs} // Column definitions passed as prop
                autoSizeStrategy={autoSizeStrategy}
            />
        </div>
    );
}
