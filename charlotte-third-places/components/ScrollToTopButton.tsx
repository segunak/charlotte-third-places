"use client";

import { Icons } from "@/components/Icons";
import { useState, useEffect } from "react";
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";

export const ScrollToTopButton = () => {
    const pathName = usePathname();
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY >= 600) {
                setShowButton(true);
            } else {
                setShowButton(false);
            }
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    // Conditionally render the button only if on the "/" (home page) route and user has scrolled down
    if (pathName !== "/" || !showButton) return null;

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <Button
            onClick={scrollToTop}
            className={`sm:hidden mb-2 fixed bottom-16 right-8 p-3 bg-primary text-white rounded-full shadow-lg z-50 transition-opacity duration-900 ${showButton ? 'opacity-100' : 'opacity-0'}`}
        >
            <Icons.arrowUp className="h-4 w-4" />
        </Button>
    );
};
