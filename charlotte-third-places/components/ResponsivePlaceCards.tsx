"use client";

import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { CardCarousel } from "@/components/CardCarousel";
import { shuffleArrayNoAdjacentDuplicates } from "@/lib/utils";
import { InfiniteMovingCards } from "@/components/InfiniteMovingCards";
import React, {
    useState,
    useCallback,
    useEffect,
    useRef,
} from "react";

export function ResponsivePlaceCards({ places }: { places: Place[] }) {
    const shuffleTimeout = useRef<number | null>(null);
    const [hasItems, setHasItems] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [shuffledItems, setShuffledItems] = useState<Place[]>([]);

    const shuffleItems = useCallback(() => {
        if (shuffleTimeout.current) {
            clearTimeout(shuffleTimeout.current);
        }
        shuffleTimeout.current = window.setTimeout(() => {
            const shuffled = shuffleArrayNoAdjacentDuplicates(places);
            setShuffledItems(shuffled);
        }, 0);
    }, [places]);

    useEffect(() => {
        setIsLoading(true);
        const initialize = () => {
            shuffleItems();
            setIsLoading(false);
        };
        initialize();
    }, [shuffleItems]);

    const handleItemsChange = (count: number) => {
        setHasItems(count > 0);
    };

    return (
        <div className="relative overflow-hidden max-w-full">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
                    <div className="loader animate-spin ease-linear rounded-full border-4 border-t-4 border-primary h-12 w-12 border-t-transparent"></div>
                </div>
            )}

            {/* Desktop Carousel */}
            <div className="hidden sm:block">
                <InfiniteMovingCards
                    items={shuffledItems}
                    direction="right"
                    speed="normal"
                    pauseOnHover={false}
                    onItemsChange={handleItemsChange}
                />
            </div>

            {/* Mobile Carousel */}
            <div className="sm:hidden mb-16">
                <CardCarousel items={shuffledItems} />
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
