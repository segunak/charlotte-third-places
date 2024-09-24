"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// The `ResponsiveLink` component is responsible for rendering an anchor (`<a>`) element 
// that opens in a new tab on desktop screens and the same tab on mobile screens.
// It now accepts an optional `className` prop to allow passing additional CSS classes.
export function ResponsiveLink({
    href,
    children,
    className = "",
}: {
    href: string;
    children: React.ReactNode;
    className?: string; // Optional className prop
}) {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };

        handleResize(); // Check screen size initially
        window.addEventListener("resize", handleResize);

        // Cleanup event listener on unmount
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <a href={href} target={isDesktop ? "_blank" : "_self"} rel="noopener" className={cn("custom-link", className)}>
            {children}
        </a>
    );
}
