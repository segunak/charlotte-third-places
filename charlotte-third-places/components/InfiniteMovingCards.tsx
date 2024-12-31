"use client";

import { cn } from "@/lib/utils";
import { Place } from "@/lib/types";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceModal } from "@/components/PlaceModal";
import { normalizeTextForSearch } from "@/lib/utils";
import { FilterContext } from "@/contexts/FilterContext";
import { useContext, useMemo, useRef, useState, useCallback, useEffect } from "react";

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
    const { filters, quickFilterText } = useContext(FilterContext); // Use FilterContext
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const speedMapping = useMemo(
        () => ({
            fast: "500s",
            normal: "1000s",
            slow: "3000s",
        }),
        []
    );

    // Filter the places using the context values
    const filteredItems = useMemo(() => {
        return items.filter((place) => {
            const {
                name,
                type,
                size,
                neighborhood,
                purchaseRequired,
                parkingSituation,
                freeWifi,
                hasCinnamonRolls,
            } = filters;

            const matchesQuickSearch = normalizeTextForSearch(JSON.stringify(place)).includes(
                normalizeTextForSearch(quickFilterText)
            );

            const isTypeMatch =
                type.value === "all" || (place.type && place.type.includes(type.value));

            return (
                matchesQuickSearch &&
                isTypeMatch &&
                (name.value === "all" || place.name === name.value) &&
                (size.value === "all" || place.size === size.value) &&
                (neighborhood.value === "all" || place.neighborhood === neighborhood.value) &&
                (purchaseRequired.value === "all" || place.purchaseRequired === purchaseRequired.value) &&
                (parkingSituation.value === "all" || place.parkingSituation === parkingSituation.value) &&
                (freeWifi.value === "all" || place.freeWifi === freeWifi.value) &&
                (hasCinnamonRolls.value === "all" || place.hasCinnamonRolls === hasCinnamonRolls.value)
            );
        });
    }, [items, filters, quickFilterText]);

    // Set the speed for scrolling animation via CSS variables
    const setSpeed = useCallback(
        (currentSpeed: Speed) => {
            if (scrollerRef.current) {
                scrollerRef.current.style.setProperty(
                    "--animation-duration",
                    speedMapping[currentSpeed] ?? "1500s"
                );
            }
        },
        [speedMapping]
    );

    // Set the direction for scrolling animation via CSS variables
    const setDirection = useCallback(() => {
        if (scrollerRef.current) {
            scrollerRef.current.style.setProperty(
                "--animation-direction",
                direction === "left" ? "forwards" : "reverse"
            );
        }
    }, [direction]);

    // Initialize animation settings
    useEffect(() => {
        setSpeed(speed);
        setDirection();
        setIsLoading(false); // Loading is complete once settings are applied
    }, [setSpeed, setDirection, speed]);

    return (
        <div>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                    <div className="loader animate-spin ease-linear rounded-full border-4 border-t-4 border-primary h-12 w-12 border-t-transparent"></div>
                </div>
            )}
            <div
                ref={containerRef}
                className={cn(
                    "scroller relative z-0 max-w-full overflow-hidden pb-10",
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
                    {filteredItems.map((place, idx) => (
                        <li
                            key={idx}
                            className="w-[350px] sm:w-[400px] max-w-full relative"
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
