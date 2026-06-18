import * as React from "react"

import { cn } from "@/lib/utils"

const Table = (
  {
    ref,
    className,
    ...props
  }: React.HTMLAttributes<HTMLTableElement> & {
    ref?: React.Ref<HTMLTableElement>;
  }
) => (<div className="relative w-full overflow-auto">
  <table
    ref={ref}
    data-slot="table"
    className={cn("w-full caption-bottom text-sm", className)}
    {...props}
  />
</div>)

const TableHeader = (
  {
    ref,
    className,
    ...props
  }: React.HTMLAttributes<HTMLTableSectionElement> & {
    ref?: React.Ref<HTMLTableSectionElement>;
  }
) => (<thead ref={ref} data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />)

const TableBody = (
  {
    ref,
    className,
    ...props
  }: React.HTMLAttributes<HTMLTableSectionElement> & {
    ref?: React.Ref<HTMLTableSectionElement>;
  }
) => (<tbody
  ref={ref}
  data-slot="table-body"
  className={cn("[&_tr:last-child]:border-0", className)}
  {...props}
/>)

const TableFooter = (
  {
    ref,
    className,
    ...props
  }: React.HTMLAttributes<HTMLTableSectionElement> & {
    ref?: React.Ref<HTMLTableSectionElement>;
  }
) => (<tfoot
  ref={ref}
  data-slot="table-footer"
  className={cn(
    "border-t bg-muted/50 font-medium last:[&>tr]:border-b-0",
    className
  )}
  {...props}
/>)

const TableRow = (
  {
    ref,
    className,
    ...props
  }: React.HTMLAttributes<HTMLTableRowElement> & {
    ref?: React.Ref<HTMLTableRowElement>;
  }
) => (<tr
  ref={ref}
  data-slot="table-row"
  className={cn(
    "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
    className
  )}
  {...props}
/>)

const TableHead = (
  {
    ref,
    className,
    ...props
  }: React.ThHTMLAttributes<HTMLTableCellElement> & {
    ref?: React.Ref<HTMLTableCellElement>;
  }
) => (<th
  ref={ref}
  data-slot="table-head"
  className={cn(
    "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-[2px]",
    className
  )}
  {...props}
/>)

const TableCell = (
  {
    ref,
    className,
    ...props
  }: React.TdHTMLAttributes<HTMLTableCellElement> & {
    ref?: React.Ref<HTMLTableCellElement>;
  }
) => (<td
  ref={ref}
  data-slot="table-cell"
  className={cn(
    "p-2 align-middle [&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-[2px]",
    className
  )}
  {...props}
/>)

const TableCaption = (
  {
    ref,
    className,
    ...props
  }: React.HTMLAttributes<HTMLTableCaptionElement> & {
    ref?: React.Ref<HTMLTableCaptionElement>;
  }
) => (<caption
  ref={ref}
  data-slot="table-caption"
  className={cn("mt-4 text-sm text-muted-foreground", className)}
  {...props}
/>)

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
