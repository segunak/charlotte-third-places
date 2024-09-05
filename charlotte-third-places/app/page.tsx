import * as React from "react";
import { getPlaces } from '@/lib/data';
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumns } from "@/components/columns"

export const revalidate = 43200; // Revalidate the data every 12 hours

export default async function HomePage() {
  const places = await getPlaces(); // This will use the cached result or fetch fresh data if the cache is stale

  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Charlotte Third Places
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          A curated collection of third places in Charlotte, North Carolina
        </p>

        <div className="container mx-auto py-10">
          <DataTable columns={DataTableColumns} data={places} />
        </div>
      </div>
    </section>
  );
}
