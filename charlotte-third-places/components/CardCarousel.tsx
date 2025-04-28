"use client";

import React, { memo } from "react";
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
    currentIndex: number;
    total: number;
    onSwipe: (direction: 'next' | 'prev') => void;
}

const MemoPlaceCard = memo(PlaceCard);

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
            </Carousel>
        </div>
    );
};
