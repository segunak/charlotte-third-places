import Link from "next/link";
import { getPlaces } from '@/lib/data-services';
import { DataTable } from "@/components/DataTable";
import { ResponsiveLink } from "@/components/ResponsiveLink";

// See https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration
// This results in Next.js refreshing the data from Airtable once for the whole site every 12 hours.
// In between, the site uses cached data.
export const revalidate = 43200; // Revalidate the data every 12 hours

export default async function HomePage() {
  const places = await getPlaces();

  return (
    <section className="container mx-auto py-8 px-6 sm:px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">
          Explore <span className="text-primary">{places.length}</span> Third Places in{" "}
          <span className="sm:hidden">Charlotte, NC</span>
          <span className="hidden sm:inline">Charlotte, North Carolina</span>
        </h1>
        <p>
          Discover <ResponsiveLink href="https://en.wikipedia.org/wiki/Third_place">third places</ResponsiveLink> in Charlotte, North Carolina and <ResponsiveLink href="https://en.wikipedia.org/wiki/Charlotte_metropolitan_area">surrounding areas</ResponsiveLink>. Use the table below to filter and search through the list.
          <span className="hidden sm:inline"> 
            {" "} Prefer a map? Click <Link href="/map" className="custom-link">here</Link>. Have a suggestion or enhancement? Click <Link href="/contribute" className="custom-link">here</Link>. To learn more about the site, click <Link href="/about" className="custom-link">here</Link>.
          </span>
        </p>
        <p className="mt-4 font-bold text-primary">
          Click a card to see way more information about a place.
        </p>
      </div>

      <DataTable rowData={places} />
    </section>
  );
}
