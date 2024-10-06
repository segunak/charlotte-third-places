"use client"

import Link from "next/link";
import { Place } from "@/lib/types";
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

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent
                className="w-full sm:w-auto sm:max-w-7xl sm:mx-auto rounded-lg sm:rounded-xl max-h-[82vh] sm:max-h-[95vh] overflow-y-auto"
                onOpenAutoFocus={(e) => {
                    // Ensure the modal content starts at the top
                    if (contentRef.current) {
                        contentRef.current.scrollTop = 0;
                    }
                    e.preventDefault();
                }}
            >
                <DialogHeader className="mt-5">
                    <DialogTitle>{place.name}</DialogTitle>
                    <DialogDescription>{place.type.join(", ")}</DialogDescription>
                </DialogHeader>
                <Separator />
                <div className="space-y-3">
                    <p>
                        <strong>Website:</strong>{" "}
                        {place.website?.trim() ? (
                            <ResponsiveLink href={place.website}>Visit Website</ResponsiveLink>
                        ) : (
                            "No website available."
                        )}
                    </p>
                    <p>
                        <strong>Site Profile:</strong>{" "}
                        <ResponsiveLink href={`/places/${place.airtableRecordId}`}>
                            Visit Profile
                        </ResponsiveLink>
                    </p>
                    <p>
                        <strong>Google Maps Profile:</strong>{" "}
                        {place.googleMapsProfileURL?.trim() ? (
                            <ResponsiveLink href={place.googleMapsProfileURL}>Visit Profile</ResponsiveLink>
                        ) : (
                            "No profile available."
                        )}
                    </p>
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
                    <Separator />
                    <p><strong>Metadata:</strong> Added: {place.createdDate} | Last Modified: {place.lastModifiedDate}.</p>
                </div>

                <div className="flex justify-center mt-6 space-x-4">
                    <ShareButton
                        placeName={place.name}
                        className="!font-bold"
                        url={shareUrl}
                    />
                    <Button className="!font-bold" onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
