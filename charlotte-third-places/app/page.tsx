import Link from "next/link";
import { getPlaces } from '@/lib/data-services';
import { Separator } from "@/components/ui/separator";
import { FilterProvider } from '@/contexts/FilterContext';
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { ResponsivePlaceCards } from "@/components/ResponsivePlaceCards";
import { PlaceListWithFilters } from "@/components/PlaceListWithFilters";

// See https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
export const dynamic = "force-static"

export default async function HomePage() {
  const places = await getPlaces();
  // People complain "oh Starbucks and Panera are boring I already knew about them". So to appease such people, they're excluded from the responsive components used for discovering places, but they do appear in the full DataTable list.
  const excludedNames = ["Starbucks", "Panera"];
  const placesFilteredByName = places.filter(place => !new RegExp(excludedNames.join("|"), "i").test(place.name));

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
        </p>
        <Separator />
        <div className="text-2xl font-bold">
          {/* Shown on mobile */}
          <span className="inline sm:hidden">Stack</span>
          {/* Shown on desktop */}
          <span className="hidden sm:inline">Feed</span>
        </div>
        <p className="text-pretty">
          {/* Shown on mobile only */}
          <span className="inline sm:hidden">
            <span className="font-bold text-primary">Swipe left</span> to explore various places.
          </span>{" "}

          {/* Always visible text */}
          <span className="font-bold text-primary">Click any card</span> for more info about a place. If you're feeling adventurous,{" "}
          <span className="font-bold text-primary">click the shuffle button</span>{" "}

          {/* Shown on mobile only */}
          <span className="inline sm:hidden">for a random place!</span>
          {/* Shown on desktop only */}
          <span className="hidden sm:inline">to switch things up!</span>
        </p>

        <ResponsivePlaceCards places={placesFilteredByName} />

        <div className="sm:-mx-4 sm:-mx-20">
          <Separator />
        </div>

        <PlaceListWithFilters places={placesFilteredByName} />
      </div>
    </FilterProvider>
  );
}