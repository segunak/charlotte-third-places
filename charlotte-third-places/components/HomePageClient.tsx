"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FilterProvider } from '@/contexts/FilterContext';
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { Icons } from "@/components/Icons";
import nextDynamic from "next/dynamic";
import { Place } from "@/lib/types";

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

interface HomePageClientProps {
    places: Place[];
}

export default function HomePageClient({ places }: HomePageClientProps) {
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

                {/* Mobile-only instant action buttons */}
                <div className="sm:hidden grid grid-cols-3 gap-3 !mt-6 !mb-6">
                    {/* Stack Button - Instagram Pink with darker hover */}
                    <Button
                        onClick={() => {
                            const stackSection = document.getElementById('stack-section');
                            stackSection?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex flex-col items-center justify-center p-3 h-[4.5rem] bg-[hsl(var(--action-random))] hover:bg-[hsl(335,92%,46%)] text-white rounded-xl shadow-md active:scale-95 transition-all duration-200 border-0"
                    >
                        <Icons.shuffle className="text-white text-xl mb-1" />
                        <span className="text-white font-semibold text-sm">Random</span>
                    </Button>

                    {/* Map Button - Primary Teal (Center/Hero) */}
                    <Button
                        asChild
                        className="flex flex-col items-center justify-center p-3 h-[4.5rem] bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md active:scale-95 transition-all duration-200 transform scale-105 border-0"
                    >
                        <Link href="/map">
                            <Icons.map className="text-primary-foreground text-xl mb-1" />
                            <span className="text-primary-foreground font-semibold text-sm">Map</span>
                        </Link>
                    </Button>

                    {/* List Button - Purple with darker hover */}
                    <Button
                        onClick={() => {
                            const listSection = document.getElementById('list-section');
                            listSection?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex flex-col items-center justify-center p-3 h-[4.5rem] bg-[hsl(var(--action-browse))] hover:bg-[hsl(335,92%,46%)] text-white rounded-xl shadow-md active:scale-95 transition-all duration-200 border-0"
                    >
                        <Icons.list className="text-white text-xl mb-1" />
                        <span className="text-white font-semibold text-sm">Browse</span>
                    </Button>
                </div>

                <Separator />
                <div id="stack-section" className="text-2xl font-bold">
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

                <div id="list-section">
                    <PlaceListWithFilters places={places} />
                </div>
            </div>
        </FilterProvider>
    );
}
