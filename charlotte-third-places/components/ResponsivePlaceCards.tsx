"use client";

import { Place } from "@/lib/types";
import { useFilters, useQuickSearch, useSort } from "@/contexts/FilterContext";
import { normalizeTextForSearch } from '@/lib/utils';
import { placeMatchesFilters } from '@/lib/filters';
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { CardCarousel } from "@/components/CardCarousel";
import { InfiniteMovingCards } from "@/components/InfiniteMovingCards";
import { FilteredEmptyState } from "@/components/FilteredEmptyState";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import React, {
    useState,
    useCallback,
    useEffect,
    useRef,
    useMemo
} from "react";

/**
 * DesktopInfiniteCarousel - Isolated component for desktop carousel.
 * 
 * PERFORMANCE CRITICAL: This component does NOT consume useFilters/useQuickSearch/useSort.
 * It only receives `places` as a prop, so filter changes in the parent don't trigger re-renders
 * of the 100 PlaceCards inside InfiniteMovingCards.
 * 
 * The desktop carousel intentionally ignores filters and shows a random sampling of all places.
 */
interface DesktopInfiniteCarouselProps {
    places: Place[];
    onShuffle: () => void;
}

const DesktopInfiniteCarousel = React.memo(function DesktopInfiniteCarousel({ 
    places, 
    onShuffle 
}: DesktopInfiniteCarouselProps) {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);

    // Fisher-Yates shuffle
    const shuffleIndexes = useCallback((length: number) => {
        const arr = Array.from({ length }, (_, i) => i);
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }, []);

    // Initialize shuffle order on mount or when places change
    useEffect(() => {
        setIsLoading(true);
        setShuffledOrder(shuffleIndexes(places.length));
        setIsLoading(false);
    }, [shuffleIndexes, places.length]);

    // Handle shuffle button click
    const handleShuffle = useCallback(() => {
        setShuffledOrder(shuffleIndexes(places.length));
        onShuffle();
    }, [shuffleIndexes, places.length, onShuffle]);

    // Limit to 100 cards for performance
    const VIRTUALIZED_CARD_COUNT = 100;
    const visibleItems = useMemo(
        () => shuffledOrder.slice(0, VIRTUALIZED_CARD_COUNT).map(idx => places[idx]).filter(Boolean),
        [shuffledOrder, places]
    );

    // Stable empty callback - InfiniteMovingCards calls this but we don't need to track count
    const handleItemsChange = useCallback(() => {}, []);

    return (
        <div className="relative">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
                    <LoadingSpinner />
                </div>
            )}
            <InfiniteMovingCards
                items={visibleItems}
                direction="right"
                speed="450s"
                pauseOnHover={false}
                onItemsChange={handleItemsChange}
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                <Button
                    className="h-10 w-10 flex items-center justify-center rounded-full shadow-lg bg-background border border-border border-primary hover:bg-muted"
                    size="icon"
                    onClick={handleShuffle}
                >
                    <Icons.shuffle className="h-5 w-5 text-primary" />
                </Button>
            </div>
        </div>
    );
});

DesktopInfiniteCarousel.displayName = 'DesktopInfiniteCarousel';

export function ResponsivePlaceCards({ places }: { places: Place[] }) {
    // Mobile-only: Consume filter contexts (desktop carousel is isolated and doesn't use these)
    const { filters } = useFilters();
    const { quickFilterText } = useQuickSearch();
    const { sortOption } = useSort();
    const shuffleTimeout = useRef<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // Mobile shuffled order (over filtered set)
    const [mobileShuffledOrder, setMobileShuffledOrder] = useState<number[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    // Apply quick text filter + structured filters + sorting to the incoming places prop (mobile only)
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

    // Generic Fisher-Yates shuffle for an index range (mobile only)
    const shuffleIndexes = useCallback((length: number) => {
        const arr = Array.from({ length }, (_, i) => i);
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }, []);

    // Mobile shuffle handler
    const shuffleMobileItems = useCallback(() => {
        if (shuffleTimeout.current) {
            clearTimeout(shuffleTimeout.current);
        }
        shuffleTimeout.current = window.setTimeout(() => {
            const newMobile = shuffleIndexes(filteredPlaces.length);
            setMobileShuffledOrder(newMobile);
            setCurrentIndex(idx => idx < newMobile.length ? idx : 0);
        }, 0);
    }, [shuffleIndexes, filteredPlaces.length]);

    // Desktop shuffle is handled by DesktopInfiniteCarousel - this is just a no-op callback
    const handleDesktopShuffle = useCallback(() => {}, []);

    // Reinitialize mobile order whenever filteredPlaces changes (filters applied)
    useEffect(() => {
        setMobileShuffledOrder(Array.from({ length: filteredPlaces.length }, (_, i) => i));
        setCurrentIndex(0);
    }, [filteredPlaces]);

    // Memoize mobile carousel items to prevent new array reference on each render
    const mobileCarouselItems = useMemo(
        () => mobileShuffledOrder.map(i => filteredPlaces[i]).filter(Boolean),
        [mobileShuffledOrder, filteredPlaces]
    );

    return (
        <div className="relative overflow-hidden max-w-full">
            {/* Desktop Virtualized Carousel - Isolated component that doesn't re-render on filter changes */}
            <div className="hidden sm:block">
                <DesktopInfiniteCarousel places={places} onShuffle={handleDesktopShuffle} />
            </div>

            {/* Mobile area: persistent height so button position is stable */}
            <div
                className="sm:hidden relative"
                style={{ minHeight: 325 }}
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
                        <LoadingSpinner />
                    </div>
                )}
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
                            items={mobileCarouselItems}
                            initialIndex={currentIndex}
                            total={mobileShuffledOrder.length}
                        />
                    </>
                )}
                {/* Mobile Shuffle Button - only when there are filtered results */}
                {filteredPlaces.length > 0 && !isLoading && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                        <Button
                            className="h-10 w-10 flex items-center justify-center rounded-full shadow-lg bg-background border border-border border-primary hover:bg-muted"
                            size="icon"
                            onClick={shuffleMobileItems}
                        >
                            <Icons.shuffle className="h-5 w-5 text-primary" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
