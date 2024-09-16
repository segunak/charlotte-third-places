"use client"


import { useState } from 'react';
import { Place } from '@/lib/types';
import { Icons } from "@/components/Icons";
import { AdvancedMarker, APIProvider, Map, Pin } from '@vis.gl/react-google-maps';
import { PlaceModal } from '@/components/PlaceModal'; // Import your existing PlaceModal component

interface PlaceMapProps {
    places: Array<Place>;
}

export function PlaceMap({ places }: PlaceMapProps) {
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const charlotteCityCenter = { lat: 35.23075539296459, lng: -80.83165532446358 }; // Middle of Uptown Charlotte 

    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}>
            <div className="mb-20 sm:mb-0 w-full h-[80vh] sm:h-[80vh] md:aspect-square mx-auto border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                <Map
                    defaultCenter={charlotteCityCenter}
                    defaultZoom={10}
                    mapId='7b49fa8eab9db6c7'
                    gestureHandling='greedy'>
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
                            >
                                <div className="relative flex items-center justify-center w-8 h-8">
                                    <Icons.pin className="w-8 h-8 text-primary" />
                                    <div className="top-1 absolute flex items-center justify-center w-4 h-4 text-white">
                                        <Icons.queen className="w-full h-full text-white" />
                                    </div>
                                </div>
                            </AdvancedMarker>
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
