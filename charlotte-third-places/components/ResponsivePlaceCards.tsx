"use client";

import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { CardCarousel } from "@/components/CardCarousel";
import { shuffleArrayNoAdjacentDuplicates } from "@/lib/utils";
import { InfiniteMovingCards } from "@/components/InfiniteMovingCards";
import { PlaceCard } from "@/components/PlaceCard";
import React, {
    useState,
    useCallback,
    useEffect,
    useRef,
    useMemo,
} from "react";
import { FixedSizeList as List } from "react-window";

export function ResponsivePlaceCards({ places }: { places: Place[] }) {
    const shuffleTimeout = useRef<number | null>(null);
    const [hasItems, setHasItems] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    // Instead of shuffling the array, keep a shuffled order of indexes
    const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isShuffled, setIsShuffled] = useState<boolean>(false);

    // Create initial order: featured places first (by created date desc), then rest
    const getInitialOrder = useCallback(() => {
        const featuredPlaces: { index: number; place: Place }[] = [];
        const nonFeaturedPlaces: { index: number; place: Place }[] = [];

        places.forEach((place, index) => {
            if (place.featured) {
                featuredPlaces.push({ index, place });
            } else {
                nonFeaturedPlaces.push({ index, place });
            }
        });

        // Sort featured places by created date (newest first)
        featuredPlaces.sort((a, b) =>
            new Date(b.place.createdDate).getTime() - new Date(a.place.createdDate).getTime()
        );

        // Sort non-featured places by created date (newest first)
        nonFeaturedPlaces.sort((a, b) =>
            new Date(b.place.createdDate).getTime() - new Date(a.place.createdDate).getTime()
        );

        // Combine: featured first, then non-featured
        return [...featuredPlaces, ...nonFeaturedPlaces].map(item => item.index);
    }, [places]);

    // Shuffle logic: returns a shuffled array of indexes
    const shuffleIndexes = useCallback(() => {
        const arr = Array.from({ length: places.length }, (_, i) => i);
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }, [places.length]);
    // Shuffle handler
    const shuffleItems = useCallback(() => {
        if (shuffleTimeout.current) {
            clearTimeout(shuffleTimeout.current);
        }
        shuffleTimeout.current = window.setTimeout(() => {
            const newOrder = shuffleIndexes();
            setShuffledOrder(newOrder);
            setIsShuffled(true);
            // Trigger a state update to pass the new items and potentially the same index
            // to CardCarousel, signaling a programmatic scroll is needed.
            setCurrentIndex(idx => idx < newOrder.length ? idx : 0); // Ensure index is valid
        }, 0);
    }, [shuffleIndexes]); useEffect(() => {
        setIsLoading(true);
        const initialize = () => {
            // Use initial order on first load (featured first), not shuffled
            setShuffledOrder(getInitialOrder());
            setCurrentIndex(0);
            setIsShuffled(false);
            setIsLoading(false);
        };
        initialize();
    }, [getInitialOrder]);

    const handleItemsChange = (count: number) => {
        setHasItems(count > 0);
    };

    // Memoize the visible cards for CardCarousel (current, prev, next)
    const mobileCards = useMemo(() => {
        if (shuffledOrder.length === 0) return [];
        const prev = currentIndex > 0 ? shuffledOrder[currentIndex - 1] : null;
        const curr = shuffledOrder[currentIndex];
        const next = currentIndex < shuffledOrder.length - 1 ? shuffledOrder[currentIndex + 1] : null;
        return [prev, curr, next].filter(idx => idx !== null).map(idx => places[idx!]);
    }, [shuffledOrder, currentIndex, places]);

    // Virtualized Card Renderer for react-window
    const CardRow = ({ index, style }: { index: number; style: React.CSSProperties }) => (
        <div style={style}>
            <PlaceCard place={places[shuffledOrder[index]]} />
        </div>
    );

    // Only render a limited number of cards in InfiniteMovingCards (desktop)
    const VIRTUALIZED_CARD_COUNT = 12; // Show 12 at a time for animation, adjust as needed
    const visibleDesktopItems = shuffledOrder.slice(0, VIRTUALIZED_CARD_COUNT).map(idx => places[idx]);

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
                    speed="normal"
                    pauseOnHover={false}
                    onItemsChange={handleItemsChange}
                />
            </div>

            {/* Mobile Carousel (show all cards in shuffled order) */}
            <div className="sm:hidden mb-16 relative">
                <div className="flex items-center justify-center gap-4 mb-2 select-none" aria-hidden="true">
                    <Icons.arrowLeftRight className="h-8 w-8 text-primary" />
                </div>
                <CardCarousel
                    // Pass a key that changes when items change to force re-initialization if needed
                    key={shuffledOrder.join('-')}
                    items={shuffledOrder.map(idx => places[idx])}
                    // Pass currentIndex to indicate the target index after shuffle
                    initialIndex={currentIndex}
                    total={shuffledOrder.length}
                />
            </div>

            {/* Shuffle Button */}
            {hasItems && !isLoading && (
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
