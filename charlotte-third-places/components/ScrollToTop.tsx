"use client";

import { useEffect } from "react";

export const ScrollToTop = () => {
    useEffect(() => {
        window.scrollTo(0, 0); // Scroll to the top of the page when this component mounts
    }, []);

    return null;
};
