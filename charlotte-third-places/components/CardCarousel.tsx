"use client";

import React, { memo, useEffect, useRef, useState } from "react";
import { Place } from "@/lib/types";
import { PlaceCard } from "@/components/PlaceCard";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from "@/components/ui/carousel";
import useEmblaCarousel from "embla-carousel-react";

interface CardCarouselProps {
    items: Place[];
    currentIndex: number;
    total: number;
    onSwipe: (direction: 'next' | 'prev') => void;
}

const MemoPlaceCard = memo(PlaceCard);

export const CardCarousel: React.FC<CardCarouselProps> = ({ items, currentIndex, onSwipe }) => {
    const [emblaApi, setEmblaApi] = useState<any>(null);
    const prevIndexRef = useRef(currentIndex);
    // Track if scroll is programmatic (e.g., after shuffle)
    const isProgrammaticScroll = useRef(false);

    // Scroll to the currentIndex when it changes
    useEffect(() => {
        if (emblaApi && typeof currentIndex === "number") {
            isProgrammaticScroll.current = true;
            emblaApi.scrollTo(currentIndex);
        }
    }, [emblaApi, currentIndex]);

    // Listen for user swipes and call onSwipe
    useEffect(() => {
        if (!emblaApi) return;
        const onSelect = () => {
            const selected = emblaApi.selectedScrollSnap();
            const prev = prevIndexRef.current;
            if (selected !== prev) {
                // Only call onSwipe if not a programmatic scroll
                if (isProgrammaticScroll.current) {
                    isProgrammaticScroll.current = false;
                } else {
                    // Determine direction (handles looping)
                    const direction = (selected === (prev + 1) % items.length) ? "next" : "prev";
                    onSwipe(direction);
                }
                prevIndexRef.current = selected;
            }
        };
        emblaApi.on("select", onSelect);
        return () => {
            emblaApi.off("select", onSelect);
        };
    }, [emblaApi, items.length, onSwipe]);

    return (
        <div className="relative">
            <Carousel setApi={setEmblaApi} opts={{ loop: true, align: "center", skipSnaps: false, dragFree: false }}>
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
