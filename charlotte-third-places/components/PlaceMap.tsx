"use client"

import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps';

const position = { lat: 53.54992, lng: 10.00678 };

export function PlaceMap() {
    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}>
            <div className="w-[80%] h-[80dvh] mx-auto aspect-square">
                <Map defaultCenter={position} defaultZoom={10} mapId='DEMO_MAP_ID'>
                    <AdvancedMarker position={position} />
                </Map>
            </div>
        </APIProvider>
    );
}