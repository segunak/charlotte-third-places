"use client";

import { cn } from "@/lib/utils";
import { Place } from "@/lib/types";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceModal } from "@/components/PlaceModal";
import { normalizeTextForSearch } from "@/lib/utils";
import { FilterContext } from "@/contexts/FilterContext";
import {
    useContext,
    useMemo,
    useRef,
    useState,
    useCallback,
    useEffect,
} from "react";
import { SortDirection, SortField } from "@/lib/types";

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
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollerRef = useRef<HTMLUListElement>(null);
    const [animationKey, setAnimationKey] = useState(0);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const { filters, quickFilterText, sortOption } = useContext(FilterContext);

    const speedMapping = useMemo(
        () => ({
            fast: "500s",
            normal: "1000s",
            slow: "3000s",
        }),
        []
    );

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

    const applySorting = useCallback(
        (data: Place[]) => {
            const { field, direction } = sortOption;

            if (field === SortField.Name) {
                return [...data].sort((a, b) =>
                    direction === SortDirection.Ascending
                        ? a.name.localeCompare(b.name)
                        : b.name.localeCompare(a.name)
                );
            }

            if (field === SortField.DateAdded || field === SortField.LastModified) {
                return [...data].sort((a, b) => {
                    const dateA = new Date(a[field]).getTime();
                    const dateB = new Date(b[field]).getTime();
                    return direction === SortDirection.Ascending ? dateA - dateB : dateB - dateA;
                });
            }

            // If field is not recognized, return data as is
            return data;
        },
        [sortOption]
    );

    // Filter the places using the context values
    const filteredItems = useMemo(() => {
        let filtered = items.filter((place) => {
            const matchesQuickSearch = normalizeTextForSearch(
                JSON.stringify(place)
            ).includes(normalizeTextForSearch(quickFilterText));

            const isTypeMatch =
                type.value === "all" ||
                (place.type && place.type.includes(type.value));

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

        filtered = applySorting(filtered);

        // If no items match, return empty array to handle gracefully
        if (filtered.length === 0) {
            return [];
        }

        // Determine how many times to duplicate the filtered items to match the original items length
        const duplicationFactor = Math.ceil(items.length / filtered.length);
        const duplicatedItems = Array.from(
            { length: duplicationFactor },
            () => filtered
        ).flat();

        // Slice the duplicated array to match the original items length
        return duplicatedItems.slice(0, items.length);
    }, [
        items,
        name.value,
        type.value,
        size.value,
        neighborhood.value,
        purchaseRequired.value,
        parkingSituation.value,
        freeWifi.value,
        hasCinnamonRolls.value,
        quickFilterText,
        applySorting,
    ]);

    // Determine the current speed and direction
    const currentSpeed = speedMapping[speed] || "1000s";
    const currentDirection = direction === "left" ? "forwards" : "reverse";

    // Restart the animation only when filters, sortOption, speed, or direction change
    useEffect(() => {
        if (filteredItems.length === 0) {
            // Optionally, handle the empty state here
            setIsLoading(false);
            return;
        }

        // Update the animation key to trigger re-render and restart animation
        setAnimationKey((prev) => prev + 1);

        setIsLoading(false);
    }, [
        name.value,
        type.value,
        size.value,
        neighborhood.value,
        purchaseRequired.value,
        parkingSituation.value,
        freeWifi.value,
        hasCinnamonRolls.value,
        sortOption.field,
        sortOption.direction,
        currentSpeed,
        currentDirection,
        filteredItems.length,
    ]);

    // Function to restart animation by resetting CSS animation
    const restartAnimation = useCallback(() => {
        if (scrollerRef.current) {
            scrollerRef.current.style.animation = "none";
            // Trigger reflow to restart the animation
            scrollerRef.current.offsetHeight;
            scrollerRef.current.style.animation = "";
        }
    }, []);

    // Restart animation whenever animationKey changes
    useEffect(() => {
        restartAnimation();
    }, [animationKey, restartAnimation]);

    // Handle cases when there are no items after filtering
    if (filteredItems.length === 0) {
        return (
            <div>
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                        <div className="loader animate-spin ease-linear rounded-full border-4 border-t-4 border-primary h-12 w-12 border-t-transparent"></div>
                    </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                    <p className="text-gray-500">No places match your filters.</p>
                </div>
            </div>
        );
    }

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
                    "scroller relative z-0 max-w-full overflow-hidden pb-10",
                    "[mask-image:linear-gradient(to_right,transparent,white_5%,white_95%,transparent)]",
                    className
                )}
            >
                <ul
                    key={animationKey} // Key to force re-render and restart animation only on filter, sort, speed, or direction changes
                    ref={scrollerRef}
                    className={cn(
                        "flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap animate-scroll",
                        pauseOnHover && "hover:[animation-play-state:paused]"
                    )}
                    style={{
                        "--animation-duration": currentSpeed,
                        "--animation-direction": currentDirection,
                    } as React.CSSProperties}
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
