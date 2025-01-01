"use client";

import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceModal } from "@/components/PlaceModal";
import React, { useState, useCallback } from "react";
import { shuffleArrayNoAdjacentDuplicates } from "@/lib/utils";
import { InfiniteMovingCards } from "@/components/InfiniteMovingCards"

export function ResponsivePlaceCards({ places }: { places: Place[] }) {
    const [hasItems, setHasItems] = useState<boolean>(false);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    //const [shuffledItems, setShuffledItems] = useState([...places, ...places]);
    const [shuffledItems, setShuffledItems] = useState(places.slice(0, 1));

    const shuffleItems = useCallback(() => {
        const shuffled = shuffleArrayNoAdjacentDuplicates(places);
        setShuffledItems([...shuffled, ...shuffled]);
    }, [places]);

    const handleItemsChange = (count: number) => {
        setHasItems(count > 0);
    };

    return (
        <div className="relative overflow-hidden max-w-full">
            {/* Desktop Carousel */}
            <InfiniteMovingCards
                className="hidden sm:block"
                items={shuffledItems}
                direction="right"
                speed="fast"
                pauseOnHover={false}
                onItemsChange={handleItemsChange}
            />

            {/* Mobile Random Card Picker */}
            <div className="sm:hidden mb-20">
                <PlaceCard
                    place={shuffledItems[0]}
                    onClick={() => setSelectedPlace(shuffledItems[0])}
                />
            </div>

            {/* Shuffle Button */}
            {hasItems && (
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
