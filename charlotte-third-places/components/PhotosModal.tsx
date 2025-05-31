"use client";

import React from 'react';
import Image from 'next/image';
import { Place } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FC, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose
} from "@/components/ui/dialog";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
    type CarouselApi,
} from "@/components/ui/carousel";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";

interface PhotosModalProps {
    place: Place | null;
    open: boolean;
    onClose: () => void;
}

// Simple gray placeholder
const blurDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8//9/PQAI8wNPvd7POQAAAABJRU5ErkJggg==';

// --- Utility functions that don't need to be memoized ---
const cleanPhotoUrl = (url: string): string => {
    if (typeof url === 'string' && url.startsWith('http')) {
        return url.trim();
    }
    return '';
};

const optimizeGooglePhotoUrl = (url: string, width = 1280): string => {
    const cleanedUrl = cleanPhotoUrl(url);

    // Early returns for invalid URLs or special cases
    if (!cleanedUrl) return '';
    // Assume non-google URLs are already optimized or don't support this
    if (!cleanedUrl.includes('googleusercontent.com')) return cleanedUrl;
      // Most problematic URLs should be filtered out by backend, but this is a fallback
    // if any restricted URLs make it through to the frontend
    // The _is_valid_photo_url method in both OutscraperProvider and GoogleMapsProvider
    // should have already removed these, but we keep this check as a defense-in-depth measure
    if (cleanedUrl.includes('/gps-cs-s/') || cleanedUrl.includes('/gps-proxy/')) {
        console.warn(`Potentially restricted Google photo URL detected: ${cleanedUrl}`);
        return cleanedUrl;
    }

    // Check if already has desired width parameter (more robust check)
    const widthParamRegex = new RegExp(`=[whs]${width}(-[^=]+)?$`);
    if (widthParamRegex.test(cleanedUrl)) return cleanedUrl;

    // Try replacing existing size parameters (e.g., =s1600, =w800-h600)
    const sizeRegex = /=[swh]\d+(-[swh]\d+)?(-k-no)?$/;
    if (sizeRegex.test(cleanedUrl)) {
        return cleanedUrl.replace(sizeRegex, `=w${width}-k-no`);
    }

    // If URL has other parameters but no size, append (less common)
    if (cleanedUrl.includes('=') && !sizeRegex.test(cleanedUrl)) {
         // Avoid appending if it might break other params; return as is
         return cleanedUrl;
    }

    // If no parameters, append the width parameter
    if (!cleanedUrl.includes('=')) {
        return cleanedUrl + `=w${width}-k-no`;
    }

    // Default fallback: return cleaned URL if unsure
    return cleanedUrl;
};

export const PhotosModal: FC<PhotosModalProps> = ({ place, open, onClose }) => {
    const [api, setApi] = useState<CarouselApi>();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set<number>());
    const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set<number>());
    const [showThumbnails, setShowThumbnails] = useState(true);
    const dialogRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();
    const [showInfoDrawer, setShowInfoDrawer] = useState(false);
    const hasResetScrollRef = useRef(false);

    // Get photos array without filtering - move this to top level
    const photos = useMemo(() => (place?.photos ?? []), [place]);
    const totalPhotos = photos.length;

    // Build a filtered array of visible photos and a mapping to their original indices
    const visiblePhotoData = useMemo(() => {
        const arr: { photo: string; originalIdx: number }[] = [];
        photos.forEach((photo, idx) => {
            if (!failedIndices.has(idx)) {
                arr.push({ photo, originalIdx: idx });
            }
        });
        return arr;
    }, [photos, failedIndices]);
    const visiblePhotos = visiblePhotoData.map((d) => d.photo);
    const visibleToOriginalIdx = visiblePhotoData.map((d) => d.originalIdx);
    const visibleSlideCount = visiblePhotos.length;
    const hasVisiblePhotos = visibleSlideCount > 0;

    // Move all callback definitions to the top level
    // Escape key handler
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    // Helper to check if a slide is visible (not failed)
    const isSlideVisible = useCallback((index: number) => !failedIndices.has(index), [failedIndices]);

    // Function to handle image loading errors
    const handleImageError = useCallback((index: number, photoUrl: string) => {
        console.error(`Failed to load image ${index + 1}: ${photoUrl}`);
        setFailedIndices(prev => {
            // Avoid infinite loops if state update itself causes issues
            if (prev.has(index)) return prev;
            const updated = new Set(prev);
            updated.add(index);
            return updated;
        });
    }, []);

    useEffect(() => {
        if (open) {
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
        return undefined;
    }, [open, handleKeyDown]);

    // Reset state when modal opens or place changes
    useEffect(() => {
        if (open && totalPhotos > 0) {
            setFailedIndices(new Set<number>());
            setLoadedIndices(new Set<number>());
            setCurrentSlide(0);
            setShowThumbnails(true);
            hasResetScrollRef.current = false; // Reset the ref on open
        } else if (!open) {
            setLoadedIndices(new Set<number>());
            setFailedIndices(new Set<number>());
            setCurrentSlide(0);
        }
    }, [open, totalPhotos]); // Remove api from deps

    // Only scroll to first slide once per open event
    useEffect(() => {
        if (open && api && totalPhotos > 0 && !hasResetScrollRef.current) {
            hasResetScrollRef.current = true;
            api.scrollTo(0, true);
        }
    }, [open, api, totalPhotos]);

    // Handle carousel selection and update loaded state
    useEffect(() => {
        if (!api) return;
        
        const onSelect = () => {
            const selected = api.selectedScrollSnap();
            // Only update state if the value has actually changed
            // This prevents unnecessary re-renders
            if (selected !== currentSlide) {
                setCurrentSlide(selected);
                
                // Mark the original index as loaded only if we have valid data
                if (selected >= 0 && selected < visibleToOriginalIdx.length) {
                    const origIdx = visibleToOriginalIdx[selected];
                    setLoadedIndices(prev => {
                        // Only update if not already in the set
                        if (!prev.has(origIdx)) {
                            const updated = new Set(prev);
                            updated.add(origIdx);
                            return updated;
                        }
                        return prev;
                    });
                }
            }
        };
        
        api.on("select", onSelect);
        
        // Initial selection - only call if needed
        if (api.selectedScrollSnap() !== currentSlide) {
            onSelect();
        }
        
        return () => {
            api.off("select", onSelect);
        };
    }, [api, visibleToOriginalIdx, currentSlide]);

    // Helper: get indices to render (current, prev, next)
    const activeIndices = useMemo(() => {
        if (!hasVisiblePhotos) return new Set<number>();
        const prev = (currentSlide - 1 + visiblePhotos.length) % visiblePhotos.length;
        const next = (currentSlide + 1) % visiblePhotos.length;
        return new Set([prev, currentSlide, next]);
    }, [currentSlide, visiblePhotos.length, hasVisiblePhotos]);

    // Preload next/prev images
    useEffect(() => {
        if (!hasVisiblePhotos) return;
        const preload = (idx: number) => {
            const photo = visiblePhotos[idx];
            if (!photo) return;
            const img = new window.Image();
            img.src = optimizeGooglePhotoUrl(photo, 800);
        };
        const indices = activeIndices;
        indices.forEach(idx => {
            if (idx !== currentSlide) preload(idx);
        });
    }, [currentSlide, visiblePhotos, activeIndices, hasVisiblePhotos]);

    // Early return - important to place after all hooks are defined
    if (!place || totalPhotos === 0) return null;

    // Determine if loop should be enabled - moved from hook to render time calculation
    const enableLoop = hasVisiblePhotos && visibleSlideCount > 1;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                ref={dialogRef}
                className="max-h-[90vh] sm:max-h-[95vh] w-full h-full p-0 md:max-w-4xl lg:max-w-5xl xl:max-w-6xl bg-black/95 overflow-hidden flex flex-col" 
                onOpenAutoFocus={(e) => e.preventDefault()} 
                aria-describedby="photo-description"
            >
                <DialogTitle className="sr-only">
                    {place.name} Photos
                </DialogTitle>
                <DialogDescription id="photo-description" className="sr-only">
                    Photo gallery for {place.name}
                </DialogDescription>

                {/* Top bar - fixed height */}
                <div className="flex-shrink-0 h-16 flex items-center justify-between px-4 py-2 bg-black/80 border-b border-gray-800 z-10">
                    <div className="flex items-center gap-2 min-w-0"> 
                        <div className="text-white font-semibold truncate"> 
                            {place.name} - Photo {hasVisiblePhotos ? (currentSlide + 1) : 0} of {visibleSlideCount}
                        </div>
                        {isMobile ? (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white/80 hover:text-white hover:bg-white/10 p-1 h-auto"
                                    onClick={() => setShowInfoDrawer(true)}
                                    aria-label="Photo Source Information"
                                >
                                    <Icons.infoCircle className="h-4 w-4" />
                                </Button>
                                <Drawer open={showInfoDrawer} onOpenChange={setShowInfoDrawer}>
                                    <DrawerContent className="bg-black/95 text-white">
                                        <DrawerHeader>
                                            <DrawerTitle>Photo Source Information</DrawerTitle>
                                            <DrawerDescription className="text-white/90">
                                                Photos are sourced from Google Maps and its users. They are not taken or owned by Charlotte Third Places.
                                            </DrawerDescription>
                                            <DrawerClose asChild>
                                                <Button variant="ghost" className="mt-4 text-white border border-white/20">Close</Button>
                                            </DrawerClose>
                                        </DrawerHeader>
                                    </DrawerContent>
                                </Drawer>
                            </>
                        ) : (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-white/80 hover:text-white hover:bg-white/10 p-1 h-auto" 
                                        >
                                            <Icons.infoCircle className="h-4 w-4" />
                                            <span className="sr-only">Photo Source Information</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="bg-black/95 text-white/90 max-w-xs"> 
                                        Photos are sourced from Google Maps and its users. They are not taken or owned by Charlotte Third Places.
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                    <DialogClose asChild>
                        <Button
                            variant="ghost"
                            size="icon" 
                            className="text-white hover:bg-white/20"
                            aria-label="Close photo gallery"
                        >
                            <Icons.close className="h-5 w-5" /> 
                        </Button>
                    </DialogClose>
                </div>

                {/* Main image container using Carousel */}
                <div className="flex-grow relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
                    <Carousel
                        setApi={setApi}
                        opts={{
                            loop: enableLoop,
                            align: "center",
                        }}
                        className="w-full h-full"
                    >
                        <CarouselContent className="h-full">
                            {visiblePhotos.map((photo, idx) => {
                                const origIdx = visibleToOriginalIdx[idx];
                                const isActive = activeIndices.has(idx);
                                const quality = isActive ? 80 : 40;
                                const width = isActive ? 1280 : 400;
                                let isPriority = false;
                                if (isActive) isPriority = true;
                                return (
                                    <CarouselItem
                                        key={`photo-${origIdx}`}
                                        className="flex items-center justify-center h-full p-1 md:p-2"
                                    >
                                        <div className="relative w-full h-[50vh] md:h-[65vh] max-h-full flex items-center justify-center">
                                            {isActive ? (
                                                <Image
                                                    src={optimizeGooglePhotoUrl(photo, width)}
                                                    alt={`${place?.name ?? ''} photo ${currentSlide + 1}`}
                                                    fill
                                                    quality={quality}
                                                    priority={isPriority}
                                                    sizes="(max-width: 767px) 95vw, (max-width: 1023px) 80vw, 1200px"
                                                    placeholder="blur"
                                                    blurDataURL={blurDataURL}
                                                    className={cn(
                                                        "object-contain transition-opacity duration-300 ease-in-out",
                                                    )}
                                                    style={{
                                                        objectFit: 'contain',
                                                        objectPosition: 'center',
                                                    }}
                                                    onLoad={() => {
                                                        setLoadedIndices(prev => new Set(prev).add(origIdx));
                                                    }}
                                                    onError={() => handleImageError(origIdx, photo)}
                                                    unoptimized={photo.includes('googleusercontent.com')}
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-900/60 animate-pulse rounded">
                                                    <svg className="h-12 w-12 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 17l6-6 4 4 8-8"/></svg>
                                                </div>
                                            )}
                                        </div>
                                    </CarouselItem>
                                );
                            })}
                        </CarouselContent>

                        {/* Navigation controls - only show if multiple visible photos and not on mobile */}
                        {visibleSlideCount > 1 && (
                            <>
                                <CarouselPrevious
                                    variant="ghost"
                                    size="icon" 
                                    className={cn(
                                        "hidden md:flex absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full text-white z-20", 
                                        "border-none disabled:bg-black/30 disabled:text-gray-500 disabled:opacity-50", 
                                        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black" 
                                    )}
                                    aria-label="Previous photo"
                                />
                                <CarouselNext
                                    variant="ghost"
                                    size="icon" 
                                    className={cn(
                                        "hidden md:flex absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full text-white z-20", 
                                        "border-none disabled:bg-black/30 disabled:text-gray-500 disabled:opacity-50", 
                                        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black" 
                                    )}
                                    aria-label="Next photo"
                                />
                            </>
                        )}
                    </Carousel>

                    {/* Show message when no photos are visible */}
                    {!hasVisiblePhotos && open && ( 
                        <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4 z-30">
                            <div className="bg-black/80 p-6 rounded-lg max-w-sm shadow-lg">
                                <Icons.alertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
                                <h3 className="text-lg font-semibold mb-2">No Photos Available</h3>
                                <p className="text-sm text-white/80">We couldn't load the photos for this place at the moment.</p>
                                <Button
                                    variant="secondary" 
                                    className="mt-4"
                                    onClick={onClose}
                                    size="sm"
                                >
                                    Close Gallery
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Thumbnails section - only show if we have multiple visible photos */}
                {visibleSlideCount > 1 && (
                    <div className={cn(
                        "flex-shrink-0 bg-black/80 border-t border-gray-800 z-10 transition-all duration-300 ease-in-out",
                        showThumbnails ? "py-2" : "py-0 h-8" 
                    )}>
                        <div className="flex justify-center h-6 items-center"> 
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white/80 hover:text-white/100 py-0.5 h-auto text-xs"
                                onClick={() => setShowThumbnails(prev => !prev)}
                                aria-expanded={showThumbnails}
                                aria-controls="thumbnail-scroll-area"
                            >
                                {showThumbnails ? (
                                    <> <Icons.chevronDown className="h-3 w-3 mr-1" /> Hide</>
                                ) : (
                                    <> <Icons.chevronUp className="h-3 w-3 mr-1" /> Show</>
                                )}
                                <span className="ml-1">Thumbnails</span>
                                <span className="sr-only">{showThumbnails ? 'Hide' : 'Show'} thumbnails</span>
                            </Button>
                        </div>

                        {/* Conditional rendering with height transition */}
                        <div
                            id="thumbnail-scroll-area"
                            className={cn(
                                "transition-[height] duration-300 ease-in-out overflow-hidden",
                                showThumbnails ? "h-24 px-4 pb-2" : "h-0"
                            )}
                        >
                            {showThumbnails && ( 
                                <ScrollArea className="h-full w-full whitespace-nowrap rounded-md">
                                    <div className="inline-flex gap-2 py-2">
                                        {visiblePhotos.map((photo, idx) => {
                                            const origIdx = visibleToOriginalIdx[idx];
                                            const thumbVisibleNumber = idx + 1;
                                            return (
                                                <button
                                                    key={`thumb-${origIdx}`}
                                                    className={cn(
                                                        "w-16 h-16 rounded-md overflow-hidden transition-all duration-200 relative flex-shrink-0", 
                                                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black/50", 
                                                        idx === currentSlide
                                                            ? "ring-2 ring-primary ring-offset-2 ring-offset-black/50"
                                                            : "ring-1 ring-gray-700 opacity-60 hover:opacity-100"
                                                    )}
                                                    onClick={() => api?.scrollTo(idx)}
                                                    aria-label={`Go to photo ${thumbVisibleNumber}`}
                                                >
                                                    <Image
                                                        src={optimizeGooglePhotoUrl(photo, 100)} 
                                                        alt={`Thumbnail ${thumbVisibleNumber}`}
                                                        fill
                                                        sizes="64px" 
                                                        className="object-cover"
                                                        placeholder="blur" 
                                                        blurDataURL={blurDataURL}
                                                        referrerPolicy="no-referrer"
                                                        unoptimized={photo.includes('googleusercontent.com')}
                                                        onError={() => handleImageError(origIdx, photo)} 
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            )}
                        </div>

                        {/* Remove inaccurate counter at the bottom under thumbnails */}
                    </div>
                )}

                {/* Add a Close button at the bottom on mobile for easier access */}
                {isMobile && (
                    <div className="flex-shrink-0 w-full flex justify-center items-center py-4 bg-black/90 border-t border-gray-800">
                        <Button onClick={onClose}>
                            Close
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};