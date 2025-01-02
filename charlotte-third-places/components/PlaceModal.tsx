"use client"

import Link from "next/link";
import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons"
import { FC, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator"
import { ShareButton } from "@/components/ShareButton";
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PlaceModalProps {
    place: Place;
    onClose: () => void;
}

export const PlaceModal: FC<PlaceModalProps> = ({ place, onClose }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to the top when the modal opens
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [])

    const shareUrl = `${window.location.origin}/places/${place.airtableRecordId}`;

    const handleShare = async () => {
        const shareData = {
            title: place.name,
            text: `Charlotte Third Places: ${place.name}`,
            url: `${window.location.origin}/places/${place.airtableRecordId}`,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                console.log('Successfully shared');
            } catch (error) {
                console.error('Error sharing', error);
            }
        } else {
            // Fallback to copying the link to the clipboard
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
                className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full sm:w-auto bg-card
                    sm:max-w-7xl sm:mx-auto rounded-lg sm:rounded-xl max-h-[80vh] sm:max-h-[95vh] overflow-y-auto"
                onOpenAutoFocus={(e) => {
                    // Ensure the modal content starts at the top
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
                        <Button
                            variant="outline"
                            asChild
                            className="flex items-center space-x-3"
                        >
                            <ResponsiveLink
                                href={place.googleMapsProfileURL?.trim() || "#"}
                            >
                                <Icons.google className="h-6 w-6" />
                            </ResponsiveLink>
                        </Button>
                        {place.website?.trim() && (
                            <Button
                                variant="outline"
                                asChild
                                className="flex items-center space-x-3"
                            >
                                <ResponsiveLink
                                    href={place.website?.trim()}
                                >
                                    <Icons.externalLink className="h-6 w-6" />
                                </ResponsiveLink>
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={handleShare}
                            className="flex items-center space-x-3"
                        >
                            <Icons.share className="h-6 w-6 text-primary" />
                        </Button>
                    </div>
                    <Separator />
                    <p><strong>Address:</strong> {place.address}</p>
                    <p><strong>Neighborhood:</strong> {place.neighborhood}</p>
                    <p><strong>Size:</strong> {place.size}</p>
                    <p><strong>Purchase Required:</strong> {place.purchaseRequired}</p>
                    <p><strong>Parking Situation:</strong> {place.parkingSituation}</p>
                    <p><strong>Free Wifi:</strong> {place.freeWifi}</p>
                    <p><strong>Has Cinnamon Rolls:</strong> {place.hasCinnamonRolls}</p>
                    <Separator />
                    <p><strong>Description:</strong> {place.description?.trim() || "A third place in the Charlotte, North Carolina area."}</p>
                    <p><strong>Curator's Comments:</strong> {place.comments?.trim() || "None."}</p>
                    <Separator className="hidden sm:block" />
                    <p className="hidden sm:block"><strong>Metadata:</strong> Added: {place.createdDate} | Last Updated: {place.lastModifiedDate}.</p>
                </div>

                <div className="flex justify-center mt-4 space-x-4">
                    <Button className="!font-bold" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
