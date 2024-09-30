"use client";

import { useEffect } from "react";

export const ScrollToTop = () => {
    useEffect(() => {
        const handleScrollToTop = () => {
            // Scroll to the top of the page when this component mounts
            if (typeof window !== "undefined") {
                window.scrollTo(0, 0);
            }
        };

        // If the document is already loaded, scroll to the top immediately
        if (document.readyState === "complete") {
            handleScrollToTop();
        } else {
            // Use the 'load' event listener for when the page finishes loading
            window.addEventListener("load", handleScrollToTop);
        }

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener("load", handleScrollToTop);
        };
    }, []);

    return null; // No UI, just the scroll effect
};
