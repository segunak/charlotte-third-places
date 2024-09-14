"use client";

import { Icons } from "@/components/Icons";
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button";

export const ScrollToTopButton = () => {
    const pathName = usePathname()

    // Conditionally render the button only if on the "/" route which is the home page.
    if (pathName !== "/") return null;

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <Button
            onClick={scrollToTop}
            className="mb-2 fixed bottom-16 right-8 p-3 bg-primary text-white rounded-full shadow-lg z-50 sm:hidden"
        >
            <Icons.arrowUp className="h-4 w-4" />
        </Button>
    );
};
