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
    /**
     * Stacking z-index for this modal surface. Applied as inline style to both
     * the overlay and content so it overrides any class-based z. Higher values
     * stack above lower ones.
     */
    zIndex?: number;
}

export const PhotosModal: FC<PhotosModalProps> = ({ place, open, onClose, zIndex }) => {
    const [api, setApi] = useState<CarouselApi>();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set<number>());
    const [showThumbnails, setShowThumbnails] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();
    const [showInfoDrawer, setShowInfoDrawer] = useState(false);
    const hasResetScrollRef = useRef(false);

    const getDefaultThumbnailVisibility = useCallback(() => {
        if (typeof window === 'undefined') return false;
        return !isMobile && window.innerWidth >= 768;
    }, [isMobile]);

    const photos = useMemo(() => (place?.photos ?? []), [place]);
    const airtableRecordId = place?.recordId ?? '';
    const totalPhotos = photos.length;

    const visiblePhotoData = useMemo(() => {
        const arr: { photo: string; originalIdx: number }[] = [];
        photos.forEach((photo, idx) => {
            if (!failedIndices.has(idx)) {
                arr.push({ photo, originalIdx: idx });
            }
        });
        return arr;
    }, [photos, failedIndices]);
    const visiblePhotos = useMemo(() => visiblePhotoData.map((d) => d.photo), [visiblePhotoData]);
    const visibleToOriginalIdx = useMemo(() => visiblePhotoData.map((d) => d.originalIdx), [visiblePhotoData]);
    const visibleSlideCount = visiblePhotos.length;
    const hasVisiblePhotos = visibleSlideCount > 0;

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    const markPhotoFailed = useCallback((index: number, photoUrl: string) => {
        console.error(`Failed to load image ${index + 1}: ${photoUrl}`);
        setFailedIndices(prev => {
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
            setCurrentSlide(0);
            setShowThumbnails(getDefaultThumbnailVisibility());
            hasResetScrollRef.current = false;
        } else if (!open) {
            setFailedIndices(new Set<number>());
            setCurrentSlide(0);
        }
    }, [open, totalPhotos, airtableRecordId, getDefaultThumbnailVisibility]);

    // Only scroll to first slide once per open event
    useEffect(() => {
        if (open && api && totalPhotos > 0 && !hasResetScrollRef.current) {
            hasResetScrollRef.current = true;
            api.scrollTo(0, true);
        }
    }, [open, api, totalPhotos, airtableRecordId]);

    // Handle carousel selection
    useEffect(() => {
        if (!api) return;

        const onSelect = () => {
            const selected = api.selectedScrollSnap();
            if (selected !== currentSlide) {
                setCurrentSlide(selected);
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
    }, [api, currentSlide]);

    useEffect(() => {
        if (!api) return;

        api.reInit();

        if (!hasVisiblePhotos) return;

        setCurrentSlide(prev => {
            const targetSlide = Math.min(prev, visibleSlideCount - 1);
            api.scrollTo(targetSlide, true);
            return targetSlide;
        });
    }, [api, visibleSlideCount, hasVisiblePhotos, airtableRecordId]);

    const renderedSlideIndices = useMemo(() => {
        if (!hasVisiblePhotos) return new Set<number>();
        const indices = new Set<number>();
        const radius = Math.min(2, visibleSlideCount - 1);

        for (let offset = -radius; offset <= radius; offset += 1) {
            indices.add((currentSlide + offset + visibleSlideCount) % visibleSlideCount);
        }

        return indices;
    }, [currentSlide, visibleSlideCount, hasVisiblePhotos]);

    // Early return - important to place after all hooks are defined
    if (!place || totalPhotos === 0) return null;

    const enableLoop = false;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                ref={dialogRef}
                crossCloseIconSize="h-7 w-7"
                crossCloseIconColor="text-white"
                crossCloseClassName="hidden md:block"
                className="max-h-[86dvh] sm:max-h-[95dvh] w-full h-full p-0 md:max-w-3xl bg-black/95 overflow-hidden flex flex-col"
                style={zIndex !== undefined ? { zIndex } : undefined}
                overlayStyle={zIndex !== undefined ? { zIndex } : undefined}
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
                <div className="shrink-0 h-16 flex items-center justify-between px-4 py-2 bg-black/80 border-b border-gray-800">
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
                                    <Icons.infoCircle className="h-6 w-6" />
                                </Button>
                                <Drawer open={showInfoDrawer} onOpenChange={setShowInfoDrawer}>
                                    <DrawerContent className="bg-black/95 text-white">
                                        <DrawerHeader>
                                            <DrawerTitle>Photo Source Information</DrawerTitle>
                                            <DrawerDescription className="text-white/90">
                                                Photos come from publicly available sources, the site curator, and users. Use the Contribute page to request a takedown.
                                            </DrawerDescription>
                                            <DrawerClose asChild>
                                                <Button variant="ghost" className="mt-4 text-base w-full text-white border border-white/20">Close</Button>
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
                                            <Icons.infoCircle className="h-6 w-6" />
                                            <span className="sr-only">Photo Source Information</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="bg-black/95 text-white/90 max-w-xs">
                                        Photos come from publicly available sources, the site curator, and users. Use the Contribute page to request a takedown.
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>

                {/* Main image container using Carousel */}
                <div className="grow relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
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
                                const shouldRenderImage = renderedSlideIndices.has(idx);
                                const isCurrentSlide = idx === currentSlide;
                                return (
                                    <CarouselItem
                                        key={`photo-${origIdx}`}
                                        className="flex items-center justify-center h-full p-1 md:p-2"
                                    >
                                        <div className="relative w-full h-[52dvh] md:h-[72dvh] lg:h-[76dvh] max-h-full flex items-center justify-center bg-black">
                                            {shouldRenderImage ? (
                                                <Image
                                                    src={photo}
                                                    alt={`${place?.name ?? ''} photo ${idx + 1}`}
                                                    fill
                                                    quality={80}
                                                    sizes="(max-width: 767px) 95vw, 768px"
                                                    loading="eager"
                                                    fetchPriority={isCurrentSlide ? "high" : "auto"}
                                                    decoding="async"
                                                    placeholder="empty"
                                                    className={cn(
                                                        "object-contain transition-opacity duration-300 ease-in-out",
                                                    )}
                                                    style={{
                                                        objectFit: 'contain',
                                                        objectPosition: 'center',
                                                    }}
                                                    onError={() => markPhotoFailed(origIdx, photo)}
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-black rounded" aria-hidden="true" />
                                            )}
                                        </div>
                                    </CarouselItem>
                                );
                            })}
                        </CarouselContent>

                        {/* Navigation controls - show for every viewport when multiple photos exist */}
                        {visibleSlideCount > 1 && (
                            <>
                                <CarouselPrevious
                                    variant="ghost"
                                    size="icon"
                                    iconClassName="h-7 w-7"
                                    className={cn(
                                        "flex absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-11 w-11 md:h-8 md:w-8 bg-black/45 hover:bg-black/70 rounded-full text-white z-20",
                                        "border border-white/15 disabled:bg-black/25 disabled:text-white/35 disabled:border-white/10 disabled:opacity-45",
                                        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                                    )}
                                    aria-label="Previous photo"
                                />
                                <CarouselNext
                                    variant="ghost"
                                    size="icon"
                                    iconClassName="h-7 w-7"
                                    className={cn(
                                        "flex absolute right-3 md:right-4 top-1/2 -translate-y-1/2 h-11 w-11 md:h-8 md:w-8 bg-black/45 hover:bg-black/70 rounded-full text-white z-20",
                                        "border border-white/15 disabled:bg-black/25 disabled:text-white/35 disabled:border-white/10 disabled:opacity-45",
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
                        "shrink-0 bg-black/80 border-t border-gray-800 z-10 transition-all duration-300 ease-in-out",
                        showThumbnails ? "py-2" : "py-0 h-8"
                    )}>
                        <div className="flex justify-center h-6 items-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white/80 hover:text-white py-0.5 h-auto text-xs"
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
                                showThumbnails ? "h-20 px-3 pb-1" : "h-0"
                            )}
                        >
                            {showThumbnails && (
                                <ScrollArea className="h-full w-full whitespace-nowrap rounded-md">
                                    <div className="inline-flex gap-2 py-1">
                                        {visiblePhotos.map((photo, idx) => {
                                            const origIdx = visibleToOriginalIdx[idx];
                                            const thumbVisibleNumber = idx + 1;
                                            return (
                                                <button
                                                    key={`thumb-${origIdx}`}
                                                    className={cn(
                                                        "w-12 h-12 md:w-14 md:h-14 rounded-md overflow-hidden transition-all duration-200 relative shrink-0 bg-black",
                                                        "focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black/50",
                                                        idx === currentSlide
                                                            ? "ring-2 ring-primary ring-offset-2 ring-offset-black/50"
                                                            : "ring-1 ring-gray-700 opacity-60 hover:opacity-100"
                                                    )}
                                                    onClick={() => api?.scrollTo(idx)}
                                                    aria-label={`Go to photo ${thumbVisibleNumber}`}
                                                >
                                                    <Image
                                                        src={photo}
                                                        alt={`Thumbnail ${thumbVisibleNumber}`}
                                                        fill
                                                        quality={40}
                                                        sizes="(max-width: 767px) 48px, 56px"
                                                        className="object-cover"
                                                        loading="lazy"
                                                        placeholder="empty"
                                                        referrerPolicy="no-referrer"
                                                        onError={() => markPhotoFailed(origIdx, photo)}
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            )}
                        </div>
                    </div>
                )}

                {/* Close button at the bottom for easy access */}
                <div className="shrink-0 w-full flex justify-center items-center py-4 px-6 bg-black/90 border-t border-gray-800">
                    <Button onClick={onClose} className="h-11 text-base w-full md:w-auto md:px-28">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};