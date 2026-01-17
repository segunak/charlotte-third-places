"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FilterProvider } from '@/contexts/FilterContext';
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { Icons } from "@/components/Icons";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import nextDynamic from "next/dynamic";
import { Place } from "@/lib/types";

const ResponsivePlaceCards = nextDynamic(() => import("@/components/ResponsivePlaceCards").then(mod => mod.ResponsivePlaceCards), {
    ssr: false,
    loading: () => (
        <div className="h-64 flex items-center justify-center">
            <LoadingSpinner />
        </div>
    )
});

const PlaceListWithFilters = nextDynamic(() => import("@/components/PlaceListWithFilters").then(mod => mod.PlaceListWithFilters), {
    ssr: false,
    loading: () => (
        <div className="h-64 flex items-center justify-center">
            <LoadingSpinner />
        </div>
    )
});

interface HomePageClientProps {
    places: Place[];
}

export default function HomePageClient({ places }: HomePageClientProps) {
    // People complain "oh Starbucks and Panera are boring I already knew about them". So to appease them, they're excluded from the responsive components used for discovering places, but they do appear in the full DataTable list.
    const excludedNames = ["Starbucks", "Panera"];
    const placesFilteredByName = places.filter(place => !new RegExp(excludedNames.join("|"), "i").test(place.name));

    return (
        <FilterProvider places={places}>
            <div className="min-h-screen site-padding-x py-8 space-y-4">
                <h1 className="text-3xl font-bold">
                    Explore <span className="text-primary">{places.length}</span> Third Places in{" "}
                    <span className="sm:hidden">Charlotte</span>
                    <span className="hidden sm:inline">Charlotte, North Carolina</span>
                </h1>
                <p>
                    Discover <ResponsiveLink href="https://en.wikipedia.org/wiki/Third_place">third places</ResponsiveLink> in Charlotte, North Carolina and its <ResponsiveLink href="https://en.wikipedia.org/wiki/Charlotte_metropolitan_area">surrounding areas</ResponsiveLink>. {" "}
                    <span className="hidden sm:inline">
                        If you're not sure where to start, you can <Link href="/chat" className="custom-link">ask AI for recommendations</Link>. You can also check out the <Link href="/map" className="custom-link">map view</Link>, <Link href="/contribute" className="custom-link">share feedback</Link>, or <Link href="/about" className="custom-link">learn about this project</Link>.
                    </span>
                </p>

                {/* Desktop Hero AI Section - Entire banner is clickable */}
                <Link href="/chat" className="hidden sm:block group">
                    <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-primary/20 rounded-xl p-6 flex items-center justify-between transition-all duration-200 hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5 cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary/20 rounded-full p-3 transition-colors group-hover:bg-primary/30">
                                <Icons.chat className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Not sure where to go?</h2>
                                <p className="text-muted-foreground">Get personalized recommendations from our AI assistant</p>
                            </div>
                        </div>
                        <div className="bg-primary text-primary-foreground font-semibold px-6 py-2 rounded-md flex items-center transition-colors group-hover:bg-primary/90">
                            Get Recommendations
                            <Icons.arrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </div>
                </Link>

                {/* Mobile-only instant action buttons */}
                <div className="sm:hidden grid grid-cols-4 gap-3 !mt-6 !mb-6">
                    {/* Random Button */}
                    <Button
                        onClick={() => {
                            const stackSection = document.getElementById('stack-section');
                            if (stackSection) {
                                const yOffset = -80; // Offset to show the heading clearly
                                const y = stackSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                window.scrollTo({ top: y, behavior: 'smooth' });
                            }
                        }}
                        className="flex flex-col items-center justify-center p-3 h-[4.5rem]
                                   bg-secondary hover:bg-secondary/90 text-primary-foreground
                                   rounded-xl shadow-md active:scale-95 transition-all duration-200 border-0"
                    >
                        <Icons.shuffle className="text-primary-foreground text-xl mb-1" />
                        <span className="text-primary-foreground font-semibold text-sm">Random</span>
                    </Button>

                    {/* Map Button */}
                    <Button
                        asChild
                        className="flex flex-col items-center justify-center p-3 h-[4.5rem] bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md active:scale-95 transition-all duration-200 border-0"
                    >
                        <Link href="/map">
                            <Icons.map className="text-primary-foreground text-xl mb-1" />
                            <span className="text-primary-foreground font-semibold text-sm">Map</span>
                        </Link>
                    </Button>

                    {/* Chat Button */}
                    <Button
                        asChild
                        className="flex flex-col items-center justify-center p-3 h-[4.5rem]
                                   bg-secondary hover:bg-secondary/90 text-primary-foreground
                                   rounded-xl shadow-md active:scale-95 transition-all duration-200 border-0"
                    >
                        <Link href="/chat">
                            <Icons.chat className="text-primary-foreground text-xl mb-1" />
                            <span className="text-primary-foreground font-semibold text-sm">Chat</span>
                        </Link>
                    </Button>

                    {/* Browse Button */}
                    <Button
                        onClick={() => {
                            const browseSection = document.getElementById('browse-section');
                            if (browseSection) {
                                const yOffset = -80; // Offset to show the heading clearly
                                const y = browseSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                window.scrollTo({ top: y, behavior: 'smooth' });
                            }
                        }}
                        className="flex flex-col items-center justify-center p-3 h-[4.5rem]
                                   bg-primary hover:bg-primary/90 text-primary-foreground
                                   rounded-xl shadow-md active:scale-95 transition-all duration-200 border-0"
                    >
                        <Icons.list className="text-primary-foreground text-xl mb-1" />
                        <span className="text-primary-foreground font-semibold text-sm">Browse</span>
                    </Button>
                </div>

                <Separator />
                <div id="stack-section" className="text-2xl font-bold">
                    {/* Shown on mobile */}
                    <span className="inline sm:hidden">Random</span>
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

                    {/* Always visible text on mobile */}
                    any card for more info. For a random suggestion, use the{" "}
                    <span className="font-bold text-primary">shuffle</span> button, or{" "}
                    <Link href="/chat" className="custom-link font-semibold">ask AI</Link> for personalized picks!
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
