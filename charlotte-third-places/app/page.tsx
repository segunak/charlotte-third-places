import Link from "next/link";
import { getPlaces } from '@/lib/data-services';
import { DataTable } from "@/components/DataTable";
import { FilterDrawer } from "@/components/FilterDrawer";
import { FilterProvider } from '@/contexts/FilterContext';
import { FilterSidebar } from '@/components/FilterSidebar';
import { ResponsiveLink } from "@/components/ResponsiveLink";

// See https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration
// This results in Next.js refreshing the data from Airtable once for the whole site every 12 hours.
// In between, the site uses cached data.
export const revalidate = 43200; // Revalidate the data every 12 hours

export default async function HomePage() {
  const places = await getPlaces();

  return (
    <FilterProvider places={places}>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
        <div className="overflow-hidden">
          <section className="container py-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-4">
                Explore <span className="text-primary">{places.length}</span> Third Places in{" "}
                <span className="sm:hidden">Charlotte</span>
                <span className="hidden sm:inline">Charlotte, North Carolina</span>
              </h1>
              <p>
                Discover <ResponsiveLink href="https://en.wikipedia.org/wiki/Third_place">third places</ResponsiveLink> in Charlotte, North Carolina and its <ResponsiveLink href="https://en.wikipedia.org/wiki/Charlotte_metropolitan_area">surrounding areas</ResponsiveLink>. Use the {" "}
                <span className="sm:hidden">button in the lower-right corner</span>
                <span className="hidden sm:inline">sidebar on the right</span>
                {" "} to filter and search through the list.
                <span className="hidden sm:inline">
                  {" "} Prefer a map? Click <Link href="/map" className="custom-link">here</Link>. Have a suggestion or enhancement? Click <Link href="/contribute" className="custom-link">here</Link>. To learn more about the site, click <Link href="/about" className="custom-link">here</Link>.
                </span>
              </p>
              <br/>
              <span className="font-bold custom-highlight">
                Click on a card to see more information about a place.
              </span>
            </div>
            <DataTable rowData={places} />
          </section>
        </div>
        {/*On mobile, this provides a button in the lower right for filtering */}
        <div className="md:hidden">
          <FilterDrawer />
        </div>
        {/*On desktop, this provides a dedicated sidebar for filtering */}
        <div className="hidden md:block">
          <FilterSidebar />
        </div>
      </div>
    </FilterProvider>
  );
}
