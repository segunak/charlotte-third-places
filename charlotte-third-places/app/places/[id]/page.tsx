import { Place } from "@/lib/types";
import { getPlaceById, getPlaces } from "@/lib/data-services";
import { PlacePageClient } from "@/components/PlacePageClient"; // Import the new client component

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

export default async function PlacePage({ params: { id } }: { params: { id: string } }) {
    // Fetch the specific place by ID
    const place = await getPlaceById(id);

    // If no place is found with the given `id`, return a "Place not found" message.
    // Consider using Next.js notFound() for better handling
    if (!place) {
        // import { notFound } from 'next/navigation';
        // notFound();
        return <div>Place not found</div>;
    }

    // Pass the fetched place data to the client component
    return <PlacePageClient place={place} />;
}