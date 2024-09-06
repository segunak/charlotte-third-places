"use client";
// This directive tells Next.js that this component will be rendered client-side, 
// which allows us to use hooks like `useState` and `useEffect` that depend on the browser environment.

import { useState, useEffect } from "react";

// The `ResponsiveLink` component is responsible for rendering an anchor (`<a>`) element 
// that opens in a new tab on desktop screens and the same tab on mobile screens.
export function ResponsiveLink({ href, children }: { href: string; children: React.ReactNode }) {

    // `isDesktop` is a piece of state that tracks whether the current screen size 
    // is considered "desktop" (width >= 768px).
    const [isDesktop, setIsDesktop] = useState(false);

    // `useEffect` runs after the component mounts to check the initial screen size 
    // and set up an event listener to detect window resizing. This ensures that we
    // dynamically adjust the `isDesktop` state as the screen is resized.
    useEffect(() => {

        // This function checks the window's width and updates `isDesktop` 
        // to `true` if the width is 768px or greater (which is Tailwind's "md" breakpoint for desktop).
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };

        handleResize(); // Run this function immediately to determine if the screen size qualifies as desktop on the first render.

        // Add a resize event listener to the window object, so the `handleResize` function
        // will be called whenever the user resizes the browser window.
        window.addEventListener("resize", handleResize);

        // Cleanup function: This removes the resize event listener when the component is unmounted 
        // to prevent memory leaks and unnecessary function calls.
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []); // The empty dependency array ensures this `useEffect` runs only once when the component mounts.

    return (
        // The returned JSX is a standard anchor (`<a>`) tag. 
        // The `href` prop determines the destination URL, and `children` allows any nested content to be displayed within the link.
        // The `target` attribute is conditionally set: 
        // - If the current screen width qualifies as desktop (`isDesktop === true`), the link will open in a new tab (`target="_blank"`).
        // - If the screen width is less than 768px (i.e., mobile or tablet), the link will open in the same tab (`target="_self"`).
        <a href={href} target={isDesktop ? "_blank" : "_self"} className="custom-link">
            {children} {/* The children represent the clickable content of the link (e.g., text or inline elements). */}
        </a>
    );
}
