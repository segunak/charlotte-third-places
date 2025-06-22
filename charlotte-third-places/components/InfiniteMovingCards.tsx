"use client";

import { cn } from "@/lib/utils";
import { Place } from "@/lib/types";
import { PlaceCard } from "@/components/PlaceCard";
import {
    useRef,
    useState,
    useCallback,
    useEffect,
    useMemo
} from "react";

type Direction = "left" | "right";
type Speed = "fast" | "normal" | "slow" | string;

interface InfiniteMovingCardsProps {
    items: Place[];
    direction?: Direction;
    speed?: Speed;
    pauseOnHover?: boolean;
    className?: string;
    onItemsChange?: (count: number) => void;
}

export const InfiniteMovingCards = ({
    items,
    direction = "right",
    speed = "normal",
    pauseOnHover = true,
    className,
    onItemsChange,
}: InfiniteMovingCardsProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollerRef = useRef<HTMLUListElement>(null);
    const [animationKey, setAnimationKey] = useState(0);
    const speedMapping = useMemo(
        () => ({
            fast: "20s",
            normal: "50s",
            slow: "80s",
        }),
        []
    );

    // Notify parent about the number of items
    useEffect(() => {
        if (onItemsChange) {
            onItemsChange(items.length);
        }
    }, [items.length, onItemsChange]);

    // Determine the current speed and direction
    const currentSpeed = speedMapping[speed as keyof typeof speedMapping] || speed || "50s";
    const currentDirection = direction === "left" ? "forwards" : "reverse";

    // Restart the animation only when speed or direction change
    useEffect(() => {
        setAnimationKey((prev) => prev + 1);
    }, [currentSpeed, currentDirection]);

    // Function to restart animation by resetting CSS animation
    const restartAnimation = useCallback(() => {
        if (scrollerRef.current) {
            scrollerRef.current.style.animation = "none";
            scrollerRef.current.offsetHeight;
            scrollerRef.current.style.animation = "";
        }
    }, []);

    // Restart animation whenever animationKey changes
    useEffect(() => {
        restartAnimation();
    }, [animationKey, restartAnimation]);

    return (
        <div className="relative">
            <div
                ref={containerRef}
                className={cn(
                    "scroller relative z-0 max-w-full overflow-hidden pb-10",
                    "[mask-image:linear-gradient(to_right,transparent,white_5%,white_95%,transparent)]",
                    className
                )}
            >
                <ul
                    key={animationKey} // Key to force re-render and restart animation only on speed or direction changes
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
                    {items.map((place, idx) => (
                        <li
                            key={`${place.name}-${idx}`}
                            className="w-[350px] sm:w-[400px] max-w-full relative flex"
                        >
                            <PlaceCard place={place} />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
