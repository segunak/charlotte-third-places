"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from "@/components/ui/carousel";
import Image from "next/image";
import type { CarouselApi } from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { PlaceContent } from "@/components/PlaceContent";
import { getPlaceHighlights } from "@/components/PlaceHighlights";
import { ChatModal } from "@/components/ChatModal";
import { injectDynamicTags } from "@/lib/operating-hours";

// Single place detail page — not inside a FilterProvider tree.
// Enriches the place directly with injectDynamicTags() instead of usePlaces().
// See PlacesContext in FilterContext.tsx for the full explanation of the two paths.
export function PlacePageClient({ place: rawPlace }: { place: Place }) {
    const place = useMemo(() => injectDynamicTags([rawPlace])[0], [rawPlace]);

    const id = place.recordId;

    const photos = useMemo(() => (place?.photos ?? []), [place]);
    const totalPhotos = photos.length;

    const [api, setApi] = useState<CarouselApi>();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set<number>());
    const [showThumbnails, setShowThumbnails] = useState(true);
    const isMobile = useIsMobile();
    const [showInfoDrawer, setShowInfoDrawer] = useState(false);
    const [showChat, setShowChat] = useState(false);

    // Get highlights for this place
    const highlights = useMemo(() => getPlaceHighlights(place), [place]);

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
    const hasPhotos = totalPhotos > 0;

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
        if (totalPhotos > 0) {
            setFailedIndices(new Set<number>());
            setCurrentSlide(0);
            setShowThumbnails(true);
        } else {
            setFailedIndices(new Set<number>());
            setCurrentSlide(0);
        }
    }, [totalPhotos, place.recordId]);

    useEffect(() => {
        if (!api) return;

        api.reInit();

        if (!hasVisiblePhotos) return;

        setCurrentSlide(prev => {
            const targetSlide = Math.min(prev, visibleSlideCount - 1);
            api.scrollTo(targetSlide, true);
            return targetSlide;
        });
    }, [api, visibleSlideCount, hasVisiblePhotos, place.recordId]);

    useEffect(() => {
        if (!api || totalPhotos === 0) return;

        api.scrollTo(0, true);
    }, [api, totalPhotos, place.recordId]);

    useEffect(() => {
        if (!api) return;

        const onSelect = () => {
            const selected = api.selectedScrollSnap();
            // Only update state if the value has actually changed. This prevents unnecessary re-renders
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

    const activeIndices = useMemo(() => {
        if (!hasVisiblePhotos) return new Set<number>();
        const prev = (currentSlide - 1 + visiblePhotos.length) % visiblePhotos.length;
        const next = (currentSlide + 1) % visiblePhotos.length;
        return new Set([prev, currentSlide, next]);
    }, [currentSlide, visiblePhotos.length, hasVisiblePhotos]);

    const enableLoop = false;
    return (
        <div id={id} className="px-4 sm:px-6 py-8 space-y-6 mx-auto max-w-full lg:max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-center leading-tight border-b pb-4 mb-6 flex items-center justify-center gap-3">
                {place.name}
            </h1>

            {/* Photo Gallery on Top */}
            {hasPhotos && (
                <div className="w-full space-y-4">
                    <div className="relative bg-muted rounded-lg overflow-hidden border border-gray-300 shadow-md">
                        {/* Photo source disclaimer - match PhotosModal UX */}
                        <div className="absolute top-2 right-2 z-10">
                            {isMobile ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-full bg-black/40 hover:bg-black/60 text-white"
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
                                                className="h-8 w-8 p-0 rounded-full bg-black/40 hover:bg-black/60 text-white"
                                                aria-label="Photo Source Information"
                                            >
                                                <Icons.infoCircle className="h-6 w-6" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="max-w-[200px] text-center bg-black/80 text-white">
                                            Photos come from publicly available sources, the site curator, and users. Use the Contribute page to request a takedown.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        <Carousel
                            setApi={setApi}
                            opts={{ loop: enableLoop, align: "center" }}
                            className="w-full h-[300px] md:h-[400px]"
                        >
                            <CarouselContent className="h-full">
                                {visiblePhotos.map((photo, idx) => {
                                    const origIdx = visibleToOriginalIdx[idx];
                                    const isActive = activeIndices.has(idx);
                                    return (
                                        <CarouselItem
                                            key={`photo-${origIdx}`}
                                            className="h-full bg-black/5 flex items-center justify-center"
                                        >
                                            <div className="relative w-full h-[300px] md:h-[400px] flex items-center justify-center bg-black">
                                                {isActive ? (
                                                    <Image
                                                        src={photo}
                                                        alt={`${place?.name ?? ''} photo ${idx + 1}`}
                                                        fill
                                                        quality={80}
                                                        sizes="(max-width: 767px) 95vw, (max-width: 1023px) 80vw, 800px"
                                                        loading="eager"
                                                        fetchPriority={idx === currentSlide ? "high" : "auto"}
                                                        decoding="async"
                                                        placeholder="empty"
                                                        className={cn(
                                                            "object-contain transition-opacity duration-300 ease-in-out",
                                                        )}
                                                        style={{
                                                            objectFit: 'contain',
                                                            objectPosition: 'center',
                                                        }}
                                                        onError={() => handleImageError(origIdx, photo)}
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
                            {visibleSlideCount > 1 && (
                                <>
                                    <CarouselPrevious
                                        variant="ghost"
                                        iconClassName="h-7 w-7"
                                        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white border-none h-9 w-9"
                                        aria-label="Previous photo"
                                    />
                                    <CarouselNext
                                        variant="ghost"
                                        iconClassName="h-7 w-7"
                                        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white border-none h-9 w-9"
                                        aria-label="Next photo"
                                    />
                                </>
                            )}
                        </Carousel>

                        {/* Show message when no photos are visible */}
                        {!hasVisiblePhotos && hasPhotos && (
                            <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4 z-30">
                                <div className="bg-black/80 p-6 rounded-lg max-w-sm shadow-lg">
                                    <Icons.alertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
                                    <h3 className="text-lg font-semibold mb-2">No Photos Available</h3>
                                    <p className="text-sm text-white/80">We couldn't load the photos for this place at the moment.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Thumbnails (only if more than 1 visible photo) */}
                    {visibleSlideCount > 1 && (
                        <div className="bg-card border border-gray-300 shadow-xs rounded-lg p-2">
                            <div className="flex justify-between items-center mb-1 px-1">
                                <span className="text-xs text-muted-foreground">Photo {hasVisiblePhotos ? (currentSlide + 1) : 0} of {visibleSlideCount}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-foreground py-0.5 h-auto text-xs"
                                    onClick={() => setShowThumbnails(prev => !prev)}
                                >
                                    {showThumbnails ? 'Hide' : 'Show'} Thumbnails
                                </Button>
                            </div>
                            {showThumbnails && (
                                <ScrollArea className="h-20 w-full whitespace-nowrap rounded-md">
                                    <div className="flex gap-2 py-1">
                                        {visiblePhotos.map((photo, idx) => {
                                            const origIdx = visibleToOriginalIdx[idx];
                                            const thumbVisibleNumber = idx + 1;
                                            return (
                                                <button
                                                    key={`thumb-${origIdx}`}
                                                    className={cn(
                                                        "w-16 h-16 rounded-md overflow-hidden transition-all duration-200 relative focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                                                        idx === currentSlide
                                                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                                            : "ring-1 ring-gray-300 opacity-70 hover:opacity-100"
                                                    )}
                                                    onClick={() => api?.scrollTo(idx)}
                                                    aria-label={`Go to photo ${thumbVisibleNumber}`}
                                                >
                                                    <Image
                                                        src={photo}
                                                        alt={`Thumbnail ${thumbVisibleNumber}`}
                                                        fill
                                                        quality={40}
                                                        sizes="64px"
                                                        className="object-cover"
                                                        loading="lazy"
                                                        placeholder="empty"
                                                        referrerPolicy="no-referrer"
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
                    )}
                </div>
            )}

            {/* Place Content Below */}
            <Card className={cn(
                "border border-gray-300 shadow-xs relative",
                highlights.gradients.card
            )}>
                {highlights.ribbon && (
                    <div className={cn(
                        "px-4 py-2 text-center font-semibold text-lg flex items-center justify-center gap-1.5",
                        highlights.ribbon.bgClass
                    )}>
                        {highlights.ribbon.icon}
                        {highlights.ribbon.label}
                        {highlights.ribbon.icon}
                    </div>
                )}
                <CardContent className={highlights.ribbon ? "pt-4" : "pt-6"}>
                    <PlaceContent
                        place={place}
                        layout="page"
                        showPhotosButton={false}
                        onAskAI={place.operational !== "Coming Soon" ? () => setShowChat(true) : undefined}
                    />
                </CardContent>
            </Card>

            {/* Chat Modal */}
            <ChatModal
                open={showChat}
                onClose={() => setShowChat(false)}
                place={place}
            />
        </div>
    );
}