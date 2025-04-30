"use client";

import React, { useState, useEffect, useMemo } from 'react';
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

// --- Utility functions from PhotosModal ---
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
    const cleanedUrl = cleanPhotoUrl(url);
    if (!cleanedUrl || !cleanedUrl.includes('googleusercontent.com')) return cleanedUrl;
    // Adjust regex to handle URLs that might already have size parameters
    return cleanedUrl.replace(/=w\d+(?:-h\d+)?/, `=w${width}`);
};

// Helper component to handle client-side logic
export function PlacePageClient({ place }: { place: Place }) {
    const id = place.recordId;
    // --- Move these up so they're available for hooks ---
    const photos = useMemo(() => place.photos || [], [place.photos]);
    const hasPhotos = photos.length > 0;
    const optimizedPhotos = useMemo(() => photos.map(photo => optimizeGooglePhotoUrl(photo, 1024)), [photos]);
    // --- State and Refs from PhotosModal (adapted) ---
    const [api, setApi] = useState<CarouselApi>();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [totalSlides, setTotalSlides] = useState<number>(0);
    const [loadingSlide, setLoadingSlide] = useState<number | null>(null); // Start loading slide 0 if photos exist
    const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set<number>());
    const [showThumbnails, setShowThumbnails] = useState(true); // Keep thumbnails visible by default on page
    const isMobile = useIsMobile();
    const [showInfoDrawer, setShowInfoDrawer] = useState(false);

    // --- Effects from PhotosModal (adapted) ---
    useEffect(() => {
        if (place?.photos?.length) {
            setTotalSlides(place.photos.length);
            setCurrentSlide(0);
            setLoadedIndices(new Set<number>());
            setLoadingSlide(0); // Mark first slide as loading initially
            api?.scrollTo(0, true);
        }
    }, [place?.photos, api]);

    useEffect(() => {
        if (!api) return;

        const onSelect = () => {
            if (!api) return;
            const selected = api.selectedScrollSnap();
            setCurrentSlide(selected);
            if (!loadedIndices.has(selected)) {
                setLoadingSlide(selected);
            } else if (loadingSlide === selected) {
                setLoadingSlide(null);
            }
        };

        setTotalSlides(api.scrollSnapList().length);
        setCurrentSlide(api.selectedScrollSnap());
        // Initial loading slide set above

        api.on("select", onSelect);
        api.on("reInit", onSelect);

        return () => {
            api.off("select", onSelect);
            api.off("reInit", onSelect);
        };
    }, [api, loadedIndices, loadingSlide]);

    // Ensure the first image is marked as loaded if already loaded
    useEffect(() => {
        if (hasPhotos && loadedIndices.size === 0 && typeof window !== 'undefined') {
            const img = document.querySelector(
                'img[alt="' + place.name + ' photo 1 of ' + photos.length + '"]'
            ) as HTMLImageElement | null;
            if (img && img.complete) {
                setLoadedIndices((prev) => new Set(prev).add(0));
            }
        }
    }, [hasPhotos, loadedIndices, place.name, photos.length]);

    // --- Component Props ---
    const website = place.website?.trim();
    const appleMapsProfileURL = place.appleMapsProfileURL?.trim();
    const googleMapsProfileURL = place.googleMapsProfileURL?.trim();
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/places/${place.recordId}` : `https://www.charlottethirdplaces.com/places/${place.recordId}`;

    return (
        <div id={id} className="px-4 sm:px-6 py-8 space-y-6 mx-auto max-w-full lg:max-w-6xl"> {/* Increased max-width */}
            <h1 className="text-3xl sm:text-4xl font-bold text-center leading-tight border-b pb-4 mb-6">
                {place.name}
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
                                opts={{ loop: photos.length > 1, align: "center" }}
                                className="w-full h-[300px] md:h-[500px]" // Increased height for better visibility
                            >
                                <CarouselContent className="h-full">
                                    {optimizedPhotos.map((photo, idx) => (
                                        <CarouselItem key={idx} className="h-full bg-black/5 flex items-center justify-center">
                                            <div className="relative w-full h-[300px] md:h-[500px] flex items-center justify-center">
                                                {!loadedIndices.has(idx) && (
                                                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10">
                                                        <Icons.loader className="h-10 w-10 animate-spin text-primary" />
                                                    </div>
                                                )}
                                                <Image
                                                    src={photo}
                                                    alt={`${place.name} photo ${idx + 1} of ${photos.length}`}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                                                    className="!relative !h-auto !w-auto max-h-[300px] md:max-h-[500px] max-w-full object-contain transition-opacity duration-300"
                                                    style={{
                                                        opacity: loadedIndices.has(idx) ? 1 : 0,
                                                        transition: "opacity 0.3s",
                                                    }}
                                                    priority={idx === 0}
                                                    onLoad={() => {
                                                        setLoadedIndices((prev) => new Set(prev).add(idx));
                                                    }}
                                                    onError={() => {
                                                        setLoadedIndices((prev) => new Set(prev).add(idx));
                                                    }}
                                                    unoptimized={photo.includes('googleusercontent.com')}
                                                    referrerPolicy="no-referrer"
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {photos.length > 1 && (
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
                        </div>

                        {/* Thumbnails (only if more than 1 photo) */}
                        {photos.length > 1 && (
                            <div className="bg-card border border-gray-300 shadow-sm rounded-lg p-2">
                                <div className="flex justify-between items-center mb-1 px-1">
                                    <span className="text-xs text-muted-foreground">Photo {currentSlide + 1} of {totalSlides}</span>
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
                                            {photos.map((photo, idx) => (
                                                <button
                                                    key={idx}
                                                    className={cn(
                                                        "w-16 h-16 rounded-md overflow-hidden transition-all duration-200 relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                                                        idx === currentSlide
                                                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                                            : "ring-1 ring-gray-300 opacity-70 hover:opacity-100"
                                                    )}
                                                    onClick={() => api?.scrollTo(idx)}
                                                    aria-label={`Go to photo ${idx + 1}`}
                                                >
                                                    <Image
                                                        src={optimizeGooglePhotoUrl(photo, 100)} // Smaller size for thumbs
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
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Column 2: Details Card */}
                {/* Add col-span-full if no photos, or adjust grid logic if needed */}
                <div className={cn(!hasPhotos && "lg:col-span-2")}>
                    <Card className="border border-gray-300 shadow-sm h-full"> {/* Ensure card can take height */}
                        <CardContent className="pt-6"> {/* Added pt-6 for consistency */}
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
                                    {/* Removed Camera button as photos are inline */}
                                    <ShareButton
                                        placeName={place.name}
                                        url={shareUrl}
                                        variant="outline"
                                        displayType="icon"
                                        aria-label="Share Place"
                                    />
                                </div>
                                <Separator />
                                <p><strong>Type:</strong> {place.type.join(", ")}</p>
                                <p><strong>Address:</strong> {place.address}</p>
                                <p><strong>Neighborhood:</strong> {place.neighborhood}</p>
                                <p><strong>Size:</strong> {place.size}</p>
                                <p><strong>Purchase Required:</strong> {place.purchaseRequired}</p>
                                <p><strong>Parking:</strong> {place.parking.join(", ")}</p>
                                <p><strong>Free Wi-Fi:</strong> {place.freeWiFi}</p>
                                <p><strong>Has Cinnamon Rolls:</strong> {place.hasCinnamonRolls}</p>
                                <Separator />
                                <p><strong>Description:</strong> {place.description?.trim() || "A third place in the Charlotte, North Carolina area."}</p>
                                <p><strong>Curator's Comments:</strong> {place.comments?.trim() || "None."}</p>
                                <Separator />
                                <p><strong>Metadata:</strong> Added: {new Date(place.createdDate).toLocaleDateString("en-US")} | Last Updated: {new Date(place.lastModifiedDate).toLocaleDateString("en-US")}.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
