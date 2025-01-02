import Link from "next/link";
import { REVALIDATE_TIME } from '@/lib/config';
import { getPlaces } from '@/lib/data-services';
import { Separator } from "@/components/ui/separator";
import { FilterProvider } from '@/contexts/FilterContext';
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { ResponsivePlaceCards } from "@/components/ResponsivePlaceCards";
import { PlaceListWithFilters } from "@/components/PlaceListWithFilters";

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
          <span className="font-bold text-primary">Click on any card to see more info about a place.</span>
        </p>

        <Separator className="sm:hidden" />

        <div className="sm:hidden space-y-4">
          <div className="text-xl font-bold">Carousel</div>
          <p><span className="font-bold text-primary">Swipe right</span> to explore various places. Feeling adventurous? Click the <span className="font-bold text-primary">shuffle button</span> for a random pick!</p>
        </div>
        <ResponsivePlaceCards places={places} />

        <div className="sm:-mx-4 sm:-mx-20">
          <Separator />
        </div>

        <PlaceListWithFilters places={places} />
      </div>
    </FilterProvider>
  );
}
