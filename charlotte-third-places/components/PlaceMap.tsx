"use client"

import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps';

const position = { lat: 53.54992, lng: 10.00678 };

export function PlaceMap() {
    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? 'I done goofed'}>
            <Map defaultCenter={position} defaultZoom={10} mapId='DEMO_MAP_ID'>
                <AdvancedMarker position={position} />
            </Map>
        </APIProvider>
    );
}