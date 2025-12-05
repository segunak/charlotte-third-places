"use client";

import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShareButton } from "@/components/ShareButton";
import { QuickFacts } from "@/components/QuickFacts";
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { RichTextSection } from "@/components/RichTextSection";
import { useModalContext } from "@/contexts/ModalContext";
import { FC, useMemo } from "react";

interface PlaceContentProps {
    place: Place;
    /** The layout context - affects spacing and sizing */
    layout?: "modal" | "page";
    showPhotosButton?: boolean;
    /** Callback for Ask AI button - if provided, shows the button */
    onAskAI?: () => void;
}

export const PlaceContent: FC<PlaceContentProps> = ({
    place,
    layout = "modal",
    showPhotosButton = true,
    onAskAI
}) => {
    const { showPlacePhotos } = useModalContext();

    const shareUrl = useMemo(() => {
        // SSR safety: if `window` is undefined, fallback
        if (typeof window === "undefined") {
            return `https://www.charlottethirdplaces.com/places/${place.recordId}`;
        }
        return `${window.location.origin}/places/${place.recordId}`;
    }, [place.recordId]);

    const hasComments = place.comments?.trim();
    const hasPhotos = place.photos && place.photos.length > 0;
    const shouldShowPhotosButton = hasPhotos && showPhotosButton;
    const appleMapsProfileURL = place.appleMapsProfileURL?.trim();
    const googleMapsProfileURL = place.googleMapsProfileURL?.trim();
    const website = place.website?.trim();
    const instagram = place.instagram?.trim();
    const tiktok = place.tiktok?.trim();
    const twitter = place.twitter?.trim();
    const youtube = place.youtube?.trim();
    const facebook = place.facebook?.trim();
    const linkedIn = place.linkedIn?.trim();

    // Different icon sizes based on layout
    const iconSize = layout === "modal" ? "h-7 w-7" : "h-6 w-6"; return (
        <div className="space-y-4">
            {/* Primary Actions */}
            <div className="flex justify-center space-x-2 sm:space-x-4">
                {googleMapsProfileURL && (
                    <ResponsiveLink href={googleMapsProfileURL} aria-label="Visit Google Maps Page">
                        <Button variant="outline">
                            <Icons.google className={iconSize} />
                        </Button>
                    </ResponsiveLink>
                )}
                {appleMapsProfileURL && (
                    <ResponsiveLink href={appleMapsProfileURL} aria-label="Visit Apple Maps Page">
                        <Button variant="outline">
                            <Icons.apple className={iconSize} />
                        </Button>
                    </ResponsiveLink>
                )}
                {shouldShowPhotosButton && (
                    <Button
                        variant="outline"
                        onClick={() => showPlacePhotos(place, layout === "page" ? "card" : "modal")}
                        aria-label="View photos"
                    >
                        <Icons.photoGallery className={`${iconSize} text-primary`} />
                    </Button>
                )}
                {website && (
                    <ResponsiveLink href={website} aria-label="Visit Website">
                        <Button variant="outline">
                            <Icons.globe className={iconSize} />
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
                {/* Desktop: Inline Ask AI button */}
                {onAskAI && (
                    <Button
                        onClick={onAskAI}
                        className="hidden lg:inline-flex">
                        <Icons.chat className={`${iconSize} mr-2`} />
                        Ask AI
                    </Button>
                )}
            </div>

            {/* Mobile: Floating Ask AI button */}
            {onAskAI && (
                <Button
                    onClick={onAskAI}
                    size="icon"
                    className="fixed bottom-20 right-3 z-50 rounded-full shadow-lg lg:hidden"
                    aria-label="Ask AI about this place"
                >
                    <Icons.chat className="h-5 w-5" />
                </Button>
            )}

            <Separator />

            <QuickFacts
                address={place.address}
                neighborhood={place.neighborhood}
                size={place.size}
                purchaseRequired={place.purchaseRequired}
                parking={place.parking}
                freeWiFi={place.freeWiFi}
                hasCinnamonRolls={place.hasCinnamonRolls}
                tags={place.tags}
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
                </>
            )}

            {/* Metadata - conditional visibility based on layout */}
            <Separator className={layout === "modal" ? "hidden sm:block" : ""} />

            <p className={layout === "modal" ? "hidden sm:block" : ""}>
                <Icons.folder className="h-4 w-4 text-yellow-400 inline mr-2" />
                <span className="font-semibold">Metadata:</span> Added: {new Date(place.createdDate).toLocaleDateString("en-US")} | Last Updated:{" "}
                {new Date(place.lastModifiedDate).toLocaleDateString("en-US")}.
            </p>
        </div>
    );
};
