"use client"

import { Place } from '@/lib/types';
import { useState } from 'react';
import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps';
import { PlaceModal } from '@/components/PlaceModal'; // Import your existing PlaceModal component

interface PlaceMapProps {
    places: Array<Place>;
}

export function PlaceMap({ places }: PlaceMapProps) {
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const charlotteCityCenter = { lat: 35.23075539296459, lng: -80.83165532446358 }; // Middle of Uptown Charlotte 

    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}>
            <div className="w-full h-[80vh] sm:h-[80vh] md:aspect-square mx-auto border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                <Map defaultCenter={charlotteCityCenter} defaultZoom={10} mapId='7b49fa8eab9db6c7'>
                    {places.map((place, index) => {
                        const position = {
                            lat: Number(place.latitude),
                            lng: Number(place.longitude)
                        };

                        return (
                            <AdvancedMarker
                                key={index}
                                position={position}
                                title={place.name}
                                onClick={() => setSelectedPlace(place)}
                            />
                        );
                    })}
                </Map>

                {selectedPlace && (
                    <PlaceModal
                        place={selectedPlace}
                        onClose={() => setSelectedPlace(null)}
                    />
                )}
            </div>
        </APIProvider>
    );
}
