import Link from "next/link";
import * as React from "react";
import { getPlaces } from '@/lib/data-services';
import { gridColumns } from "@/lib/data-models";
import { DataTable } from "@/components/data-table";

export const revalidate = 43200; // Revalidate the data every 12 hours

export default async function HomePage() {
  const places = await getPlaces(); // This will use the cached result or fetch fresh data if the cache is stale
  
  return (
    <section className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Explore Charlotte's Third Places</h1>
        <p className="text-md">
          Use the table below to explore various <a href="https://en.wikipedia.org/wiki/Third_place" className="custom-link" target="_blank">third places</a> in Charlotte, North Carolina. You can filter, sort, and scroll through the list. You can also click <Link href="/map" className="custom-link">here</Link> for a map view of the places, <Link href="/contribute" className="custom-link">here</Link> to contribute to the list, and <Link href="/about" className="custom-link">here</Link> to learn more about the site.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <DataTable
          rowData={places}
          colDefs={gridColumns}
          style={{ height: '100vh', width: '100%' }}
        />
      </div>
    </section>
  );
}
