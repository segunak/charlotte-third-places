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

export const PhotosModal: FC<PhotosModalProps> = ({ place, open, onClose }) => {
    const [api, setApi] = useState<CarouselApi>();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [totalSlides, setTotalSlides] = useState<number>(0);
    const [loadingSlide, setLoadingSlide] = useState<number | null>(null);
    const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set<number>());
    const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set<number>());
    const [visibleSlideCount, setVisibleSlideCount] = useState(0);
    const [showThumbnails, setShowThumbnails] = useState(true);
    const dialogRef = useRef<HTMLDivElement>(null);

    // Escape key handler
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (open) {
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
        return undefined;
    }, [open, handleKeyDown]);

    // Get photos array without filtering
    const photos = useMemo(() => place?.photos ?? [], [place]);
    
    // Reset state when modal opens or place changes
    useEffect(() => {
        if (open && photos.length > 0) {
            // Reset all state
            setFailedIndices(new Set<number>());
            setLoadedIndices(new Set<number>());
            setCurrentSlide(0);
            setTotalSlides(photos.length);
            setVisibleSlideCount(photos.length);
            setLoadingSlide(0); // Load the first slide
            
            // Ensure carousel is at the first slide
            if (api) api.scrollTo(0, true);
        } else if (!open) {
            // Reset when closing
            setLoadingSlide(null);
            setLoadedIndices(new Set<number>());
            setFailedIndices(new Set<number>());
        }
    }, [open, photos, api]);

    // Handle carousel selection
    useEffect(() => {
        if (!api) return;

        const onSelect = () => {
            const selected = api.selectedScrollSnap();
            setCurrentSlide(selected);
            
            // Only set loading state if not already loaded or failed
            if (!loadedIndices.has(selected) && !failedIndices.has(selected)) {
                setLoadingSlide(selected);
            }
        };

        api.on("select", onSelect);
        return () => {
            api.off("select", onSelect);
        };
    }, [api, loadedIndices, failedIndices]);

    // Update visible slide count when failed indices change
    useEffect(() => {
        const newVisibleCount = photos.length - failedIndices.size;
        setVisibleSlideCount(newVisibleCount > 0 ? newVisibleCount : 0);
    }, [failedIndices, photos.length]);

    // Helper to check if a slide is visible (not failed)
    const isSlideVisible = (index: number) => !failedIndices.has(index);

    // --- Utility functions ---
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
        if (!cleanedUrl.includes('googleusercontent.com')) return cleanedUrl;
        if (cleanedUrl.includes('/gps-proxy/')) return cleanedUrl;

        // Check if already has desired width
        const widthParamRegex = new RegExp(`=[whs]${width}(-[whs]\\d+)?(-k-no)?$`);
        if (widthParamRegex.test(cleanedUrl)) return cleanedUrl;

        // Try replacing existing size parameters
        const sizeRegex = /=[swh]\d+(-[swh]\d+)?(-k-no)?$/;
        if (sizeRegex.test(cleanedUrl)) {
            return cleanedUrl.replace(sizeRegex, `=w${width}-k-no`);
        }

        // If URL has other parameters, don't modify
        if (cleanedUrl.includes('=')) {
            return cleanedUrl;
        }
        
        // Otherwise, append width parameter
        return cleanedUrl + `=w${width}-k-no`;
    };

    // Don't render if no place or no photos
    if (!place || photos.length === 0) return null;

    // Calculate if there are visible photos to display
    const hasVisiblePhotos = visibleSlideCount > 0;
    
    // If carousel API exists, get the actual visible slide number, accounting for failed slides
    const getVisibleSlideNumber = (rawIndex: number): number => {
        if (!hasVisiblePhotos) return 0;
        
        // Count visible slides up to the current index
        let visibleCount = 0;
        for (let i = 0; i <= rawIndex; i++) {
            if (isSlideVisible(i)) visibleCount++;
        }
        return visibleCount;
    };

    // Get the visible slide number (1-based for display)
    const visibleSlideNumber = hasVisiblePhotos ? getVisibleSlideNumber(currentSlide) : 0;

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
                    <div className="flex items-center gap-2">
                        <div className="text-white font-bold truncate">
                            {place.name} - Photo {hasVisiblePhotos ? visibleSlideNumber : 0} of {visibleSlideCount}
                        </div>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-white/80 hover:text-white hover:bg-white/10"
                                    >
                                        <Icons.infoCircle className="h-4 w-4" />
                                        <span className="sr-only">Photo Source Information</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-black/95 text-white/90">
                                    Photos are sourced from Google Maps and its users. They are not taken or owned by Charlotte Third Places.
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
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
                <div className="flex-grow relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
                    <Carousel
                        setApi={setApi}
                        opts={{ loop: photos.length > 1, align: "center" }}
                        className="w-full h-full"
                    >
                        <CarouselContent className="h-full">
                            {photos.map((photo, index) => {
                                const isVisible = isSlideVisible(index);
                                
                                return (
                                    <CarouselItem 
                                        key={`photo-${index}`} 
                                        className="flex items-center justify-center h-full"
                                        // Skip rendering/hide content but keep carousel structure
                                        style={{
                                            visibility: isVisible ? 'visible' : 'hidden',
                                            height: isVisible ? undefined : '0px'
                                        }}
                                    >
                                        {/* Only show loading indicator for visible slides */}
                                        {isVisible && loadingSlide === index && (
                                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50">
                                                <Icons.loader className="h-10 w-10 animate-spin text-primary" />
                                            </div>
                                        )}
                                        
                                        {/* Only render image content for visible slides */}
                                        {isVisible && (
                                            <div className="flex items-center justify-center h-full w-full p-4">
                                                <div className="relative flex items-center justify-center">
                                                    <Image
                                                        src={optimizeGooglePhotoUrl(photo)}
                                                        alt={`${place.name} photo ${index + 1}`}
                                                        width={1280}
                                                        height={720}
                                                        quality={80}
                                                        priority={index === 0}
                                                        sizes="(max-width: 768px) 90vw, (max-width: 1200px) 80vw, 1200px"
                                                        className={cn(
                                                            "object-contain transition-opacity duration-300",
                                                            loadedIndices.has(index) ? 'opacity-100' : 'opacity-0'
                                                        )}
                                                        onLoad={() => {
                                                            setLoadedIndices(prev => {
                                                                const updated = new Set(prev);
                                                                updated.add(index);
                                                                return updated;
                                                            });
                                                            if (loadingSlide === index) setLoadingSlide(null);
                                                        }}
                                                        onError={(e) => {
                                                            console.error(`Failed to load image ${index + 1}: ${photo}`, e);
                                                            
                                                            // Update failed indices in a non-looping way
                                                            setFailedIndices(prev => {
                                                                const updated = new Set(prev);
                                                                updated.add(index);
                                                                
                                                                // Check if all photos have failed after adding this one
                                                                if (updated.size === photos.length) {
                                                                    // Use setTimeout to avoid state update during render
                                                                    setTimeout(() => {
                                                                        setVisibleSlideCount(0);
                                                                    }, 0);
                                                                }
                                                                
                                                                return updated;
                                                            });
                                                            
                                                            if (loadingSlide === index) setLoadingSlide(null);
                                                        }}
                                                        unoptimized={photo.includes('googleusercontent.com')}
                                                        referrerPolicy="no-referrer"
                                                        style={{ 
                                                            maxHeight: 'calc(80vh - 8rem)',
                                                            maxWidth: '100%',
                                                            width: 'auto',
                                                            height: 'auto',
                                                            objectFit: 'contain'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </CarouselItem>
                                );
                            })}
                        </CarouselContent>
                        
                        {/* Only show navigation controls if we have multiple visible photos */}
                        {visibleSlideCount > 1 && (
                            <>
                                <CarouselPrevious
                                    variant="ghost"
                                    className={cn(
                                        "absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full text-white z-50 w-10 h-10 items-center justify-center border-none disabled:bg-black/30 disabled:text-gray-500",
                                        "hidden md:flex"
                                    )}
                                    aria-label="Previous photo"
                                />
                                <CarouselNext
                                    variant="ghost"
                                    className={cn(
                                        "absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full text-white z-50 w-10 h-10 items-center justify-center border-none disabled:bg-black/30 disabled:text-gray-500",
                                        "hidden md:flex"
                                    )}
                                    aria-label="Next photo"
                                />
                            </>
                        )}
                    </Carousel>
                    
                    {/* Show message when no photos are visible */}
                    {!hasVisiblePhotos && (
                        <div className="absolute inset-0 flex items-center justify-center text-white text-center p-8 z-40">
                            <div className="bg-black/80 p-6 rounded-lg max-w-md">
                                <Icons.alertCircle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                                <h3 className="text-xl font-bold mb-2">No Photos Available</h3>
                                <p>We were unable to load photos for this place. The images might be temporarily unavailable or have been removed.</p>
                                <Button 
                                    variant="default" 
                                    className="mt-4"
                                    onClick={onClose}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Thumbnails section - only show if we have multiple visible photos */}
                {visibleSlideCount > 1 && (
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
                                        {photos.map((photo, index) => {
                                            // Skip rendering failed thumbnails completely
                                            if (!isSlideVisible(index)) return null;
                                            
                                            return (
                                                <button
                                                    key={`thumb-${index}`}
                                                    className={cn(
                                                        "w-16 h-16 rounded-md overflow-hidden transition-all duration-200 relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black/50",
                                                        index === currentSlide
                                                            ? "ring-2 ring-primary ring-offset-2 ring-offset-black/50"
                                                            : "ring-1 ring-gray-700 opacity-60 hover:opacity-100"
                                                    )}
                                                    onClick={() => api?.scrollTo(index)}
                                                    aria-label={`Go to photo ${index + 1}`}
                                                >
                                                    <Image
                                                        src={optimizeGooglePhotoUrl(photo, 100)}
                                                        alt={`Thumbnail ${index + 1}`}
                                                        fill
                                                        sizes="64px"
                                                        className="object-cover"
                                                        referrerPolicy="no-referrer"
                                                        unoptimized={photo.includes('googleusercontent.com')}
                                                        onError={(e) => {
                                                            // Hide this thumbnail by marking it as failed
                                                            setFailedIndices(prev => {
                                                                const updated = new Set(prev);
                                                                updated.add(index);
                                                                return updated;
                                                            });
                                                        }}
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            </div>
                        )}

                        <div className="text-white text-center text-xs pb-1 pt-1">
                            {hasVisiblePhotos ? visibleSlideNumber : 0} / {visibleSlideCount}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};