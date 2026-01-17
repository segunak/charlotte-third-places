import { useEffect, useState, useCallback } from 'react';

/**
 * Custom hook that returns the current window width with debouncing.
 * Debouncing prevents excessive recalculations during window resize events,
 * improving performance especially for components with expensive re-renders.
 * 
 * @param debounceMs - Debounce delay in milliseconds (default: 150ms)
 * @returns Current window width in pixels
 */
export function useWindowWidth(debounceMs = 150) {
    const [width, setWidth] = useState<number>(
        typeof window !== 'undefined' ? window.innerWidth : 1024
    );

    const handleResize = useCallback(() => {
        setWidth(window.innerWidth);
    }, []);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        const debouncedResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleResize, debounceMs);
        };

        window.addEventListener('resize', debouncedResize);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', debouncedResize);
        };
    }, [handleResize, debounceMs]);

    return width;
}
