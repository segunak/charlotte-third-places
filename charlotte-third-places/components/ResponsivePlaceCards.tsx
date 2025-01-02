"use client";

import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { CardStack } from "@/components/CardStack";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceModal } from "@/components/PlaceModal";
import { shuffleArrayNoAdjacentDuplicates } from "@/lib/utils";
import React, { useState, useCallback, useEffect } from "react";
import { InfiniteMovingCards } from "@/components/InfiniteMovingCards";

export function ResponsivePlaceCards({ places }: { places: Place[] }) {

    const CARDS = [
        {
            id: 0,
            name: "Manu Arora",
            designation: "Senior Software Engineer",
            content: (
                <p>
                    These cards are amazing, I want to use them in my
                    project. Framer motion is a godsend ngl tbh fam 🙏
                </p>
            ),
        },
        {
            id: 1,
            name: "Elon Musk",
            designation: "Senior Shitposter",
            content: (
                <p>
                    I dont like this Twitter thing,{" "}
                    deleting it right away because yolo. Instead, I
                    would like to call it X.com so that it can easily
                    be confused with adult sites.
                </p>
            ),
        },
        {
            id: 2,
            name: "Tyler Durden",
            designation: "Manager Project Mayhem",
            content: (
                <p>
                    The first rule of
                    Fight Club is that you do not talk about fight
                    club. The second rule of
                    Fight club is that you DO NOT TALK about fight
                    club.
                </p>
            ),
        },
    ];


    const [hasItems, setHasItems] = useState<boolean>(false);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [shuffledItems, setShuffledItems] = useState<Place[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

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

            {/* Mobile Random Card Picker */}
            <div className="sm:hidden mb-20">
                {/* {shuffledItems.length > 0 && (
                    <PlaceCard
                        place={shuffledItems[0]}
                        onClick={() => setSelectedPlace(shuffledItems[0])}
                    />
                )} */}

                <div className="h-[40rem] flex items-center justify-center w-full">
                    <CardStack items={CARDS} />
                </div>
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
