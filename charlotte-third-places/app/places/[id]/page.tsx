import { Place } from "@/lib/types";
import { getPlaces } from "@/lib/data-services";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";

// `revalidate` defines the interval in seconds during which the cached data is considered valid.
// After this interval, Next.js will invalidate the cache and fetch fresh data.
// Here, we set it to 12 hours (43200 seconds).
export const revalidate = 43200;

// `dynamicParams` is a configuration for Next.js to handle paths that weren't pre-rendered at build time.
// If set to `true`, Next.js will generate pages on-demand for paths not generated during the build.
// If set to `false`, Next.js will return a 404 for any path not pre-rendered.
export const dynamicParams = true;

// `generateStaticParams` is a special function that Next.js runs at build time.
// Its purpose is to pre-generate static pages based on the data fetched here.
// In this case, it calls `getPlaces()` to fetch all places from Airtable.
export async function generateStaticParams() {
    // Fetch all places from Airtable.
    const places = await getPlaces();

    // Map over the fetched places and return an array of objects, 
    // each containing the `id` of a place. This `id` corresponds 
    // to the Airtable record ID and will be used to generate dynamic routes.
    return places.map((place: Place) => ({
        id: place.airtableRecordId,
    }));
}

// This is the page component for individual places. It is a dynamic route, 
// meaning it is rendered based on the `id` parameter provided in the URL.
export default async function PlacePage({ params: { id } }: { params: { id: string } }) {
    // Fetch all places again. This is necessary because Next.js does not automatically pass 
    // the data fetched in `generateStaticParams` to this component.
    const places = await getPlaces();

    // Find the specific place that matches the `id` from the URL.
    const place = places.find((place: Place) => place.airtableRecordId === id);

    // If no place is found with the given `id`, return a "Place not found" message.
    if (!place) return <div>Place not found</div>;

    return (
        <div className="px-4 sm:px-6 py-8 space-y-6 mx-auto max-w-full sm:max-w-4xl border border-gray-300 shadow-lg bg-background">
            <h1 className="text-2xl sm:text-3xl font-bold text-center leading-tight border-b pb-3">
                {place.name}
            </h1>
            <Card className="border border-gray-300 shadow-sm">
                <CardHeader></CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <p><strong>Type:</strong> {place?.type?.join(", ")}</p>
                        <p>
                            <strong>Website:</strong>{" "}
                            {place?.website ? (
                                <ResponsiveLink href={place.website}>Visit Website</ResponsiveLink>
                            ) : (
                                "No website available."
                            )}
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
                        <p><strong>Added to List On:</strong> {place?.createdDate}</p>
                        <p><strong>Last Modified On:</strong> {place?.lastModifiedDate}</p>
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
                </CardContent>
            </Card>

            <div className="flex justify-end mt-4">
                <Link href="/">
                    <Button >
                        Back to Places
                    </Button>
                </Link>
            </div>
        </div >
    );
}