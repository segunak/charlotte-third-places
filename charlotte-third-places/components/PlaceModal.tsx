"use client";

import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FC, useRef, useEffect, useMemo, lazy } from "react";
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const LazyPlaceDetails = lazy(() => import('@/components/PlaceDetails'));

interface PlaceModalProps {
    place: Place;
    onClose: () => void;
}

export const PlaceModal: FC<PlaceModalProps> = ({ place, onClose }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [place.airtableRecordId]); // Only run when the place changes

    const shareUrl = useMemo(() => `${window.location.origin}/places/${place.airtableRecordId}`, [place.airtableRecordId]);

    const handleShare = async () => {
        const shareData = {
            title: place.name,
            text: `Charlotte Third Places: ${place.name}`,
            url: shareUrl,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                console.log("Successfully shared");
            } catch (error) {
                console.error("Error sharing", error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareData.url);
                alert("Link copied to clipboard!");
            } catch (error) {
                console.error("Failed to copy the link to clipboard", error);
            }
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent
                className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full sm:w-auto bg-card sm:max-w-7xl sm:mx-auto rounded-lg sm:rounded-xl max-h-[80vh] sm:max-h-[95vh] overflow-y-auto"
                onOpenAutoFocus={(e) => {
                    if (contentRef.current) {
                        contentRef.current.scrollTop = 0;
                    }
                    e.preventDefault();
                }}
            >
                <DialogHeader className="mt-5 sm:mt-0">
                    <DialogTitle>{place.name}</DialogTitle>
                    <DialogDescription>{place.type.join(", ")}</DialogDescription>
                </DialogHeader>
                <Separator />
                <div className="space-y-[0.6rem]">
                    <div className="flex justify-center space-x-4">
                        {place.googleMapsProfileURL?.trim() && (
                            <Button variant="outline">
                                <ResponsiveLink href={place.googleMapsProfileURL.trim()}>
                                    <Icons.google className="h-6 w-6" />
                                </ResponsiveLink>
                            </Button>
                        )}
                        {place.website?.trim() && (
                            <Button variant="outline">
                                <ResponsiveLink href={place.website.trim()}>
                                    <Icons.externalLink className="h-6 w-6" />
                                </ResponsiveLink>
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleShare}>
                            <Icons.share className="h-6 w-6 text-primary" />
                        </Button>
                    </div>
                    <Separator />
                    <LazyPlaceDetails place={place} />
                </div>

                <div className="flex justify-center mt-4">
                    <Button className="!font-bold" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

