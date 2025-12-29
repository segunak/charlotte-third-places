"use client";

import React, { useEffect, useState } from "react";
import { Place } from "@/lib/types";
import { PlaceCard } from "@/components/PlaceCard";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";

interface CardCarouselProps {
    items: Place[];
    initialIndex: number;
    total: number;
}

export const CardCarousel: React.FC<CardCarouselProps> = ({ items, initialIndex }) => {
    const [emblaApi, setEmblaApi] = useState<any>(null);

    // Scroll to the initialIndex only when the component mounts or items change
    useEffect(() => {
        if (emblaApi) {
            emblaApi.scrollTo(initialIndex, true); // Use true for instant scroll
        }
    }, [emblaApi, initialIndex, items]); // Depend on items to re-scroll after shuffle

    return (
        <div className="relative">
            <Carousel 
                setApi={setEmblaApi} 
                opts={{ 
                    loop: true, 
                    align: "center", 
                    skipSnaps: false, 
                    dragFree: false, 
                    startIndex: initialIndex
                }}
            >
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
