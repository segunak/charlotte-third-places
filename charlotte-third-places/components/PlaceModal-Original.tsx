"use client";

import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShareButton } from "@/components/ShareButton";
import {
    FC,
    useRef,
    useEffect,
    useMemo
} from "react";
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { useModalContext } from "@/contexts/ModalContext"; // Correct import
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface PlaceModalProps {
    place: Place | null;
    open: boolean;
    onClose: () => void;
}

export const PlaceModal: FC<PlaceModalProps> = ({ place, open, onClose }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const { showPlacePhotos } = useModalContext(); // Use the correct hook and destructure showPlacePhotos

    useEffect(() => {
        // Scroll to the top when the modal opens
        if (contentRef.current && open && place) {
            contentRef.current.scrollTop = 0;
        }
    }, [open, place]);

    const shareUrl = useMemo(() => {
        // SSR safety: if `window` is undefined, fallback
        if (typeof window === "undefined" || !place) {
            return "";
        }
        return `${window.location.origin}/places/${place.recordId}`;
    }, [place]);

    if (!open || !place) {
        return null;
    }

    const website = place.website?.trim();
    const appleMapsProfileURL = place.appleMapsProfileURL?.trim();
    const googleMapsProfileURL = place.googleMapsProfileURL?.trim();
    const hasPhotos = place.photos && place.photos.length > 0;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                ref={contentRef}
                className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full sm:w-auto bg-card sm:max-w-2xl sm:mx-auto rounded-lg sm:rounded-xl max-h-[80vh] sm:max-h-[95vh] overflow-y-auto"
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

                        {/* Add Camera Button if photos exist */} 
                        {hasPhotos && (
                            <Button 
                                variant="outline"
                                onClick={() => showPlacePhotos(place, 'modal')} // Specify origin as 'modal'
                                aria-label="View photos"
                            >
                                <Icons.camera className="h-6 w-6 text-primary" />
                            </Button>
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
                    <p>
                        <strong>Address:</strong> {place.address}
                    </p>
                    <p>
                        <strong>Neighborhood:</strong> {place.neighborhood}
                    </p>
                    <p>
                        <strong>Size:</strong> {place.size}
                    </p>
                    <p>
                        <strong>Purchase Required:</strong> {place.purchaseRequired}
                    </p>
                    <p>
                        <strong>Parking:</strong> {place.parking.join(", ")}
                    </p>
                    <p>
                        <strong>Free Wi-Fi:</strong> {place.freeWiFi}
                    </p>
                    <p>
                        <strong>Has Cinnamon Rolls:</strong> {place.hasCinnamonRolls}
                    </p>
                    <Separator />
                    <p>
                        <strong>Description:</strong>{" "}
                        {place.description?.trim() ||
                            "A third place in the Charlotte, North Carolina area."}
                    </p>
                    <p>
                        <strong>Curator's Comments:</strong>{" "}
                        {place.comments?.trim() || "None."}
                    </p>
                    <Separator className="hidden sm:block" />
                    <p className="hidden sm:block">
                        <strong>Metadata:</strong> Added: {new Date(place.createdDate).toLocaleDateString("en-US")} | Last Updated:{" "}
                        {new Date(place.lastModifiedDate).toLocaleDateString("en-US")}.
                    </p>
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