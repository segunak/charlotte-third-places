"use client";

import { Place } from "@/lib/types";
import { FilterContext } from "@/contexts/FilterContext";
import { normalizeTextForSearch } from '@/lib/utils';
import { placeMatchesFilters } from '@/lib/utils';
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { CardCarousel } from "@/components/CardCarousel";
import { InfiniteMovingCards } from "@/components/InfiniteMovingCards";
import { FilteredEmptyState } from "@/components/FilteredEmptyState";
import { useIsMobile } from "@/hooks/use-mobile";
import React, {
    useState,
    useCallback,
    useEffect,
    useRef,
    useContext,
    useMemo
} from "react";

export function ResponsivePlaceCards({ places }: { places: Place[] }) {
    // Consume filtering context so discovery feed reflects current filters
    const { filters, quickFilterText, sortOption } = useContext(FilterContext);
    const isMobile = useIsMobile();
    const shuffleTimeout = useRef<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    // Desktop shuffled order (full data, ignores filters)
    const [desktopShuffledOrder, setDesktopShuffledOrder] = useState<number[]>([]);
    // Mobile shuffled order (over filtered set)
    const [mobileShuffledOrder, setMobileShuffledOrder] = useState<number[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    // Apply quick text filter + structured filters + sorting to the incoming places prop
    const filteredPlaces: Place[] = useMemo(() => {
        let data = places;
        if (quickFilterText.trim() !== "") {
            const needle = normalizeTextForSearch(quickFilterText);
            data = data.filter(p => normalizeTextForSearch(p.name || '').includes(needle));
        }

        data = data.filter((place: any) => placeMatchesFilters(place, filters));

        // Sorting: featured-first, then user-selected sort
        const sorted = [...data].sort((a: any, b: any) => {
            // First priority: Featured places come first
            if (a.featured !== b.featured) {
                return b.featured ? 1 : -1; // featured first
            }
            // Apply user's selected sorting next
            const { field, direction } = sortOption;
            const valueA = a[field] || "";
            const valueB = b[field] || "";
            if (field === 'name') {
                return direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
            }
            const dateA = new Date(valueA).getTime();
            const dateB = new Date(valueB).getTime();
            return direction === 'asc' ? dateA - dateB : dateB - dateA;
        });
        return sorted;
    }, [places, filters, quickFilterText, sortOption]);

    // Desktop ignores filters; we now want an initial random order each load (not fixed).

    // Generic Fisher-Yates shuffle for an index range
    const shuffleIndexes = useCallback((length: number) => {
        const arr = Array.from({ length }, (_, i) => i);
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }, []);

    const shuffleItems = useCallback(() => {
        if (shuffleTimeout.current) {
            clearTimeout(shuffleTimeout.current);
        }
        shuffleTimeout.current = window.setTimeout(() => {
            // Desktop shuffle over full dataset
            const newDesktop = shuffleIndexes(places.length);
            setDesktopShuffledOrder(newDesktop);
            // Mobile shuffle over current filtered dataset
            const newMobile = shuffleIndexes(filteredPlaces.length);
            setMobileShuffledOrder(newMobile);
            // Ensure currentIndex valid for mobile set
            setCurrentIndex(idx => idx < newMobile.length ? idx : 0);
        }, 0);
    }, [shuffleIndexes, places.length, filteredPlaces.length]);

    // Reinitialize desktop order when underlying data changes
    useEffect(() => {
        setIsLoading(true);
        const initialize = () => {
            // Initial load: random shuffle of all places
            setDesktopShuffledOrder(shuffleIndexes(places.length));
            setCurrentIndex(0);
            setIsLoading(false);
        };
        initialize();
    }, [shuffleIndexes, places.length]);

    // Reinitialize mobile order whenever filteredPlaces changes (filters applied)
    useEffect(() => {
        setMobileShuffledOrder(Array.from({ length: filteredPlaces.length }, (_, i) => i));
        setCurrentIndex(0);
    }, [filteredPlaces]);

    const handleItemsChange = () => { };

    // Only render a limited number of cards in InfiniteMovingCards (desktop)
    const VIRTUALIZED_CARD_COUNT = 100; // Show this many at a time for animation, adjust as needed
    const visibleDesktopItems = useMemo(
        () => desktopShuffledOrder.slice(0, VIRTUALIZED_CARD_COUNT).map(idx => places[idx]).filter(Boolean),
        [desktopShuffledOrder, places]
    );

    return (
        <div className="relative overflow-hidden max-w-full">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
                    <div className="loader animate-spin ease-linear rounded-full border-4 border-t-4 border-primary h-12 w-12 border-t-transparent"></div>
                </div>
            )}

            {/* Desktop Virtualized Carousel */}
            <div className="hidden sm:block">
                <InfiniteMovingCards
                    items={visibleDesktopItems}
                    direction="right"
                    speed="450s"
                    pauseOnHover={false}
                    onItemsChange={handleItemsChange}
                />
            </div>

            {/* Mobile area: persistent height so button position is stable */}
            <div
                className="sm:hidden relative"
                style={{ minHeight: 325 }}
            >
                {!isLoading && filteredPlaces.length === 0 ? (
                    <FilteredEmptyState
                        description="Adjust or reset your filters to see places in this discovery feed."
                        fullHeight
                    />
                ) : (
                    <>
                        <div className="flex items-center justify-center gap-4 mb-2 select-none" aria-hidden="true">
                            <Icons.arrowLeftRight className="h-8 w-8 text-primary" />
                        </div>
                        <CardCarousel
                            key={mobileShuffledOrder.join('-')}
                            items={mobileShuffledOrder.map(i => filteredPlaces[i]).filter(Boolean)}
                            initialIndex={currentIndex}
                            total={mobileShuffledOrder.length}
                        />
                    </>
                )}
            </div>

            {/* Shuffle Button: Always visible on desktop; on mobile only when there are filtered results */}
            {(!isMobile || (filteredPlaces.length > 0 && !isLoading)) && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                    <Button
                        className="h-10 w-10 flex items-center justify-center rounded-full shadow-lg bg-background border border-border border-primary hover:bg-muted"
                        size="icon"
                        onClick={shuffleItems}
                    >
                        <Icons.shuffle className="h-5 w-5 text-primary" />
                    </Button>
                </div>
            )}
        </div>
    );
}
