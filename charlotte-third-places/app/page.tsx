import Link from "next/link";
import { REVALIDATE_TIME } from '@/lib/config';
import { getPlaces } from '@/lib/data-services';
import { DataTable } from "@/components/DataTable";
import { Separator } from "@/components/ui/separator";
import { FilterDialog } from '@/components/FilterDialog';
import { FilterProvider } from '@/contexts/FilterContext';
import { PlaceCardFeed } from "@/components/PlaceCardFeed";
import { FilterSidebar } from '@/components/FilterSidebar';
import { ResponsiveLink } from "@/components/ResponsiveLink";

// See https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration
// Also https://support.airtable.com/docs/getting-started-with-airtables-web-api
// Airtable has API call limits. Can't have every visit pulling new data.
export const revalidate = REVALIDATE_TIME;

export default async function HomePage() {
  const places = await getPlaces();

  // Shuffle places for PlaceCardFeed
  const shuffledPlaces = [...places];
  for (let i = shuffledPlaces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledPlaces[i], shuffledPlaces[j]] = [shuffledPlaces[j], shuffledPlaces[i]];
  }

  return (
    <FilterProvider places={places}>
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,_1fr)_260px] min-h-screen">
        {/* Main Content Section */}
        <section className="px-4 sm:px-20 py-8">
          {/* Intro Header */}
          <div className="mb-6 space-y-3">
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
              {" "} Click on any card to see more details.
              <span className="font-bold text-primary">
                {" "} Sort and filter the list using the {" "}
                <span className="sm:hidden">button in the lower-right corner.</span>
                <span className="hidden sm:inline">sidebar on the right.</span>
              </span>
            </p>
          </div>

          {/* Feed Section */}
          <div className="space-y-4">
            <Separator />
            <div className="text-2xl font-bold">Feed</div>
            <div className="max-w-full">
              <PlaceCardFeed places={shuffledPlaces} />
            </div>
            <Separator />
          </div>

          {/* DataTable Section */}
          <div className="text-2xl font-bold">All Places</div>
          <DataTable rowData={places} />
        </section>

        {/* Mobile Filter Dialog */}
        <div className="sm:hidden">
          <FilterDialog showSort={true} className="fixed right-3 z-50" style={{ bottom: '5rem' }} />
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden sm:block bg-background border-x border-border">
          <FilterSidebar showSort={true} className="max-w-[260px] sticky top-16 p-4 space-y-[.65rem]" />
        </div>
      </div>
    </FilterProvider>
  );
}
