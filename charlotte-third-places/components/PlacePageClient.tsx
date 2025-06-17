"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShareButton } from "@/components/ShareButton";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveLink } from "@/components/ResponsiveLink";
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
import { RichTextSection } from "@/components/RichTextSection";
import { QuickFacts } from "@/components/QuickFacts";

// Simple gray placeholder
const blurDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8//9/PQAI8wNPvd7POQAAAABJRU5ErkJggg==';

// --- Utility functions from PhotosModal (exact replica) ---
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

// Helper component to handle client-side logic
export function PlacePageClient({ place }: { place: Place }) {
    const id = place.recordId;

    // Get photos array without filtering - move this to top level
    const photos = useMemo(() => (place?.photos ?? []), [place]);
    const totalPhotos = photos.length;

    const [api, setApi] = useState<CarouselApi>();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set<number>());
    const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set<number>());
    const [showThumbnails, setShowThumbnails] = useState(true);
    const isMobile = useIsMobile();
    const [showInfoDrawer, setShowInfoDrawer] = useState(false);

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
    const hasPhotos = totalPhotos > 0;

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

    // Reset state when place changes
    useEffect(() => {
        if (totalPhotos > 0) {
            setFailedIndices(new Set<number>());
            setLoadedIndices(new Set<number>());
            setCurrentSlide(0);
            setShowThumbnails(true);
        } else {
            setLoadedIndices(new Set<number>());
            setFailedIndices(new Set<number>());
            setCurrentSlide(0);
        }
    }, [totalPhotos]);

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
    }, [currentSlide, visiblePhotos, activeIndices, hasVisiblePhotos]);    // Determine if loop should be enabled - moved from hook to render time calculation
    const enableLoop = hasVisiblePhotos && visibleSlideCount > 1;

    const website = place.website?.trim();
    const appleMapsProfileURL = place.appleMapsProfileURL?.trim();
    const googleMapsProfileURL = place.googleMapsProfileURL?.trim();
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/places/${place.recordId}` : `https://www.charlottethirdplaces.com/places/${place.recordId}`;
    const instagram = place.instagram?.trim();
    const tiktok = place.tiktok?.trim();
    const twitter = place.twitter?.trim();
    const youtube = place.youtube?.trim();
    const facebook = place.facebook?.trim();
    const linkedIn = place.linkedIn?.trim();

    return (
        <div id={id} className="px-4 sm:px-6 py-8 space-y-6 mx-auto max-w-full lg:max-w-6xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-center leading-tight border-b pb-4 mb-6 flex items-center justify-center gap-3">
                {place.name}
                {place.featured && (
                    <Icons.star className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500 flex-shrink-0" title="Featured Place" />
                )}
            </h1>

            {/* Responsive Layout: Grid on large screens, Stacked on smaller */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

                {/* Column 1: Photos Carousel (only if photos exist) */}
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
                                                    className="h-8 w-8 p-0 rounded-full bg-black/40 hover:bg-black/60 text-white"
                                                    aria-label="Photo Source Information"
                                                >
                                                    <Icons.infoCircle className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="left" className="max-w-[200px] text-center bg-black/80 text-white">
                                                Photos are sourced from Google Maps and its users. They are not taken or owned by Charlotte Third Places.
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                            <Carousel
                                setApi={setApi}
                                opts={{ loop: enableLoop, align: "center" }}
                                className="w-full h-[300px] md:h-[500px]" // Increased height for better visibility
                            >
                                <CarouselContent className="h-full">
                                    {visiblePhotos.map((photo, idx) => {
                                        const origIdx = visibleToOriginalIdx[idx];
                                        const isActive = activeIndices.has(idx);
                                        const quality = isActive ? 80 : 40;
                                        const width = isActive ? 1024 : 400;
                                        let isPriority = false;
                                        if (isActive) isPriority = true;
                                        return (
                                            <CarouselItem
                                                key={`photo-${origIdx}`}
                                                className="h-full bg-black/5 flex items-center justify-center"
                                            >
                                                <div className="relative w-full h-[300px] md:h-[500px] flex items-center justify-center">
                                                    {isActive ? (
                                                        <Image
                                                            src={optimizeGooglePhotoUrl(photo, width)}
                                                            alt={`${place?.name ?? ''} photo ${currentSlide + 1}`}
                                                            fill
                                                            quality={quality}
                                                            priority={isPriority}
                                                            sizes="(max-width: 767px) 95vw, (max-width: 1023px) 80vw, 800px"
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
                                                            <svg className="h-12 w-12 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 17l6-6 4 4 8-8" /></svg>
                                                        </div>
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
                                            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white border-none h-9 w-9"
                                            aria-label="Previous photo"
                                        />
                                        <CarouselNext
                                            variant="ghost"
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
                            <div className="bg-card border border-gray-300 shadow-sm rounded-lg p-2">
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
                                                            "w-16 h-16 rounded-md overflow-hidden transition-all duration-200 relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                                                            idx === currentSlide
                                                                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                                                : "ring-1 ring-gray-300 opacity-70 hover:opacity-100"
                                                        )}
                                                        onClick={() => api?.scrollTo(idx)}
                                                        aria-label={`Go to photo ${thumbVisibleNumber}`}
                                                    >
                                                        <Image
                                                            src={optimizeGooglePhotoUrl(photo, 100)} // Smaller size for thumbs
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
                        )}
                    </div>
                )}

                <div className={cn(!hasPhotos && "lg:col-span-2")}>
                    <Card className="border border-gray-300 shadow-sm h-full">
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                <div className="flex justify-center space-x-4">
                                    {googleMapsProfileURL && (
                                        <ResponsiveLink href={googleMapsProfileURL} aria-label="Visit Google Maps Page">
                                            <Button variant="outline">
                                                <Icons.google className="h-6 w-6" />
                                            </Button>
                                        </ResponsiveLink>
                                    )}
                                    {appleMapsProfileURL && (
                                        <ResponsiveLink href={appleMapsProfileURL} aria-label="Visit Apple Maps Page">
                                            <Button variant="outline">
                                                <Icons.apple className="h-6 w-6" />
                                            </Button>
                                        </ResponsiveLink>
                                    )}
                                    {website && (
                                        <ResponsiveLink href={website} aria-label="Visit Website">
                                            <Button variant="outline">
                                                <Icons.globe className="h-7 w-7" />
                                            </Button>
                                        </ResponsiveLink>
                                    )}
                                    <ShareButton
                                        placeName={place.name}
                                        url={shareUrl}
                                        variant="outline"
                                        displayType="icon"
                                        aria-label="Share Place"
                                    />
                                </div>

                                <Separator />

                                <QuickFacts
                                    address={place.address}
                                    neighborhood={place.neighborhood}
                                    size={place.size}
                                    purchaseRequired={place.purchaseRequired}
                                    parking={place.parking}
                                    freeWiFi={place.freeWiFi}
                                    hasCinnamonRolls={place.hasCinnamonRolls}
                                    instagram={instagram}
                                    tiktok={tiktok}
                                    twitter={twitter}
                                    youtube={youtube}
                                    facebook={facebook}
                                    linkedIn={linkedIn}
                                />

                                <Separator />

                                {/* DESCRIPTION - Always visible, high priority */}
                                <RichTextSection
                                    heading="Description"
                                    priority="high"
                                >
                                    {place.description?.trim() || "A third place in the Charlotte, North Carolina area."}
                                </RichTextSection>

                                {/* COMMENTS - Smart truncation for long content, only if comments exist */}
                                {place.comments?.trim() && (
                                    <>
                                        <Separator />
                                        <RichTextSection
                                            heading="Comments"
                                            priority="medium"
                                        >
                                            {place.comments.trim()}
                                        </RichTextSection>
                                    </>
                                )}
                                <Separator />
                                <p>
                                    <Icons.folder className="h-4 w-4 text-yellow-400 inline mr-2" />
                                    <span className="font-semibold">Metadata:</span> Added: {new Date(place.createdDate).toLocaleDateString("en-US")} | Last Updated: {new Date(place.lastModifiedDate).toLocaleDateString("en-US")}.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}