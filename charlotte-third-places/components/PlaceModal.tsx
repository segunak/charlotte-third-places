"use client";

import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    FC,
    useRef,
    useEffect,
    useMemo
} from "react";
import { ResponsiveLink } from "@/components/ResponsiveLink";
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

    // If place is null, we can skip rendering or show fallback
    if (!place) {
        return null; // Or return an empty Dialog if you prefer
    }

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
            // Fallback to copying the link to the clipboard
            try {
                await navigator.clipboard.writeText(shareData.url);
                alert("Link copied to clipboard!");
            } catch (error) {
                console.error("Failed to copy the link to clipboard", error);
            }
        }
    };

    const website = place.website?.trim();
    const googleMapsProfileURL = place.googleMapsProfileURL?.trim();

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                ref={contentRef}
                className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full sm:w-auto bg-card sm:max-w-7xl sm:mx-auto rounded-lg sm:rounded-xl max-h-[80vh] sm:max-h-[95vh] overflow-y-auto"
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
                        <ResponsiveLink href={googleMapsProfileURL}>
                            <Button variant="outline">
                                <Icons.google className="h-6 w-6" />
                            </Button>
                        </ResponsiveLink>
                        {website && (
                            <ResponsiveLink href={website}>
                                <Button variant="outline">
                                    <Icons.externalLink className="h-6 w-6" />
                                </Button>
                            </ResponsiveLink>
                        )}
                        <Button variant="outline" onClick={handleShare}>
                            <Icons.share className="h-6 w-6 text-primary" />
                        </Button>
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
                        <strong>Parking Situation:</strong> {place.parkingSituation}
                    </p>
                    <p>
                        <strong>Free Wifi:</strong> {place.freeWifi}
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
                        <strong>Metadata:</strong> Added: {place.createdDate} | Last Updated:{" "}
                        {place.lastModifiedDate}.
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
