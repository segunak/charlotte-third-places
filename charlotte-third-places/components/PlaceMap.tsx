"use client"

import { Place } from '@/lib/types';
import { AdvancedMarker, APIProvider, Map, useMapsLibrary } from '@vis.gl/react-google-maps';

interface PlaceMapProps {
    places: Array<Place>;
}

export function PlaceMap({ places }: PlaceMapProps) {
    const charlotteCityCenter = { lat: 35.23075539296459, lng: -80.83165532446358 } // Middle of Uptown Charlotte 

    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}>
            <div className="w-full max-w-4xl h-[80vh] sm:h-[80vh] md:aspect-square mx-auto border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                <Map defaultCenter={charlotteCityCenter} defaultZoom={10} mapId='7b49fa8eab9db6c7'>
                    {places.map((place, index) => (
                        
                        <AdvancedMarker
                            key={index}
                            position={{ lat: place.latitude, lng: place.longitude }}
                            title={place.name}
                        />
                    ))}
                </Map>
            </div>
        </APIProvider>
    );
}