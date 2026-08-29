"use client";

import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type RefObject, useEffect, useState } from "react";

interface ScrollHintButtonProps {
    contentRef: RefObject<HTMLDivElement | null>;
    enabled: boolean;
    resetKey?: unknown;
}

export function ScrollHintButton({ contentRef, enabled, resetKey }: ScrollHintButtonProps) {
    const [showScrollHint, setShowScrollHint] = useState(false);

    useEffect(() => {
        if (!enabled) {
            setShowScrollHint(false);
            return;
        }

        let scrollElement: HTMLDivElement | null = null;

        const handleScroll = () => {
            setShowScrollHint(false);
        };

        const timeout = setTimeout(() => {
            scrollElement = contentRef.current;
            if (!scrollElement) return;

            const { scrollHeight, clientHeight } = scrollElement;
            if (scrollHeight > clientHeight) {
                setShowScrollHint(true);
                scrollElement.addEventListener("scroll", handleScroll, { once: true });
            }
        }, 200);

        return () => {
            clearTimeout(timeout);
            scrollElement?.removeEventListener("scroll", handleScroll);
        };
    }, [contentRef, enabled, resetKey]);

    return (
        <Button
            variant="default"
            size="icon"
            onClick={() => contentRef.current?.scrollBy({ top: 150, behavior: "smooth" })}
            className={cn(
                "absolute bottom-1 right-1 rounded-full shadow-lg transition-opacity duration-300",
                showScrollHint ? "opacity-100 animate-bounce" : "opacity-0 pointer-events-none"
            )}
            aria-label="Scroll for more"
            aria-hidden={!showScrollHint}
        >
            <Icons.chevronDown className="h-4 w-4" />
        </Button>
    );
}