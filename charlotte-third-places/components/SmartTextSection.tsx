"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import clsx from "clsx";

interface SmartTextSectionProps {
    heading: string;
    children: string;
    priority?: 'high' | 'medium' | 'low';
    inline?: boolean;
}

/**
 * Smart text component that shows truncated content on mobile with expand option
 * 
 * Priority levels:
 * - high: Always shows full content (no truncation)
 * - medium: Truncates on mobile with "Read more" option
 * - low: Truncates on mobile with "Read more" option
 * 
 * Styling options:
 * - inline: false (default) - Heading appears as block element on separate line
 * - inline: true - Heading appears inline with content (like "Label: content")
 */
export const SmartTextSection: FC<SmartTextSectionProps> = ({
    heading,
    children,
    priority = 'medium',
    inline = false
}) => {
    const isMobile = useIsMobile();
    const [expanded, setExpanded] = useState(false);
    const shouldTruncate = isMobile && !expanded && priority !== 'high';
    if (inline) {
        return (
            <div className="space-y-2">
                <div className="relative">
                    <p className={clsx(
                        shouldTruncate && "line-clamp-4"
                    )}>
                        <span className="font-semibold">{heading}:</span>
                        <span className="ml-1">{children}</span>
                    </p>
                    {shouldTruncate && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-background" />
                    )}
                </div>
                {isMobile && priority !== 'high' && (
                    <Button
                        variant="link"
                        size="sm"
                        className="px-0 h-auto text-primary"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? "Show less" : "Read more"}
                    </Button>
                )}
            </div>
        );
    }

    return (<div className="space-y-2">
        <h3 className="font-semibold">{heading}</h3>
        <div className="relative">
            <p className={clsx(
                "text-foreground leading-relaxed",
                shouldTruncate && "line-clamp-4"
            )}>
                {children}
            </p>
            {shouldTruncate && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-background" />
            )}
        </div>
        {isMobile && priority !== 'high' && (
            <Button
                variant="link"
                size="sm"
                className="px-0 h-auto text-primary"
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? "Show less" : "Read more"}
            </Button>
        )}
    </div>
    );
};
