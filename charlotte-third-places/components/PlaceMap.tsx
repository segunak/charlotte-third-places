"use client";

import { Place } from '@/lib/types';
import { Icons } from "@/components/Icons";
import { normalizeTextForSearch } from '@/lib/utils';
import { FilterContext } from '@/contexts/FilterContext';
import { useModalContext } from "@/contexts/ModalContext";
import { useState, useEffect, useContext, useMemo } from 'react';
import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps';

interface PlaceMapProps {
    places: Array<Place>;
}

export function PlaceMap({ places }: PlaceMapProps) {
    const { showPlaceModal } = useModalContext();
    const [isMobileView, setIsMobileView] = useState(false);
    const { filters, quickFilterText } = useContext(FilterContext);
    const charlotteCityCenter = { lat: 35.23075539296459, lng: -80.83165532446358 };

    useEffect(() => {
        const updateViewSettings = () => {
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            setIsMobileView(isMobile);
        };

        updateViewSettings();

        window.addEventListener('resize', updateViewSettings);

        return () => window.removeEventListener('resize', updateViewSettings);
    }, []);

    const filteredPlaces = useMemo(() => {
        return places.filter((place) => {
            const {
                name,
                type,
                size,
                neighborhood,
                purchaseRequired,
                parking,
                freeWifi,
                hasCinnamonRolls,
            } = filters;

            const matchesQuickSearch = normalizeTextForSearch(JSON.stringify(place))
                .includes(normalizeTextForSearch(quickFilterText));

            const isTypeMatch =
                type.value === "all" || (place.type && place.type.includes(type.value));

            const isParkingMatch =
                parking.value === "all" || (place.parking && place.parking.includes(parking.value));

            return (
                matchesQuickSearch &&
                isTypeMatch &&
                isParkingMatch &&
                (name.value === "all" || place.name === name.value) &&
                (size.value === "all" || place.size === size.value) &&
                (neighborhood.value === "all" || place.neighborhood === neighborhood.value) &&
                (purchaseRequired.value === "all" || place.purchaseRequired === purchaseRequired.value) &&
                (freeWifi.value === "all" || place.freeWifi === freeWifi.value) &&
                (hasCinnamonRolls.value === "all" || place.hasCinnamonRolls === hasCinnamonRolls.value)
            );
        });
    }, [places, filters, quickFilterText]);

    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}>
            <div className="w-full h-full border border-gray-200 rounded-xl shadow-xl">
                <Map
                    defaultCenter={charlotteCityCenter}
                    defaultZoom={11}
                    mapId='7b49fa8eab9db6c7' // https://developers.google.com/maps/documentation/get-map-id
                    renderingType='VECTOR'
                    colorScheme='LIGHT'
                    reuseMaps={true} // To avoid re-rendering a map (and thus an API call) for every load.
                    zoomControl={!isMobileView} // The plus minus buttons in the lower right. On mobile, people just pinch to zoom, so they're not needed.
                    streetViewControl={false}
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
                                onClick={() => showPlaceModal(place)}
                            >
                                <div className="relative flex items-center justify-center w-8 h-8">
                                    <Icons.pin className="w-8 h-8 text-primary stroke-black stroke-2" />
                                    <div className="top-1 absolute flex items-center justify-center w-4 h-4 text-white">
                                        <Icons.queen className="w-full h-full text-charlottePaperWhite" />
                                    </div>
                                </div>
                            </AdvancedMarker>
                        );
                    })}
                </Map>
            </div>
        </APIProvider>
    );
}
