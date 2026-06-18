import { Place } from '@/lib/types';
import { getPlaceById, getPlaces } from '@/lib/data-services';
import { NextResponse } from 'next/server';

// Allow unknown IDs to be resolved at request time (not just build time).
export const dynamicParams = true;

// Pre-generate responses for all known places at build time.
export const dynamic = "force-static";

export async function generateStaticParams() {
    const places = await getPlaces();
    return places.map((place: Place) => ({
        id: place.recordId,
    }));
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const place = await getPlaceById(id);

        if (!place) {
            return NextResponse.json(
                { error: 'Place not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(place);
    } catch (error) {
        console.error(`Failed to fetch place ${id}:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch place' },
            { status: 500 }
        );
    }
}
