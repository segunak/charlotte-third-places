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
import { useModalContext } from "@/contexts/ModalContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent
} from "@/components/ui/tabs";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";

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

    const website = place.website?.trim();
    const appleMapsProfileURL = place.appleMapsProfileURL?.trim();
    const googleMapsProfileURL = place.googleMapsProfileURL?.trim();
    const hasPhotos = place.photos && place.photos.length > 0;
    const hasComments = place.comments?.trim();

    const instagram = undefined; // place.instagram?.trim();
    const tiktok = undefined; // place.tiktok?.trim();
    const twitter = undefined; // place.twitter?.trim();
    const youtube = undefined; // place.youtube?.trim();

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
                <div className="flex justify-center space-x-4 mb-4 relative z-10">
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

                    {hasPhotos && (
                        <Button
                            variant="outline"
                            onClick={() => showPlacePhotos(place, 'modal')}
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
                <div className="h-64 overflow-y-auto relative z-0">
                    <Tabs defaultValue="overview" className="w-full">
                        <div className="sticky top-0 bg-card z-10 pb-2">
                            <TabsList className="grid grid-cols-3 w-full">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Overview Tab - Essential Information */}
                        <TabsContent
                            value="overview"
                            className="space-y-4 px-1 py-2"
                        >
                            {/* Social Media Icons - Horizontal row with no labels - Only shown when profiles exist */}
                            {(instagram || tiktok || twitter || youtube) && (
                                <>
                                    <div className="flex justify-center space-x-3 mb-2">
                                        {instagram && (
                                            <ResponsiveLink href={instagram} aria-label="Visit Instagram">
                                                <div className="h-9 w-9 flex items-center justify-center rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 hover:scale-110 transition-transform">
                                                    <Icons.instagram className="h-5 w-5 text-white" />
                                                </div>
                                            </ResponsiveLink>
                                        )}

                                        {tiktok && (
                                            <ResponsiveLink href={tiktok} aria-label="Visit TikTok">
                                                <div className="h-9 w-9 flex items-center justify-center rounded-full bg-black hover:scale-110 transition-transform">
                                                    <Icons.tiktok className="h-5 w-5 text-white" />
                                                </div>
                                            </ResponsiveLink>
                                        )}

                                        {twitter && (
                                            <ResponsiveLink href={twitter} aria-label="Visit Twitter">
                                                <div className="h-9 w-9 flex items-center justify-center rounded-full bg-black hover:scale-110 transition-transform">
                                                    <Icons.twitter className="h-5 w-5 text-white" />
                                                </div>
                                            </ResponsiveLink>
                                        )}

                                        {youtube && (
                                            <ResponsiveLink href={youtube} aria-label="Visit YouTube">
                                                <div className="h-9 w-9 flex items-center justify-center rounded-full bg-red-600 hover:scale-110 transition-transform">
                                                    <Icons.youtube className="h-5 w-5 text-white" />
                                                </div>
                                            </ResponsiveLink>
                                        )}
                                    </div>

                                    <Separator className="mb-2" />
                                </>
                            )}

                            <div>
                                <p className="font-medium">Address</p>
                                <p className="text-sm text-muted-foreground">{place.address}</p>
                            </div>

                            <div>
                                <p className="font-medium">Neighborhood</p>
                                <p className="text-sm text-muted-foreground">{place.neighborhood}</p>
                            </div>

                            <div>
                                <p className="font-medium">Size</p>
                                <p className="text-sm text-muted-foreground">{place.size}</p>
                            </div>
                        </TabsContent>

                        {/* Details Tab - Description and Comments */}
                        <TabsContent
                            value="details"
                            className="space-y-3 px-1 py-2"
                        >
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="description">
                                    <AccordionTrigger className="font-medium">Description</AccordionTrigger>
                                    <AccordionContent>
                                        {place.description?.trim() || "A third place in the Charlotte, North Carolina area."}
                                    </AccordionContent>
                                </AccordionItem>
                                {hasComments && (
                                    <AccordionItem value="comments">
                                        <AccordionTrigger className="font-medium">Curator's Comments</AccordionTrigger>
                                        <AccordionContent>
                                            {place.comments}
                                        </AccordionContent>
                                    </AccordionItem>
                                )}
                                <AccordionItem value="metadata">
                                    <AccordionTrigger className="font-medium">Metadata</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-sm">
                                            <span className="font-medium">Added:</span> {new Date(place.createdDate).toLocaleDateString("en-US")}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">Last Updated:</span> {new Date(place.lastModifiedDate).toLocaleDateString("en-US")}
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </TabsContent>

                        {/* Amenities Tab - Features and Facilities */}
                        <TabsContent
                            value="amenities"
                            className="space-y-3 px-1 py-2"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <div>
                                        <p className="font-medium">Purchase Required</p>
                                        <p className="text-sm text-muted-foreground">{place.purchaseRequired}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium">Free Wi-Fi</p>
                                        <p className="text-sm text-muted-foreground">{place.freeWiFi}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div>
                                        <p className="font-medium">Parking</p>
                                        <p className="text-sm text-muted-foreground">{place.parking.join(", ")}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium">Has Cinnamon Rolls</p>
                                        <p className="text-sm text-muted-foreground">{place.hasCinnamonRolls}</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
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
