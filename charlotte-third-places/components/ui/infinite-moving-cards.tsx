"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Place } from "@/lib/types";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceModal } from "@/components/PlaceModal";

type Direction = "left" | "right";
type Speed = "fast" | "normal" | "slow";

export const InfiniteMovingCards = ({
    items,
    direction = "left",
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
    const [start, setStart] = useState(false);

    // Set speed for scrolling animation
    const getSpeed = useCallback(() => {
        if (scrollerRef.current) {
            const speedMapping: Record<Speed, string> = {
                fast: "20s",
                normal: "40s",
                slow: "3500s",
            };
            scrollerRef.current.style.setProperty(
                "--animation-duration",
                speedMapping[speed] ?? "40s"
            );
        }
    }, [speed]);

    // Set direction for scrolling animation
    const getDirection = useCallback(() => {
        if (scrollerRef.current) {
            scrollerRef.current.style.setProperty(
                "--animation-direction",
                direction === "left" ? "forwards" : "reverse"
            );
        }
    }, [direction]);

    // Add animation logic and duplicate items for infinite scrolling
    const addAnimation = useCallback(() => {
        if (scrollerRef.current) {
            const scrollerContent = Array.from(scrollerRef.current.children);
            scrollerContent.forEach((item) => {
                const clonedItem = item.cloneNode(true);
                if (scrollerRef.current) {
                    scrollerRef.current.appendChild(clonedItem);
                }
            });

            getSpeed();
            getDirection();
            setStart(true);
        }
    }, [getSpeed, getDirection]);

    useEffect(() => {
        addAnimation();
    }, [addAnimation]);

    return (
        <>
            <div
                ref={containerRef}
                className={cn(
                    "scroller relative z-20 max-w-7xl overflow-hidden",
                    "[mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
                    className
                )}
            >
                <ul
                    ref={scrollerRef}
                    className={cn(
                        "flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap",
                        start && "animate-scroll",
                        pauseOnHover && "hover:[animation-play-state:paused]"
                    )}
                >
                    {items.map((place, idx) => (
                        <li
                            key={idx}
                            className="w-[400px] max-w-full relative rounded-2xl border border-b-0 flex-shrink-0"
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
