"use client";

import { cn } from "@/lib/utils";
import { Place } from "@/lib/types";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceModal } from "@/components/PlaceModal";
import React, { useEffect, useState, useRef, useCallback } from "react";

type Direction = "left" | "right";
type Speed = "fast" | "normal" | "slow";

export const InfiniteMovingCards = ({
    items,
    direction = "right", // Default to "right"
    speed = "normal", // Default to "normal"
    pauseOnHover = true,
    className,
}: {
    items: Place[];
    direction?: Direction;
    speed?: Speed;
    pauseOnHover?: boolean;
    className?: string;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollerRef = useRef<HTMLUListElement>(null);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Duplicate items array for an infinite "marquee" effect
    const repeatedItems = [...items, ...items];

    // Set the speed for scrolling animation via CSS variables
    const getSpeed = useCallback(() => {
        if (scrollerRef.current) {
            const speedMapping: Record<Speed, string> = {
                fast: "500s",
                normal: "1500s",
                slow: "3500s",
            };
            scrollerRef.current.style.setProperty(
                "--animation-duration",
                speedMapping[speed] ?? "1500s" // Default to "normal"
            );
        }
    }, [speed]);

    // Set the direction for scrolling animation via CSS variables
    const getDirection = useCallback(() => {
        if (scrollerRef.current) {
            scrollerRef.current.style.setProperty(
                "--animation-direction",
                direction === "left" ? "forwards" : "reverse" // Default to "right" = "reverse"
            );
        }
    }, [direction]);

    // Initialize animation settings and stop loading spinner
    useEffect(() => {
        getSpeed();
        getDirection();
        setIsLoading(false); // Loading is complete once settings are applied
    }, [getSpeed, getDirection]);

    return (
        <div className="relative">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                    <div className="loader animate-spin ease-linear rounded-full border-4 border-t-4 border-primary h-12 w-12 border-t-transparent"></div>
                </div>
            )}
            <div
                ref={containerRef}
                className={cn(
                    "scroller relative z-0 max-w-full overflow-hidden",
                    "[mask-image:linear-gradient(to_right,transparent,white_5%,white_95%,transparent)]",
                    className
                )}
            >
                <ul
                    ref={scrollerRef}
                    className={cn(
                        "flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap animate-scroll",
                        pauseOnHover && "hover:[animation-play-state:paused]"
                    )}
                >
                    {repeatedItems.map((place, idx) => (
                        <li
                            key={idx}
                            className="w-[400px] max-w-full relative"
                        >
                            <PlaceCard
                                place={place}
                                onClick={() => setSelectedPlace(place)}
                            />
                        </li>
                    ))}
                </ul>
            </div>

            {selectedPlace && (
                <PlaceModal
                    place={selectedPlace}
                    onClose={() => setSelectedPlace(null)}
                />
            )}
        </div>
    );
};
