"use client";

import React from "react";
import { Place } from "@/lib/types";
import { PlaceCard } from "@/components/PlaceCard";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from "@/components/ui/carousel";

interface CardCarouselProps {
    items: Place[];
}

export const CardCarousel: React.FC<CardCarouselProps> = ({ items }) => {
    return (
        <div className="relative">
            <Carousel>
                <CarouselContent>
                    {items.map((place, idx) => (
                        <CarouselItem key={`${place.name}-${idx}`} className="">
                            <PlaceCard place={place} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </div>
    );
};
