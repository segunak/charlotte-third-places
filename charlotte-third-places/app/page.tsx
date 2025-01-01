import Link from "next/link";
import { REVALIDATE_TIME } from '@/lib/config';
import { getPlaces } from '@/lib/data-services';
import { DataTable } from "@/components/DataTable";
import { Separator } from "@/components/ui/separator";
import { FilterDialog } from '@/components/FilterDialog';
import { FilterProvider } from '@/contexts/FilterContext';
import { FilterSidebar } from '@/components/FilterSidebar';
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { ResponsivePlaceCards } from "@/components/ResponsivePlaceCards";

/* See https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration
Also https://support.airtable.com/docs/getting-started-with-airtables-web-api
Airtable has API call limits. Can't have every visit pulling new data. */
export const revalidate = REVALIDATE_TIME;

export default async function HomePage() {
  const places = await getPlaces();

  return (
    <FilterProvider places={places}>
      <div className="min-h-screen px-4 sm:px-20 py-8 space-y-4">
        <h1 className="text-3xl font-bold">
          Explore <span className="text-primary">{places.length}</span> Third Places in{" "}
          <span className="sm:hidden">Charlotte</span>
          <span className="hidden sm:inline">Charlotte, North Carolina</span>
        </h1>
        <p>
          Discover <ResponsiveLink href="https://en.wikipedia.org/wiki/Third_place">third places</ResponsiveLink> in Charlotte, North Carolina and its <ResponsiveLink href="https://en.wikipedia.org/wiki/Charlotte_metropolitan_area">surrounding areas</ResponsiveLink>. {" "}
          <span className="hidden sm:inline">
            Prefer a map? Click <Link href="/map" className="custom-link">here</Link>. Have suggestions or enhancements? Click <Link href="/contribute" className="custom-link">here</Link>. To learn more about the project, click <Link href="/about" className="custom-link">here</Link>.
          </span>
          {" "}
          <span className="font-bold text-primary">Click on any card to see more details.</span>
        </p>

        <ResponsivePlaceCards places={places} />

        <div className="-mx-4 sm:-mx-20">
          <Separator />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,_1fr)_265px]">
          <section className="pr-12 space-y-4">
            <DataTable rowData={places} />
          </section>

          {/* Mobile Filter Dialog */}
          <div className="sm:hidden">
            <FilterDialog showSort={true} className="fixed right-3 z-50" style={{ bottom: '5rem' }} />
          </div>

          {/* Desktop Filter Sidebar */}
          <div className="hidden sm:block">
            <FilterSidebar showSort={true} className="max-w-[265px] border border-border sticky top-16 px-6 space-y-[.65rem]" />
          </div>
        </div>
      </div>
    </FilterProvider>
  );
}
