import { getPlaces } from '@/lib/data-services';
import { NextResponse } from 'next/server';

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
