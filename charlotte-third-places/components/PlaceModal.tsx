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
    useMemo,
    useState
} from "react";
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { SmartTextSection } from "@/components/SmartTextSection";
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

    // Socials row for QuickFacts
    const socials = [
        { url: instagram, icon: <Icons.instagram className="h-6 w-6 text-pink-500" />, label: "Instagram" },
        { url: tiktok, icon: <Icons.tiktok className="h-6 w-6 text-black" />, label: "TikTok" },
        { url: twitter, icon: <Icons.twitter className="h-6 w-6 text-sky-500" />, label: "Twitter" },
        { url: youtube, icon: <Icons.youtube className="h-6 w-6 text-red-600" />, label: "YouTube" },
        { url: facebook, icon: <Icons.facebook className="h-6 w-6 text-blue-700" />, label: "Facebook" },
        { url: linkedIn, icon: <Icons.linkedIn className="h-6 w-6 text-blue-800" />, label: "LinkedIn" },
    ].filter(s => s.url);
    const socialsRow = socials.length > 0 ? (
        <div className="flex flex-row flex-wrap gap-3 items-center">
            {socials.map(({ url, icon, label }) => (
                <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
                >
                    {icon}
                </a>
            ))}
        </div>
    ) : undefined;

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
                    {/* Quick facts - new compact grid */}
                    <QuickFacts
                        address={place.address}
                        neighborhood={place.neighborhood}
                        size={place.size}
                        purchaseRequired={place.purchaseRequired}
                        parking={place.parking}
                        freeWiFi={place.freeWiFi}
                        hasCinnamonRolls={place.hasCinnamonRolls}
                        socials={socialsRow}
                    />
                    <Separator />
                    {/* DESCRIPTION - Always visible, high priority */}
                    <SmartTextSection
                        heading="Description"
                        priority="high"
                        inline={true}
                    >
                        {place.description?.trim() || "A third place in the Charlotte, North Carolina area."}
                    </SmartTextSection>

                    {/* CURATOR'S COMMENTS - Smart truncation for long content */}
                    {hasComments && (
                        <>
                            <Separator />
                            <SmartTextSection
                                heading="Curator's Comments"
                                priority="medium"
                                inline={true}
                            >
                                {place.comments!}
                            </SmartTextSection>
                        </>
                    )}
                    <Separator className="hidden sm:block" />
                    <p className="hidden sm:block">
                        <strong>Metadata:</strong> Added: {new Date(place.createdDate).toLocaleDateString("en-US")} | Last Updated:{" "}
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
