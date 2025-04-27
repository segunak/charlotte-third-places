"use client";

import Image from 'next/image';
import { Place } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FC, useState, useRef, useEffect, useCallback } from 'react';
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
    type CarouselApi, // Import CarouselApi type
} from "@/components/ui/carousel";

interface PhotosModalProps {
    place: Place | null;
    open: boolean;
    onClose: () => void;
}

export const PhotosModal: FC<PhotosModalProps> = ({ place, open, onClose }) => {
    // State for the carousel API
    const [api, setApi] = useState<CarouselApi>();
    // State for tracking the currently selected slide index
    const [currentSlide, setCurrentSlide] = useState(0);
    // State for the total number of slides
    const [totalSlides, setTotalSlides] = useState<number>(0);
    // State to track which slide index is currently loading
    const [loadingSlide, setLoadingSlide] = useState<number | null>(0); // Start loading slide 0
    // State to track indices of images that have successfully loaded
    const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set<number>());
    // State for thumbnail visibility
    const [showThumbnails, setShowThumbnails] = useState(true);

    const dialogRef = useRef<HTMLDivElement>(null);

    // Reset state when modal opens or place changes
    useEffect(() => {
        if (open && place?.photos) {
            setCurrentSlide(0);
            setTotalSlides(place.photos.length);
            setLoadedIndices(new Set<number>()); // Reset loaded indices
            setLoadingSlide(0); // Mark the first slide as loading initially
            api?.scrollTo(0, true); // Scroll to start instantly
        } else if (!open) {
            // Reset when closing
            setLoadingSlide(null);
            setLoadedIndices(new Set<number>()); // Also clear loaded indices on close
        }
    }, [place, open, api]);

    // Update slide count display and manage loading state via Carousel API
    useEffect(() => {
        if (!api) {
            return;
        }

        setTotalSlides(api.scrollSnapList().length);
        setCurrentSlide(api.selectedScrollSnap());
        // setLoadingSlide(api.selectedScrollSnap()); // Set initial loading slide handled above

        const onSelect = () => {
            if (!api) return;
            const selected = api.selectedScrollSnap();
            setCurrentSlide(selected);
            // Only mark as loading if it hasn't loaded successfully before
            if (!loadedIndices.has(selected)) {
                setLoadingSlide(selected);
            } else {
                // Ensure loading state is cleared if we select an already loaded image
                // Check if the currently loading slide is the one we just selected
                if (loadingSlide === selected) {
                    setLoadingSlide(null);
                }
            }
        };

        const onSettle = () => {
            // Potentially useful for other effects after animation
        };

        api.on("select", onSelect);
        api.on("settle", onSettle);
        api.on("reInit", onSelect); // Handle reinitialization

        // Cleanup
        return () => {
            api.off("select", onSelect);
            api.off("settle", onSettle);
            api.off("reInit", onSelect);
        };
    }, [api, loadedIndices, loadingSlide]);

    // Keyboard handler for Escape key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    // Add/remove keyboard event listener
    useEffect(() => {
        if (open) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [open, handleKeyDown]);

    // If no place or photos, render nothing
    if (!place?.photos?.length) return null;

    const photos = place.photos;

    // --- Utility functions (cleanPhotoUrl, optimizeGooglePhotoUrl) ---
    const cleanPhotoUrl = (url: string): string => {
        if (!url) return '';
        if (typeof url === 'string') {
            const urlMatch = url.match(/(https?:\/\/[^\s,\[\]'"]+)/);
            if (urlMatch && urlMatch[0]) {
                return urlMatch[0];
            }
        }
        return url;
    };

    const optimizeGooglePhotoUrl = (url: string, width = 1280): string => {
        if (!url || !url.includes('googleusercontent.com')) return url;
        return url.replace(/=w\d+-h\d+/, `=w${width}-h${width}`);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                ref={dialogRef}
                className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 md:max-w-4xl lg:max-w-5xl bg-black/95 overflow-hidden flex flex-col"
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
                    <div className="text-white font-bold truncate">
                        {place.name} - Photo {currentSlide + 1} of {totalSlides}
                    </div>
                    <DialogClose asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/20"
                            aria-label="Close photo gallery"
                        >
                            <Icons.close className="h-6 w-6" />
                        </Button>
                    </DialogClose>
                </div>

                {/* Main image container using Carousel */}
                <div className="flex-grow relative w-full h-full flex items-center justify-center overflow-hidden bg-black p-4">
                    <Carousel
                        setApi={setApi} // Get the API instance
                        opts={{
                            loop: photos.length > 1, // Enable loop if more than one photo
                            align: "center",
                        }}
                        className="w-full h-full" // Make carousel take full space
                    >
                        <CarouselContent className="h-full"> {/* Ensure content takes full height */}
                            {photos.map((photo, idx) => (
                                <CarouselItem key={idx} className="flex items-center justify-center"> {/* Center item */}
                                    {/* Loading indicator: Show if this slide is marked as loading */}
                                    {loadingSlide === idx && (
                                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
                                            <Icons.loader className="h-10 w-10 animate-spin text-primary" />
                                        </div>
                                    )}
                                    {/* Ensure this div takes full height to allow image to scale within it */}
                                    <div className="relative flex items-center justify-center max-w-full max-h-full w-full">
                                        <Image
                                            src={optimizeGooglePhotoUrl(cleanPhotoUrl(photo))}
                                            alt={`${place.name} photo ${idx + 1} of ${photos.length}`}
                                            width={1280}
                                            height={720}
                                            quality={80}
                                            priority={idx === 0} // Prioritize first image
                                            sizes="(max-width: 768px) 90vw, (max-width: 1200px) 80vw, 1200px"
                                            className={cn(
                                                "object-contain max-w-full max-h-full h-full transition-opacity duration-300",
                                            )}
                                            onLoad={() => {
                                                // Mark this index as loaded
                                                setLoadedIndices((prev: any) => new Set<number>(prev).add(idx));
                                                // If this image was the one marked as loading, clear the loading state
                                                if (loadingSlide === idx) {
                                                    setLoadingSlide(null);
                                                }
                                            }}
                                            onError={(e) => { // Accept the event object 'e'
                                                if (loadingSlide === idx) {
                                                    setLoadingSlide(null); // Stop showing loader even on error
                                                }
                                                // Log the error event and the failed URL
                                                console.error(`Failed to load image ${idx + 1} at URL: ${optimizeGooglePhotoUrl(cleanPhotoUrl(photo))}`, e);
                                            }}
                                            unoptimized={photo.includes('googleusercontent.com')}
                                            referrerPolicy="no-referrer"
                                            style={{
                                                display: 'block',
                                                margin: 'auto',
                                            }}
                                        />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        {photos.length > 1 && (
                            <>
                                <CarouselPrevious
                                    variant="ghost"
                                    // Hide on mobile (hidden), show on medium screens and up (md:flex)
                                    className={cn(
                                        "absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full text-white z-50 w-10 h-10 items-center justify-center border-none disabled:bg-black/30 disabled:text-gray-500",
                                        "hidden md:flex"
                                    )}
                                    aria-label="Previous photo"
                                />
                                <CarouselNext
                                    variant="ghost"
                                    // Hide on mobile (hidden), show on medium screens and up (md:flex)
                                    className={cn(
                                        "absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full text-white z-50 w-10 h-10 items-center justify-center border-none disabled:bg-black/30 disabled:text-gray-500",
                                        "hidden md:flex" // Add responsive classes here
                                    )}
                                    aria-label="Next photo"
                                />
                            </>
                        )}
                    </Carousel>
                </div>

                {/* Thumbnails section */}
                {photos.length > 1 && (
                    <div className="flex-shrink-0 bg-black/80 border-t border-gray-800 z-10">
                        <div className="flex justify-center py-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white py-0.5 h-auto text-xs"
                                onClick={() => setShowThumbnails(prev => !prev)}
                            >
                                {showThumbnails ? 'Hide thumbnails' : 'Show thumbnails'}
                            </Button>
                        </div>

                        {showThumbnails && (
                            <div className="h-24 px-4 pb-2">
                                <ScrollArea className="h-full w-full whitespace-nowrap rounded-md">
                                    <div className="inline-flex gap-2 py-2">
                                        {photos.map((photo, idx) => (
                                            <button
                                                key={idx}
                                                className={cn(
                                                    "w-16 h-16 rounded-md overflow-hidden transition-all duration-200 relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black/50",
                                                    // Use currentSlide state for highlighting
                                                    idx === currentSlide
                                                        ? "ring-2 ring-primary ring-offset-2 ring-offset-black/50"
                                                        : "ring-1 ring-gray-700 opacity-60 hover:opacity-100"
                                                )}
                                                onClick={() => {
                                                    api?.scrollTo(idx); // Use API to scroll
                                                }}
                                                aria-label={`Go to photo ${idx + 1}`}
                                            >
                                                <Image
                                                    src={optimizeGooglePhotoUrl(cleanPhotoUrl(photo), 100)}
                                                    alt={`Thumbnail ${idx + 1}`}
                                                    fill
                                                    sizes="64px"
                                                    className="object-cover"
                                                    referrerPolicy="no-referrer"
                                                    unoptimized={photo.includes('googleusercontent.com')}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            </div>
                        )}

                        <div className="text-white text-center text-xs pb-1 pt-1">
                            {currentSlide + 1} / {totalSlides}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};