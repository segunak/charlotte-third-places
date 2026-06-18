import { getPlaces } from '@/lib/data-services';
import { NextResponse } from 'next/server';

// Returns all places as a JSON array matching the Place type from lib/types.ts.
// URL: https://www.charlottethirdplaces.com/api/places
// Statically generated at build time; cache is invalidated via /api/revalidate.
export const dynamic = "force-static";

export async function GET() {
    try {
        const places = await getPlaces();
        return NextResponse.json(places);
    } catch (error) {
        console.error('Failed to fetch places:', error);
        return NextResponse.json(
            { error: 'Failed to fetch places' },
            { status: 500 }
        );
    }
}
