import Link from "next/link";
import * as React from "react";
import { getPlaces } from '@/lib/data-services';
import { gridColumns } from "@/lib/data-models";
import { DataTable } from "@/components/data-table";
import { ResponsiveLink } from "@/components/responsive-link";

export const revalidate = 43200; // Revalidate the data every 12 hours

export default async function HomePage() {
  const places = await getPlaces(); // This will use the cached result or fetch fresh data if the cache is stale

  return (
    <section className="container mx-auto py-8 px-5 sm:px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Explore Charlotte's Third Places</h1>
        <p>
          Use the table below to explore various{" "}
          <ResponsiveLink href="https://en.wikipedia.org/wiki/Third_place">
            third places
          </ResponsiveLink>
          {" "}in Charlotte, North Carolina. You can filter, search, sort, and scroll through the list. Places are listed in alphabetical order by default. For a map view, click <Link href="/map" className="custom-link">here</Link>. If you'd like to contribute a place, or suggest enhancements to existing places, click <Link href="/contribute" className="custom-link">here</Link>. For more information about the site, click <Link href="/about" className="custom-link">here</Link>.
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
