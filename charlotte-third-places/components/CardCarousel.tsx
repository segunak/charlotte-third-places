"use client";

import { Place } from "@/lib/types";
import React, { useState } from "react";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceModal } from "@/components/PlaceModal";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

interface CardCarouselProps {
    items: Place[];
}

export const CardCarousel: React.FC<CardCarouselProps> = ({ items }) => {
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

    return (
        <div className="relative">
            <Carousel>
                <CarouselContent>
                    {items.map((place, idx) => (
                        <CarouselItem key={`${place.name}-${idx}`} className="">
                            <PlaceCard
                                place={place}
                                onClick={() => setSelectedPlace(place)}
                            />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>

            {selectedPlace && (
                <PlaceModal
                    place={selectedPlace}
                    onClose={() => setSelectedPlace(null)}
                />
            )}
        </div>
    );
};
