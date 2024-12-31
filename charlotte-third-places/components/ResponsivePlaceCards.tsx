"use client";

import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";
import { shuffleArray } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceModal } from "@/components/PlaceModal";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { InfiniteMovingCards } from "@/components/InfiniteMovingCards"

export function ResponsivePlaceCards({ places }: { places: Place[] }) {
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [shuffledItems, setShuffledItems] = useState([...places, ...places]);
    const shuffleItems = () => {
        const shuffled = shuffleArray(places);
        setShuffledItems([...shuffled, ...shuffled]); // Update state with shuffled items
    };

    return (
        <div className="relative overflow-hidden">
            {/* Desktop Carousel */}
            <InfiniteMovingCards
                className="hidden sm:block"
                items={shuffledItems}
                direction="right"
                speed="normal"
                pauseOnHover={false}
            />

            {/* Mobile Random Card Picker */}
            <div className="sm:hidden mb-20">
                <PlaceCard
                    place={shuffledItems[0]}
                    onClick={() => setSelectedPlace(shuffledItems[0])}
                />
            </div>

            {/* Shuffle Button */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                <Button
                    className="h-10 w-10 flex items-center justify-center rounded-full shadow-lg bg-background border border-border border-primary hover:bg-muted"
                    size="icon"
                    onClick={shuffleItems}
                >
                    <Icons.shuffle className="h-5 w-5 text-primary" />
                </Button>
            </div>

            {selectedPlace && (
                <PlaceModal
                    place={selectedPlace}
                    onClose={() => setSelectedPlace(null)}
                />
            )}
        </div>
    );
}