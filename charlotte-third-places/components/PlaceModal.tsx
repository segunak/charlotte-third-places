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

                    {/* SOCIAL MEDIA PILL */}
                    {(instagram || tiktok || twitter || youtube || facebook) && (
                        <>
                            <Separator />
                            <div className="flex justify-center">
                                <div className="inline-flex items-center gap-4 px-4 py-2 bg-muted/50 rounded-full border border-border/40 hover:bg-muted/70 transition-colors">
                                    {tiktok && (
                                        <ResponsiveLink href={tiktok} aria-label="Visit TikTok">
                                            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-black hover:scale-110 transition-transform">
                                                <Icons.tiktok className="h-5 w-5 text-white" />
                                            </div>
                                        </ResponsiveLink>
                                    )}
                                    {instagram && (
                                        <ResponsiveLink href={instagram} aria-label="Visit Instagram">
                                            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 hover:scale-110 transition-transform">
                                                <Icons.instagram className="h-5 w-5 text-white" />
                                            </div>
                                        </ResponsiveLink>
                                    )}
                                    {youtube && (
                                        <ResponsiveLink href={youtube} aria-label="Visit YouTube">
                                            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-red-600 hover:scale-110 transition-transform">
                                                <Icons.youtube className="h-5 w-5 text-white" />
                                            </div>
                                        </ResponsiveLink>
                                    )}
                                    {facebook && (
                                        <ResponsiveLink href={facebook} aria-label="Visit Facebook">
                                            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-[#1877F2] hover:scale-110 transition-transform">
                                                <Icons.facebook className="h-5 w-5 text-white" />
                                            </div>
                                        </ResponsiveLink>
                                    )}
                                    {twitter && (
                                        <ResponsiveLink href={twitter} aria-label="Visit Twitter">
                                            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-black hover:scale-110 transition-transform">
                                                <Icons.twitter className="h-5 w-5 text-white" />
                                            </div>
                                        </ResponsiveLink>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                    <Separator />
                    <div className="space-y-2">
                        <p>
                            <span className="font-semibold">Address:</span> {place.address}
                        </p>
                        <p>
                            <span className="font-semibold">Neighborhood:</span> {place.neighborhood}
                        </p>
                        <p>
                            <span className="font-semibold">Size:</span> {place.size}
                        </p>
                        <p>
                            <span className="font-semibold">Purchase Required:</span> {place.purchaseRequired}
                        </p>
                        <p>
                            <span className="font-semibold">Parking:</span> {place.parking.join(", ")}
                        </p>
                        <p>
                            <span className="font-semibold">Free Wi-Fi:</span> {place.freeWiFi}
                        </p>
                        <p>
                            <span className="font-semibold">Has Cinnamon Rolls:</span> {place.hasCinnamonRolls}
                        </p>
                    </div>

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
