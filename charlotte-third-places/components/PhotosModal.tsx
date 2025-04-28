"use client";

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

interface PhotosModalProps {
    place: Place | null;
    open: boolean;
    onClose: () => void;
}

// Simple gray placeholder
const blurDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8//9/PQAI8wNPvd7POQAAAABJRU5ErkJggg==';

export const PhotosModal: FC<PhotosModalProps> = ({ place, open, onClose }) => {
    const [api, setApi] = useState<CarouselApi>();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set<number>());
    const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set<number>());
    const [visibleSlideCount, setVisibleSlideCount] = useState(0);
    const [showThumbnails, setShowThumbnails] = useState(true);
    const dialogRef = useRef<HTMLDivElement>(null);

    // Get photos array without filtering - move this to top level
    const photos = useMemo(() => (place?.photos ?? []), [place]);
    const totalPhotos = photos.length;
    
    // Define this at the top level to avoid conditional hooks
    const hasVisiblePhotos = visibleSlideCount > 0;
    
    // Move all callback definitions to the top level
    // Escape key handler
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    // Helper to check if a slide is visible (not failed)
    const isSlideVisible = useCallback((index: number) => !failedIndices.has(index), [failedIndices]);

    // Calculate the visible slide number (1-based for display)
    const getVisibleSlideNumber = useCallback((rawIndex: number): number => {
        if (!hasVisiblePhotos) return 0;
        let visibleCount = 0;
        for (let i = 0; i < totalPhotos; i++) {
            if (i > rawIndex) break;
            if (isSlideVisible(i)) visibleCount++;
        }
        return visibleCount;
    }, [hasVisiblePhotos, totalPhotos, isSlideVisible]);

    const visibleSlideNumber = useMemo(() => 
        getVisibleSlideNumber(currentSlide), 
        [currentSlide, getVisibleSlideNumber]
    );

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
            // Reset all state
            setFailedIndices(new Set<number>());
            setLoadedIndices(new Set<number>());
            setCurrentSlide(0);
            setVisibleSlideCount(totalPhotos); // Start assuming all are visible
            setShowThumbnails(true); // Default to showing thumbnails

            // Ensure carousel is at the first slide when it initializes or photos change
            if (api) {
                // Use timeout to ensure API is ready after potential re-render
                setTimeout(() => api.scrollTo(0, true), 0);
            }
        } else if (!open) {
            // Reset when closing
            setLoadedIndices(new Set<number>());
            setFailedIndices(new Set<number>());
            setCurrentSlide(0); // Reset slide index
        }
    }, [open, totalPhotos, api]); // Depend on totalPhotos and api

    // Handle carousel selection and update loaded state
    useEffect(() => {
        if (!api) return;

        const onSelect = () => {
            const selected = api.selectedScrollSnap();
            setCurrentSlide(selected);
            // Mark the selected slide as loaded (attempted)
            setLoadedIndices(prev => new Set(prev).add(selected));
        };

        api.on("select", onSelect);
        // Initialize current slide state
        onSelect();

        return () => {
            api.off("select", onSelect);
        };
    }, [api]);

    // Update visible slide count when failed indices change
    useEffect(() => {
        const newVisibleCount = totalPhotos - failedIndices.size;
        setVisibleSlideCount(newVisibleCount > 0 ? newVisibleCount : 0);
    }, [failedIndices, totalPhotos]);

    // Early return - important to place after all hooks are defined
    if (!place || totalPhotos === 0) return null;

    // Determine if loop should be enabled - moved from hook to render time calculation
    const enableLoop = hasVisiblePhotos && visibleSlideCount > 1;

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
        // Skip known problematic proxy URLs
        if (cleanedUrl.includes('/gps-proxy/')) return cleanedUrl;

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
                            {place.name} - Photo {hasVisiblePhotos ? visibleSlideNumber : 0} of {visibleSlideCount}
                        </div>
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
                            {photos.map((photo, index) => {
                                const isVisible = isSlideVisible(index);
                                
                                // Calculate priority without hooks
                                let isPriority = false;
                                if (!enableLoop) {
                                    isPriority = index === currentSlide || index === currentSlide - 1 || index === currentSlide + 1;
                                } else {
                                    // Handle looping indices
                                    const prevIndex = (currentSlide - 1 + totalPhotos) % totalPhotos;
                                    const nextIndex = (currentSlide + 1) % totalPhotos;
                                    isPriority = index === currentSlide || index === prevIndex || index === nextIndex;
                                }

                                // Skip rendering failed items entirely to avoid layout shifts
                                if (!isVisible) {
                                    return (
                                        <CarouselItem key={`failed-${index}`} className="hidden" />
                                    );
                                }

                                return (
                                    <CarouselItem
                                        key={`photo-${index}`}
                                        className="flex items-center justify-center h-full p-1 md:p-2" 
                                    >
                                        {/* Container to center the image with fixed height for desktop */}
                                        <div className="relative w-full h-[50vh] md:h-[65vh] max-h-full flex items-center justify-center">
                                            <Image
                                                src={optimizeGooglePhotoUrl(photo)}
                                                alt={`${place.name} photo ${getVisibleSlideNumber(index)}`} 
                                                fill
                                                quality={80} 
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
                                                    setLoadedIndices(prev => new Set(prev).add(index));
                                                }}
                                                onError={() => handleImageError(index, photo)}
                                                unoptimized={photo.includes('googleusercontent.com')} 
                                                referrerPolicy="no-referrer" 
                                            />
                                        </div>
                                    </CarouselItem>
                                );
                            })}
                        </CarouselContent>

                        {/* Navigation controls - only show if multiple visible photos */}
                        {visibleSlideCount > 1 && (
                            <>
                                <CarouselPrevious
                                    variant="ghost"
                                    size="icon" 
                                    className={cn(
                                        "absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full text-white z-20", 
                                        "border-none disabled:bg-black/30 disabled:text-gray-500 disabled:opacity-50", 
                                        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black" 
                                    )}
                                    aria-label="Previous photo"
                                />
                                <CarouselNext
                                    variant="ghost"
                                    size="icon" 
                                    className={cn(
                                        "absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full text-white z-20", 
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
                                        {photos.map((photo, index) => {
                                            // Skip rendering failed thumbnails
                                            if (!isSlideVisible(index)) return null;

                                            const thumbVisibleNumber = getVisibleSlideNumber(index);

                                            return (
                                                <button
                                                    key={`thumb-${index}`}
                                                    className={cn(
                                                        "w-16 h-16 rounded-md overflow-hidden transition-all duration-200 relative flex-shrink-0", 
                                                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black/50", 
                                                        index === currentSlide
                                                            ? "ring-2 ring-primary ring-offset-2 ring-offset-black/50"
                                                            : "ring-1 ring-gray-700 opacity-60 hover:opacity-100"
                                                    )}
                                                    onClick={() => api?.scrollTo(index)}
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
                                                        onError={() => handleImageError(index, photo)} 
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            )}
                        </div>

                        {/* Always show counter if thumbnails *could* be shown */}
                        <div className={cn(
                            "text-white/70 text-center text-xs transition-opacity duration-300",
                            showThumbnails ? "opacity-100 pb-1" : "opacity-0" 
                        )}>
                            {hasVisiblePhotos ? visibleSlideNumber : 0} / {visibleSlideCount}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};