"use client";

import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { PlaceModal } from "@/components/PlaceModal";
import { CardCarousel } from "@/components/CardCarousel";
import { shuffleArrayNoAdjacentDuplicates } from "@/lib/utils";
import React, { useState, useCallback, useEffect } from "react";
import { InfiniteMovingCards } from "@/components/InfiniteMovingCards";

export function ResponsivePlaceCards({ places }: { places: Place[] }) {
    const [hasItems, setHasItems] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [shuffledItems, setShuffledItems] = useState<Place[]>([]);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

    const shuffleItems = useCallback(() => {
        // Perform shuffling asynchronously to allow loader to render
        setTimeout(() => {
            const shuffled = shuffleArrayNoAdjacentDuplicates(places);
            setShuffledItems([...shuffled, ...shuffled]);
            setIsLoading(false);
        }, 0);
    }, [places]);

    useEffect(() => {
        shuffleItems();
    }, [shuffleItems]);

    const handleItemsChange = (count: number) => {
        setHasItems(count > 0);
    };

    return (
        <div className="relative overflow-hidden max-w-full">
            {/* Loader Spinner */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
                    <div className="loader animate-spin ease-linear rounded-full border-4 border-t-4 border-primary h-12 w-12 border-t-transparent"></div>
                </div>
            )}

            {/* Desktop Carousel */}
            <InfiniteMovingCards
                className="hidden sm:block"
                items={shuffledItems}
                direction="right"
                speed="normal"
                pauseOnHover={false}
                onItemsChange={handleItemsChange}
            />

            {/* Mobile Carousel */}
            <div className="sm:hidden mb-20">
                <CardCarousel items={shuffledItems} />
            </div>

            {/* Shuffle Button */}
            {hasItems && !isLoading && ( // Hide shuffle button when loading
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

            {selectedPlace && (
                <PlaceModal
                    place={selectedPlace}
                    onClose={() => setSelectedPlace(null)}
                />
            )}
        </div>
    );
}
