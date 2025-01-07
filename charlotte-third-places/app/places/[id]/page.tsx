import React from 'react';
import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";
import { REVALIDATE_TIME } from '@/lib/config';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShareButton } from "@/components/ShareButton";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { getPlaceById, getPlaces } from "@/lib/data-services";

// See https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate
export const revalidate = REVALIDATE_TIME;

// See https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamicparams
export const dynamicParams = true;

// See https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
export const dynamic = "force-static"

// See https://nextjs.org/docs/app/api-reference/functions/generate-static-params
export async function generateStaticParams() {
    // Fetch all places from Airtable.
    const places = await getPlaces();

    // Map over the fetched places and return an array of objects, 
    // each containing the `id` of a place. This `id` corresponds 
    // to the Airtable record ID and will be used to generate dynamic routes.
    return places.map((place: Place) => ({
        id: place.recordId,
    }));
}

// This is the page component for individual places. It is a dynamic route, 
// meaning it is rendered based on the `id` parameter provided in the URL.
export default async function PlacePage({ params: { id } }: { params: { id: string } }) {
    // Fetch the specific place by ID
    const place = await getPlaceById(id);

    // If no place is found with the given `id`, return a "Place not found" message.
    if (!place) return <div>Place not found</div>;

    const website = place.website?.trim();
    const appleMapsProfileURL = place.appleMapsProfileURL?.trim();
    const googleMapsProfileURL = place.googleMapsProfileURL?.trim();
    const shareUrl = `https://www.charlottethirdplaces.com/places/${place.recordId}`;

    return (
        <div id={id} className="px-4 sm:px-6 py-8 space-y-6 mx-auto max-w-full sm:max-w-4xl border border-gray-300 shadow-lg bg-background">
            <h1 className="text-2xl sm:text-3xl font-bold text-center leading-tight border-b pb-3">
                {place.name}
            </h1>
            <Card className="border border-gray-300 shadow-sm">
                <CardContent className="mt-4">
                    <div className="space-y-3">
                        <div className="flex justify-center space-x-4">
                            {googleMapsProfileURL && (
                                <ResponsiveLink href={googleMapsProfileURL}>
                                    <Button variant="outline">
                                        <Icons.google className="h-6 w-6" />
                                    </Button>
                                </ResponsiveLink>
                            )}
                            {appleMapsProfileURL && (
                                <ResponsiveLink href={appleMapsProfileURL}>
                                    <Button variant="outline">
                                        <Icons.apple className="h-6 w-6" />
                                    </Button>
                                </ResponsiveLink>
                            )}
                            {website && (
                                <ResponsiveLink href={website}>
                                    <Button variant="outline">
                                        <Icons.externalLink className="h-6 w-6" />
                                    </Button>
                                </ResponsiveLink>
                            )}
                            <ShareButton
                                url={shareUrl}
                                variant="outline"
                                displayType="icon"
                            />
                        </div>
                        <Separator />
                        <p><strong>Type:</strong> {place.type.join(", ")}</p>
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
                        <p><strong>Metadata:</strong> Added: {place.createdDate} | Last Updated: {place.lastModifiedDate}.</p>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}