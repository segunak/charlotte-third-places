"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export function ResponsiveLink({
    href,
    children,
    className = "",
    applyDefaultStyling = true,
}: {
    href: string;
    children: React.ReactNode;
    className?: string;
    applyDefaultStyling?: boolean;
}) {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <a href={href} target={isDesktop ? "_blank" : "_self"} rel="noopener" className={cn(applyDefaultStyling ? "custom-link" : "", className)}>
            {children}
        </a>
    );
}
