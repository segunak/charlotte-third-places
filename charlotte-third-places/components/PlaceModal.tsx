"use client";

import { Place } from "@/lib/types";
import { formatDate } from "@/lib/utils";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

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

    const website = place.website?.trim();
    const appleMapsProfileURL = place.appleMapsProfileURL?.trim();
    const googleMapsProfileURL = place.googleMapsProfileURL?.trim();

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
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <ResponsiveLink href={googleMapsProfileURL}>
                                            <Button variant="outline">
                                                <Icons.google className="h-6 w-6" />
                                            </Button>
                                        </ResponsiveLink>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Visit Google Maps Page</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {appleMapsProfileURL && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <ResponsiveLink href={appleMapsProfileURL}>
                                            <Button variant="outline">
                                                <Icons.apple className="h-6 w-6" />
                                            </Button>
                                        </ResponsiveLink>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Visit Apple Maps Page</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {website && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <ResponsiveLink href={website}>
                                            <Button variant="outline">
                                                <Icons.globe className="h-7 w-7" />
                                            </Button>
                                        </ResponsiveLink>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Visit Website</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <ShareButton
                                        placeName={place.name}
                                        url={shareUrl}
                                        variant="outline"
                                        displayType="icon"
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Share Place</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
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
                        <strong>Metadata:</strong> Added: {formatDate(place.createdDate)} | Last Updated:{" "}
                        {formatDate(place.lastModifiedDate)}.
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
