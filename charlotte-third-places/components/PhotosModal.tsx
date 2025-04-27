"use client";

import Image from 'next/image';
import { Place } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FC, useState, useRef, useEffect, useCallback } from 'react';
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface PhotosModalProps {
    place: Place | null;
    open: boolean;
    onClose: () => void;
}

export const PhotosModal: FC<PhotosModalProps> = ({ place, open, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showThumbnails, setShowThumbnails] = useState(true);
    const [imageLoaded, setImageLoaded] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const thumbnailsRef = useRef<HTMLDivElement>(null);

    // Reset the current index when the place changes
    useEffect(() => {
        if (open && place) {
            setCurrentIndex(0);
            setImageLoaded(false);
        }
    }, [place, place?.recordId, open]);

    const handleNext = useCallback(() => {
        if (!place || !place.photos) return;
        setCurrentIndex((prev) => (prev + 1) % place.photos.length);
        setImageLoaded(false);
    }, [place]);

    const handlePrevious = useCallback(() => {
        if (!place || !place.photos) return;
        setCurrentIndex((prev) => (prev === 0 ? place.photos.length - 1 : prev - 1));
        setImageLoaded(false);
    }, [place]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrevious();
        if (e.key === 'Escape') onClose();
    }, [handleNext, handlePrevious, onClose]);

    // Add keyboard event listeners
    useEffect(() => {
        if (open) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [open, handleKeyDown]);

    // If there are no photos, don't render anything
    if (!place?.photos?.length) return null;

    const photos = place.photos;
    const currentPhoto = photos[currentIndex];
    
    // Generate photo URL parameters to optimize based on device size
    // Remove any string artifacts from the photo URL
    const cleanPhotoUrl = (url: string): string => {
        if (!url) return '';
        
        // Extract the actual URL from string representation
        if (typeof url === 'string') {
            // Check for URL pattern within possible string artifacts
            const urlMatch = url.match(/(https?:\/\/[^\s,\[\]'"]+)/);
            if (urlMatch && urlMatch[0]) {
                return urlMatch[0];
            }
        }
        return url;
    };

    // Optimize Google Photos URLs for better quality
    const optimizeGooglePhotoUrl = (url: string, width = 1280): string => {
        if (!url || !url.includes('googleusercontent.com')) return url;
        
        // Replace size parameters in Google Photos URLs
        return url.replace(/=w\d+-h\d+/, `=w${width}-h${width}`);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent 
                ref={dialogRef}
                className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 md:max-w-4xl lg:max-w-5xl bg-black/95 overflow-hidden"
                onOpenAutoFocus={(e) => e.preventDefault()}
                aria-describedby="photo-description"
            >
                <DialogTitle className="sr-only">
                    {place.name} Photos
                </DialogTitle>
                <DialogDescription id="photo-description" className="sr-only">
                    Photo gallery for {place.name} - Image {currentIndex + 1} of {photos.length}
                </DialogDescription>
                
                <div className="relative flex flex-col h-full">
                    {/* Top bar */}
                    <div className="flex-shrink-0 h-16 flex items-center justify-between px-4 py-2 bg-black/80 border-b border-gray-800">
                        <div className="text-white font-bold truncate">
                            {place.name} - Photo {currentIndex + 1} of {photos.length}
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-white hover:bg-white/20"
                            onClick={onClose}
                        >
                            <Icons.close className="h-6 w-6" />
                        </Button>
                    </div>

                    {/* Main image container */}
                    <div className="flex-grow relative flex items-center justify-center">
                        {!imageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <Icons.loader className="h-10 w-10 animate-spin text-primary" />
                            </div>
                        )}
                        
                        <div className="relative w-full h-full flex items-center justify-center p-4">
                            {currentPhoto && (
                                <div className="relative max-w-full max-h-full">
                                    <Image
                                        src={optimizeGooglePhotoUrl(cleanPhotoUrl(currentPhoto))}
                                        alt={`${place.name} photo ${currentIndex + 1} of ${photos.length}`}
                                        width={1280}
                                        height={720}
                                        quality={80}
                                        priority={currentIndex === 0}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                                        className={cn(
                                            "object-contain max-h-[70vh] transition-opacity duration-300",
                                            imageLoaded ? "opacity-100" : "opacity-0"
                                        )}
                                        onLoad={() => setImageLoaded(true)}
                                        unoptimized={!currentPhoto.includes('googleusercontent.com')}
                                        style={{
                                            maxWidth: '100%',
                                            height: 'auto'
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Navigation arrows - positioned with absolute to ensure they're always visible */}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full text-white z-50 w-10 h-10 flex items-center justify-center"
                            onClick={handlePrevious}
                            aria-label="Previous photo"
                        >
                            <Icons.chevronLeft className="h-6 w-6" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full text-white z-50 w-10 h-10 flex items-center justify-center"
                            onClick={handleNext}
                            aria-label="Next photo"
                        >
                            <Icons.chevronRight className="h-6 w-6" />
                        </Button>
                    </div>

                    {/* Thumbnails */}
                    {photos.length > 1 && (
                        <div className="flex-shrink-0 bg-black/80 border-t border-gray-800">
                            <div className="flex justify-center py-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-white py-0.5"
                                    onClick={() => setShowThumbnails(prev => !prev)}
                                >
                                    {showThumbnails ? 'Hide thumbnails' : 'Show thumbnails'}
                                </Button>
                            </div>
                            
                            {showThumbnails && (
                                <div className="h-24">
                                    <ScrollArea className="h-full">
                                        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
                                            {photos.map((photo, idx) => (
                                                <button
                                                    key={idx}
                                                    className={cn(
                                                        "flex-shrink-0 w-16 h-16 rounded-md overflow-hidden transition-all duration-200",
                                                        idx === currentIndex 
                                                            ? "ring-2 ring-primary" 
                                                            : "ring-1 ring-gray-700 opacity-70 hover:opacity-100"
                                                    )}
                                                    onClick={() => {
                                                        setCurrentIndex(idx);
                                                        setImageLoaded(false);
                                                    }}
                                                    aria-label={`Go to photo ${idx + 1}`}
                                                >
                                                    <div className="relative w-full h-full">
                                                        <Image
                                                            src={optimizeGooglePhotoUrl(cleanPhotoUrl(photo), 100)}
                                                            alt={`Thumbnail ${idx + 1}`}
                                                            width={64}
                                                            height={64}
                                                            className="object-cover"
                                                            unoptimized={!photo.includes('googleusercontent.com')}
                                                        />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}

                            <div className="text-white text-center pb-2">
                                {currentIndex + 1} / {photos.length}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};