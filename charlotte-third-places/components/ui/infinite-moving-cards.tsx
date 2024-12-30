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
    direction = "right",
    speed = "fast",
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

    // Duplicate items array in React for an infinite "marquee" effect
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
                speedMapping[speed] ?? "40s"
            );
        }
    }, [speed]);

    // Set direction for scrolling animation via CSS variables
    const getDirection = useCallback(() => {
        if (scrollerRef.current) {
            scrollerRef.current.style.setProperty(
                "--animation-direction",
                direction === "left" ? "forwards" : "reverse"
            );
        }
    }, [direction]);

    // Initialize animation settings on mount and whenever speed/direction change
    useEffect(() => {
        getSpeed();
        getDirection();
    }, [getSpeed, getDirection]);

    return (
        <>
            <div
                ref={containerRef}
                className={cn(
                    "scroller relative z-20 max-w-full overflow-hidden",
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
        </>
    );
};
