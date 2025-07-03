export const dynamic = "force-static";

import Link from "next/link";
import { getPlaces } from '@/lib/data-services';
import { Separator } from "@/components/ui/separator";
import { FilterProvider } from '@/contexts/FilterContext';
import { ResponsiveLink } from "@/components/ResponsiveLink";
import nextDynamic from "next/dynamic";

const ResponsivePlaceCards = nextDynamic(() => import("@/components/ResponsivePlaceCards").then(mod => mod.ResponsivePlaceCards), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center">
      <div className="loader animate-spin ease-linear rounded-full border-4 border-t-4 border-primary h-12 w-12 border-t-transparent"></div>
    </div>
  )
});

const PlaceListWithFilters = nextDynamic(() => import("@/components/PlaceListWithFilters").then(mod => mod.PlaceListWithFilters), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center">
      <div className="loader animate-spin ease-linear rounded-full border-4 border-t-4 border-primary h-12 w-12 border-t-transparent"></div>
    </div>
  )
});

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
            You can also check out the <Link href="/map" className="custom-link">map view</Link>, <Link href="/contribute" className="custom-link">share feedback</Link>, or <Link href="/about" className="custom-link">learn about this project</Link>.
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
            <span className="font-bold text-primary">Swipe</span> to explore.
          </span>{" "}

          {/* Show "tap" on mobile, "click" on desktop */}
          <span>
            <span className="inline sm:hidden">Tap</span>
            <span className="hidden sm:inline">Click</span>
          </span>{" "}
          
          {/* Always visible text */}
          any card for more info. Want a random suggestion? Use the{" "}
          <span className="font-bold text-primary">shuffle</span> button to switch things up!
        </p>

        <ResponsivePlaceCards places={placesFilteredByName} />

        <div className="sm:-mx-4 sm:-mx-20">
          <Separator />
        </div>

        <PlaceListWithFilters places={places} />
      </div>
    </FilterProvider>
  );
}