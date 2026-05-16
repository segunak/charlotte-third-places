"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { CarouselApi } from "@/components/ui/carousel";

interface MobilePhotoFilmstripProps {
    photos: string[];
    api: CarouselApi | undefined;
    placeId: string;
    className?: string;
    trackClassName?: string;
    testId?: string;
    trackTestId?: string;
    thumbTestId?: (index: number) => string;
}

/**
 * Mobile photo filmstrip rendered below a swipeable photo carousel.
 *
 * Performance contract:
 * - No React state inside. Active-thumb visuals are toggled imperatively via
 *   `data-active` on the DOM node, so this component does not re-render during
 *   a swipe.
 * - Plain `<img>` tags and native `overflow-x-auto` keep mobile browsers on the
 *   compositor path instead of forcing Next/Image wrapper layout work.
 * - Wrapped in `React.memo` with stable props so parent `currentSlide` updates
 *   do not re-render the thumbnail tree.
 */
export const MobilePhotoFilmstrip = React.memo(function MobilePhotoFilmstrip({
    photos,
    api,
    placeId,
    className,
    trackClassName,
    testId = "mobile-photo-filmstrip",
    trackTestId = "mobile-photo-filmstrip-track",
    thumbTestId = (index: number) => `mobile-photo-filmstrip-thumb-${index}`,
}: MobilePhotoFilmstripProps) {
    const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const previousActiveRef = useRef<number>(0);

    if (thumbRefs.current.length > photos.length) {
        thumbRefs.current.length = photos.length;
    }

    useEffect(() => {
        if (!api) return undefined;

        const setActive = (nextIdx: number, smooth: boolean) => {
            if (photos.length === 0) return;
            const safeIdx = Math.max(0, Math.min(nextIdx, photos.length - 1));
            const prevEl = thumbRefs.current[previousActiveRef.current];
            const nextEl = thumbRefs.current[safeIdx];
            if (prevEl && prevEl !== nextEl) {
                prevEl.dataset.active = 'false';
                prevEl.setAttribute('aria-current', 'false');
            }
            if (nextEl) {
                nextEl.dataset.active = 'true';
                nextEl.setAttribute('aria-current', 'true');
                nextEl.scrollIntoView({
                    inline: 'nearest',
                    block: 'nearest',
                    behavior: smooth ? 'smooth' : 'auto',
                });
            }
            previousActiveRef.current = safeIdx;
        };

        setActive(api.selectedScrollSnap(), false);

        const onSelect = () => setActive(api.selectedScrollSnap(), true);
        api.on('select', onSelect);

        return () => {
            api.off('select', onSelect);
        };
    }, [api, photos, placeId]);

    return (
        <div
            data-testid={testId}
            className={cn(
                "shrink-0 h-16 overflow-x-auto",
                "[touch-action:pan-x] [contain:paint] [overscroll-behavior:contain]",
                "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                className
            )}
        >
            <div
                data-testid={trackTestId}
                className={cn("flex gap-1 h-full items-center px-3 will-change-transform", trackClassName)}
            >
                {photos.map((photo, idx) => (
                    <button
                        key={`filmstrip-${idx}`}
                        ref={(el) => { thumbRefs.current[idx] = el; }}
                        type="button"
                        data-testid={thumbTestId(idx)}
                        data-active={idx === 0}
                        aria-current={idx === 0 ? 'true' : 'false'}
                        aria-label={`Go to photo ${idx + 1}`}
                        onClick={() => api?.scrollTo(idx)}
                        className={cn(
                            "shrink-0 rounded-sm transition-transform duration-150 ease-out",
                            "[contain:layout_paint] focus:outline-hidden",
                            "data-[active=true]:scale-125 data-[active=true]:outline",
                            "data-[active=true]:outline-2 data-[active=true]:outline-white",
                            "data-[active=true]:z-10"
                        )}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={photo}
                            alt=""
                            width={40}
                            height={40}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            draggable={false}
                            className="w-10 h-10 object-cover rounded-sm pointer-events-none"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
});