"use client";

import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShareButton } from "@/components/ShareButton";
import { QuickFacts } from "@/components/QuickFacts";
import {
    FC,
    useRef,
    useEffect,
    useMemo
} from "react";
import React from "react";
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { RichTextSection } from "@/components/RichTextSection";
import { useModalContext } from "@/contexts/ModalContext";
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
    const { showPlacePhotos } = useModalContext();

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

    const hasComments = place.comments?.trim();
    const hasPhotos = place.photos && place.photos.length > 0;
    const appleMapsProfileURL = place.appleMapsProfileURL?.trim();
    const googleMapsProfileURL = place.googleMapsProfileURL?.trim();
    const website = place.website?.trim();
    const instagram = place.instagram?.trim();
    const tiktok = place.tiktok?.trim();
    const twitter = place.twitter?.trim();
    const youtube = place.youtube?.trim();
    const facebook = place.facebook?.trim();
    const linkedIn = place.linkedIn?.trim();

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                ref={contentRef}
                crossCloseIconSize="h-7 w-7"
                className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full sm:w-auto bg-card sm:max-w-2xl sm:mx-auto rounded-lg sm:rounded-xl max-h-[80vh] sm:max-h-[95vh] overflow-y-auto"
                onOpenAutoFocus={(e) => {
                    // Ensure the modal content starts at the top
                    if (contentRef.current) {
                        contentRef.current.scrollTop = 0;
                    }
                    e.preventDefault();
                }}
            >

                {/* Featured ribbon, corner banner */}
                {place.featured && (
                    <div className="absolute top-0 left-0 z-10 overflow-hidden w-44 h-44 pointer-events-none">
                        <div className="absolute top-4 -left-16 w-[200px] flex justify-center items-center bg-amber-500 text-white text-sm font-semibold py-2.5 transform rotate-[-45deg] shadow-lg">
                            <Icons.star className="h-4 w-4 mr-1" />
                            <span>Featured</span>
                        </div>
                    </div>
                )}

                <DialogHeader className="mt-7 sm:mt-0">
                    <DialogTitle className="text-center">
                        {place.name}
                    </DialogTitle>
                    <DialogDescription className="text-center">{place.type.join(", ")}</DialogDescription>
                </DialogHeader>
                <Separator />
                {/* Primary Actions */}
                <div className="space-y-4">
                    <div className="flex justify-center space-x-2 sm:space-x-4">
                        {googleMapsProfileURL && (
                            <ResponsiveLink href={googleMapsProfileURL} aria-label="Visit Google Maps Page">
                                <Button variant="outline">
                                    <Icons.google className="h-7 w-7" />
                                </Button>
                            </ResponsiveLink>
                        )}
                        {appleMapsProfileURL && (
                            <ResponsiveLink href={appleMapsProfileURL} aria-label="Visit Apple Maps Page">
                                <Button variant="outline">
                                    <Icons.apple className="h-7 w-7" />
                                </Button>
                            </ResponsiveLink>
                        )}
                        {hasPhotos && (
                            <Button
                                variant="outline"
                                onClick={() => showPlacePhotos(place, 'modal')}
                                aria-label="View photos"
                            >
                                <Icons.camera className="h-7 w-7 text-primary" />
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

                    {/* COMMENTS - Smart truncation for long content */}
                    {hasComments && (
                        <>
                            <Separator />
                            <RichTextSection
                                heading="Comments"
                                priority="medium"
                            >
                                {place.comments!}
                            </RichTextSection>
                        </>)
                    }
                    <Separator className="hidden sm:block" />
                    <p className="hidden sm:block">
                        <Icons.folder className="h-4 w-4 text-yellow-400 inline mr-2" />
                        <span className="font-semibold">Metadata:</span> Added: {new Date(place.createdDate).toLocaleDateString("en-US")} | Last Updated:{" "}
                        {new Date(place.lastModifiedDate).toLocaleDateString("en-US")}.
                    </p>
                </div>

                {/* CLOSE BUTTON */}
                <div className="flex justify-center py-4 px-4 mt-auto">
                    <Button className="font-bold w-full max-w-xs" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
