"use client";

import { FC, useState, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Icons } from "@/components/Icons";
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
    const [isOverflowing, setIsOverflowing] = useState(false);
    const contentRef = useRef<HTMLParagraphElement>(null);

    const shouldTruncate = isMobile && !expanded && priority !== 'high';

    useEffect(() => {
        const checkOverflow = () => {
            if (contentRef.current && isMobile && priority !== 'high') {
                const element = contentRef.current;
                setIsOverflowing(element.scrollHeight > element.clientHeight);
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [isMobile, priority, children]);

    if (inline) {
        return (
            <div className="space-y-2">
                <div className="relative">
                    <p
                        ref={contentRef}
                        className={clsx(
                            shouldTruncate && "line-clamp-5"
                        )}
                    >
                        <span className="font-semibold">{heading}:</span>
                        <span className="ml-1">{children}</span>
                    </p>
                    {shouldTruncate && isOverflowing && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-background" />
                    )}
                </div>
                {isMobile && priority !== 'high' && isOverflowing && (
                    <div
                        className="w-full py-2 cursor-pointer flex items-center justify-between transition-colors"
                        onClick={() => setExpanded(!expanded)}
                    >
                        <span className="text-primary font-medium">{expanded ? "Show less" : "Read more"}</span>
                        {expanded ? (
                            <Icons.chevronUp className="h-4 w-4 text-primary" />
                        ) : (
                            <Icons.chevronDown className="h-4 w-4 text-primary" />
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (<div className="space-y-2">
        <h3 className="font-semibold">{heading}</h3>
        <div className="relative">
            <p
                ref={contentRef}
                className={clsx(
                    "text-foreground leading-relaxed",
                    shouldTruncate && "line-clamp-5"
                )}
            >
                {children}
            </p>
            {shouldTruncate && isOverflowing && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-background" />
            )}
        </div>
        {isMobile && priority !== 'high' && isOverflowing && (
            <div
                className="w-full py-2 cursor-pointer flex items-center justify-between transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <span className="text-primary font-medium">{expanded ? "Show less" : "Read more"}</span>
                {expanded ? (
                    <Icons.chevronUp className="h-4 w-4 text-primary" />
                ) : (
                    <Icons.chevronDown className="h-4 w-4 text-primary" />
                )}
            </div>
        )}
    </div>
    );
};
