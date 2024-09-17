"use client";

import { Place } from '@/lib/types';
import { Icons } from "@/components/Icons";
import { PlaceModal } from '@/components/PlaceModal';
import { normalizeTextForSearch } from '@/lib/utils';
import { FilterContext } from '@/contexts/FilterContext';
import { useState, useEffect, useContext, useMemo } from 'react';
import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps';

interface PlaceMapProps {
    places: Array<Place>;
}

export function PlaceMap({ places }: PlaceMapProps) {
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const { filters, quickFilterText } = useContext(FilterContext); // Access filters and quickFilterText from context
    const charlotteCityCenter = { lat: 35.23075539296459, lng: -80.83165532446358 };

    // State to track whether it's a mobile view
    const [isMobileView, setIsMobileView] = useState(false);

    // Effect to manage isMobileView based on screen size
    useEffect(() => {
        const updateViewSettings = () => {
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            setIsMobileView(isMobile);
        };

        // Initial check
        updateViewSettings();

        // Listen for screen resize
        window.addEventListener('resize', updateViewSettings);

        // Cleanup event listener on component unmount
        return () => window.removeEventListener('resize', updateViewSettings);
    }, []);

    // Apply filtering to places before rendering markers
    const filteredPlaces = useMemo(() => {
        return places.filter((place) => {
            const {
                name,
                type,
                size,
                neighborhood,
                purchaseRequired,
                parkingSituation,
                freeWifi,
                hasCinnamonRolls,
            } = filters;

            // Filter by the quick search input
            const matchesQuickSearch = normalizeTextForSearch(JSON.stringify(place))
                .includes(normalizeTextForSearch(quickFilterText));

            const isTypeMatch =
                type.value === "all" || (place.type && place.type.includes(type.value));

            return (
                matchesQuickSearch &&
                isTypeMatch &&
                (name.value === "all" || place.name === name.value) &&
                (size.value === "all" || place.size === size.value) &&
                (neighborhood.value === "all" || place.neighborhood === neighborhood.value) &&
                (purchaseRequired.value === "all" || place.purchaseRequired === purchaseRequired.value) &&
                (parkingSituation.value === "all" || place.parkingSituation === parkingSituation.value) &&
                (freeWifi.value === "all" || place.freeWifi === freeWifi.value) &&
                (hasCinnamonRolls.value === "all" || place.hasCinnamonRolls === hasCinnamonRolls.value)
            );
        });
    }, [places, filters, quickFilterText]); // Include quickFilterText in dependencies

    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}>
            <div className="w-full h-full border border-gray-200 rounded-xl shadow-xl">
                <Map
                    defaultCenter={charlotteCityCenter}
                    defaultZoom={11}
                    mapId='7b49fa8eab9db6c7'
                    zoomControl={!isMobileView}
                    streetViewControl={!isMobileView}
                    fullscreenControl={false}
                    gestureHandling='greedy'>
                    {filteredPlaces.map((place, index) => {
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
                                    <Icons.pin className="w-8 h-8 text-charlottePurple stroke-black stroke-2" />
                                    <div className="top-1 absolute flex items-center justify-center w-4 h-4 text-white">
                                        <Icons.queen className="w-full h-full text-amberGold" />
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
