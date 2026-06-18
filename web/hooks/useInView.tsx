"use client";

import { useRef, useState, useEffect, RefObject } from 'react';

/**
 * Hook to observe element visibility using IntersectionObserver.
 * Returns a ref to attach to the element and a boolean indicating if it's in view.
 * 
 * @param threshold - A number between 0 and 1 indicating what percentage of the target's visibility triggers the callback
 * @param rootMargin - Margin around the root (default '0px')
 * @returns A tuple of [ref, inView] where ref is attached to the element and inView is the visibility state
 * 
 * @example
 * const [ref, inView] = useInView<HTMLDivElement>(0.5, '10px');
 * return <div ref={ref}>{inView ? 'Visible' : 'Hidden'}</div>;
 */
export function useInView<T extends HTMLElement = HTMLElement>(
    threshold: number = 0,
    rootMargin: string = '0px'
): [RefObject<T | null>, boolean] {
    const ref = useRef<T | null>(null);
    const [inView, setInView] = useState(true); // Default true for SSR hydration compatibility

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { threshold, rootMargin }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [threshold, rootMargin]); // Primitives - stable references

    return [ref, inView];
}
