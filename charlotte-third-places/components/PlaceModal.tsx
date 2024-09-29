"use client"

import { Place } from "@/lib/types";
import { FC, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator"
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Link from "next/link";

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
    }, []);

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent
                className="w-full sm:w-auto sm:max-w-7xl sm:mx-auto rounded-lg sm:rounded-xl max-h-[80vh] sm:max-h-[95vh] overflow-y-auto"
                onOpenAutoFocus={(e) => {
                    // Ensure the modal content starts at the top
                    if (contentRef.current) {
                        contentRef.current.scrollTop = 0;
                    }
                    e.preventDefault();
                }}
            >
                <DialogHeader className="mt-5">
                    <DialogTitle>{place?.name}</DialogTitle>
                    <DialogDescription>{place?.type?.join(", ")}</DialogDescription>
                </DialogHeader>
                <Separator />
                <div className="space-y-3">
                    <p>
                        <strong>Website:</strong>{" "}
                        {place?.website ? (
                            <ResponsiveLink href={place.website}>Visit Website</ResponsiveLink>
                        ) : (
                            "No website available."
                        )}
                    </p>
                    <p>
                        <strong>Site Profile:</strong>{" "}
                        <Link href={`/places/${place.airtableRecordId}`} className="custom-link" passHref>
                            Visit Profile
                        </Link>
                    </p>
                    <p>
                        <strong>Google Maps Profile:</strong>{" "}
                        {place?.googleMapsProfileURL ? (
                            <ResponsiveLink href={place.googleMapsProfileURL}>Visit Profile</ResponsiveLink>
                        ) : (
                            "No profile available."
                        )}
                    </p>
                    <Separator />
                    <p><strong>Address:</strong> {place?.address}</p>
                    <p><strong>Neighborhood:</strong> {place?.neighborhood}</p>
                    <p><strong>Size:</strong> {place?.size}</p>
                    <p><strong>Purchase Required:</strong> {place?.purchaseRequired}</p>
                    <p><strong>Parking Situation:</strong> {place?.parkingSituation}</p>
                    <p><strong>Free Wifi:</strong> {place?.freeWifi}</p>
                    <p><strong>Has Cinnamon Rolls:</strong> {place?.hasCinnamonRolls}</p>
                    <Separator />
                    <p><strong>Description:</strong> {place?.description || "A third place in the Charlotte, North Carolina area."}</p>
                    <p><strong>Curator's Comments:</strong> {place?.comments || "None."}</p>
                </div>

                <div className="flex justify-end mt-4">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
