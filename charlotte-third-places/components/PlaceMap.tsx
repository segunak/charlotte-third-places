"use client";

import { Place } from '@/lib/types';
import { Button } from './ui/button';
import { Icons, getPlaceTypeIcon } from "@/components/Icons";
import { normalizeTextForSearch } from '@/lib/utils';
import { FilterContext } from '@/contexts/FilterContext';
import { useModalContext } from "@/contexts/ModalContext";
import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps';

// Cache for consistent color assignments (moved outside component)
const colorCache: { [key: string]: string } = {};

interface PlaceMapProps {
    places: Array<Place>;
    fullScreen?: boolean;
}

export function PlaceMap({ places, fullScreen = false }: PlaceMapProps) {
    const { showPlaceModal } = useModalContext();
    const [isMobileView, setIsMobileView] = useState(false);
    const { filters, quickFilterText } = useContext(FilterContext);
    const charlotteCityCenter = { lat: 35.23075539296459, lng: -80.83165532446358 };
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [currentZoom, setCurrentZoom] = useState(11);
    const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);

    // Google Maps zoom levels: 1 = world view, 20+ = building level
    // Higher numbers = more zoomed in, lower numbers = more zoomed out
    // Zoom 11 = city level, 13 = neighborhood, 15 = street level, 18 = building details
    const SHOW_LABELS_ZOOM = 14; // Only show place labels when zoomed to street level or closer
    const MAX_LABELS_SHOWN = 20; // Limit labels for performance (prevents too many DOM elements)

    const handleLocationClick = () => {
        if (!("geolocation" in navigator)) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setUserLocation(newLocation);

                if (mapInstance) {
                    // Use a fixed zoom level for consistency and speed
                    mapInstance.setZoom(14);
                    mapInstance.panTo(newLocation);
                }
                setIsLocating(false);
            },
            (error) => {
                console.error("Error getting location:", error);
                alert("Please allow location access to use this feature.");
                setIsLocating(false);
            },
            {
                enableHighAccuracy: false, // Faster response with lower accuracy
                timeout: 5000,
                maximumAge: 300000 // Cache positions up to 5 minutes old for better performance
            }
        );
    };

    useEffect(() => {
        const updateViewSettings = () => {
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            setIsMobileView(isMobile);
        };

        updateViewSettings();

        window.addEventListener('resize', updateViewSettings);

        return () => window.removeEventListener('resize', updateViewSettings);
    }, []);

    // Specific color assignments for certain place types.
    const specificTypeColors: { [key: string]: string } = {
        "Art Gallery": "#FF00DC",        // Vivid Magenta
        "Bakery": "#FFC649",             // Saffron Yellow
        "Bar": "#8B008B",                // Dark Magenta
        "Bookstore": "#144EE3",          // Laser Blue
        "Bottle Shop": "#800020",        // Burgundy Wine Red
        "Brewery": "#C21807",            // Chili Red
        "Bubble Tea Shop": "#FF00FF",    // Magenta
        "Café": "#FF1493",               // Deep Pink
        "Coffee Shop": "#00BFFF",        // Deep Sky Blue
        "Community Center": "#9400D3",   // Dark Violet
        "Coworking Space": "#00CED1",    // Dark Turquoise
        "Creamery": "#FF69B4",           // Hot Pink
        "Deli": "#00CED1",               // Dark Turquoise
        "Eatery": "#DA70D6",             // Orchid
        "Game Store": "#107C10",         // Microsoft Green
        "Garden": "#50C878",             // Emerald Green
        "Grocery Store": "#00A651",      // Publix Green
        "Ice Cream Shop": "#FF77FF",     // Light Fuchsia Pink
        "Library": "#BF00FF",            // Purple
        "Market": "#FF7F50",             // Coral
        "Museum": "#8A2BE2",             // Blue Violet
        "Other": "#6B7280",              // Gray
        "Restaurant": "#FF0033",         // Bright Red
        "Tea House": "#00FF00",          // Bright Green
    };

    // Comprehensive color palette for automatic type-based color assignment
    // Each place type gets a unique, consistent color through hash-based selection
    const typeColorPalette = [
        "#FB923C", // Orange
        "#14B8A6", // Teal
        "#6366F1", // Indigo
        "#EC4899", // Pink
        "#84CC16", // Lime
        "#F59E0B", // Amber
        "#D946EF", // Fuchsia
        "#F43F5E", // Rose
        "#06B6D4", // Cyan
        "#8B5CF6", // Violet
        "#10B981", // Emerald
        "#FBBF24", // Bright Yellow
        "#DC2626", // Red (minimal use)
        "#9333EA", // Purple
        "#22C55E", // Green
        "#3B82F6", // Bright Blue
        "#F472B6", // Bright Pink
        "#F59E0B", // Bright Amber
        "#A3E635", // Bright Lime
        "#2DD4BF", // Bright Teal        
        "#E879F9", // Bright Fuchsia
    ];

    const getPlaceTypeColor = (placeTypes: string | string[] | undefined): string => {
        if (!placeTypes) {
            return "#3B82F6"; // Default blue
        }

        // If it's an array, use the first type
        const typeToCheck = Array.isArray(placeTypes) ? placeTypes[0] : placeTypes;
        // Check cache first
        if (colorCache[typeToCheck]) {
            return colorCache[typeToCheck];
        } let result;

        // If empty or whitespace, use first color from palette
        if (!typeToCheck || typeToCheck.trim() === "") {
            result = typeColorPalette[0];
        }
        // Check if this type has a specific predefined color
        else if (specificTypeColors[typeToCheck]) {
            result = specificTypeColors[typeToCheck];
        }
        // Generate hash-based color for automatic consistent assignment
        else {
            let hash = 0;
            for (let i = 0; i < typeToCheck.length; i++) {
                hash = typeToCheck.charCodeAt(i) + ((hash << 5) - hash);
            }
            const colorIndex = Math.abs(hash) % typeColorPalette.length;
            result = typeColorPalette[colorIndex] || typeColorPalette[0];
        }// Cache the result
        colorCache[typeToCheck] = result;
        return result;
    };

    const filteredPlaces = useMemo(() => {
        return places.filter((place) => {
            const {
                name,
                type,
                size,
                neighborhood,
                purchaseRequired,
                parking,
                freeWiFi,
                hasCinnamonRolls,
            } = filters;

            const matchesQuickSearch = normalizeTextForSearch(place.name || '').includes(normalizeTextForSearch(quickFilterText));

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
                (freeWiFi.value === "all" || place.freeWiFi === freeWiFi.value) &&
                (hasCinnamonRolls.value === "all" || place.hasCinnamonRolls === hasCinnamonRolls.value)
            );
        });
    }, [places, filters, quickFilterText]);

    // Helper function to check if a place is within the current map bounds
    // Wrapped in useCallback to prevent unnecessary dependency changes in useMemo
    const isPlaceInBounds = useCallback((place: Place): boolean => {
        if (!mapBounds) return false;

        const lat = Number(place.latitude);
        const lng = Number(place.longitude);

        if (isNaN(lat) || isNaN(lng)) return false;

        return mapBounds.contains(new google.maps.LatLng(lat, lng));
    }, [mapBounds]);

    // Get places that should show labels (in bounds, limited quantity)
    const placesWithLabels = useMemo(() => {
        if (currentZoom < SHOW_LABELS_ZOOM || !mapBounds) {
            return [];
        }

        const placesInBounds = filteredPlaces.filter(isPlaceInBounds);

        // Limit the number of labels shown for performance
        return placesInBounds.slice(0, MAX_LABELS_SHOWN);
    }, [filteredPlaces, currentZoom, mapBounds, isPlaceInBounds, SHOW_LABELS_ZOOM, MAX_LABELS_SHOWN]);

    return (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}>
            <div className={`w-full h-full relative ${fullScreen ? '' : 'border border-gray-200 rounded-xl shadow-xl'}`}>
                <Map
                    defaultCenter={charlotteCityCenter}
                    defaultZoom={11}
                    mapId='7b49fa8eab9db6c7' // https://developers.google.com/maps/documentation/get-map-id
                    renderingType='VECTOR'
                    colorScheme='LIGHT'
                    reuseMaps={true} // To avoid re-rendering a map (and thus an API call) for every load.
                    zoomControl={!isMobileView} // The plus minus buttons in the lower right. On mobile, people just pinch to zoom, so they're not needed.
                    disableDefaultUI={true} // Disable all default UI elements. Enable only what you want to show.
                    gestureHandling='greedy'
                    onBoundsChanged={(e: { map: google.maps.Map }) => {
                        if (e.map) {
                            setMapInstance(e.map);
                            const bounds = e.map.getBounds();
                            if (bounds) {
                                setMapBounds(bounds);
                            }
                        }
                    }}
                    onZoomChanged={(e: { map: google.maps.Map }) => {
                        if (e.map) {
                            const zoom = e.map.getZoom();
                            if (zoom !== undefined) {
                                setCurrentZoom(zoom);
                            }
                        }
                    }}
                >
                    <div className="absolute top-4 right-4 z-10">
                        <Button
                            onClick={handleLocationClick}
                            className={`${isMobileView ? 'bg-primary hover:bg-primary/90 text-white font-extrabold' : 'bg-[var(--button-white)] hover:bg-gray-100 text-black font-bold'} flex items-center gap-2 shadow-lg rounded-sm`}
                            size="sm"
                            disabled={isLocating}
                        >
                            {isLocating ? (
                                <>
                                    <Icons.loader className="w-5 h-5 animate-spin" />
                                    <span>Locating...</span>
                                </>
                            ) : (
                                <>
                                    <Icons.locate className="w-5 h-5" style={{ strokeWidth: 3 }}/>
                                    <span>Find Me</span>
                                </>
                            )}
                        </Button>
                    </div>

                    {userLocation && (
                        <AdvancedMarker
                            position={userLocation}
                            title="Your Location"
                        >
                            <div className="w-6 h-6 rounded-full border-4 border-white shadow-lg" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
                        </AdvancedMarker>
                    )}

                    {filteredPlaces.map((place, index) => {
                        const position = {
                            lat: Number(place.latitude),
                            lng: Number(place.longitude)
                        };

                        // Get the appropriate icon and color for the place type
                        const PlaceIcon = getPlaceTypeIcon(place.type);
                        const pinColor = place.featured ? 'text-amber-500' : getPlaceTypeColor(place.type);

                        // Check if this place should show a label
                        const shouldShowLabel = placesWithLabels.some(labelPlace => labelPlace.name === place.name);

                        return (
                            <div key={index}>
                                <AdvancedMarker
                                    position={position}
                                    title={place.name}
                                    onClick={() => showPlaceModal(place)}
                                >
                                    <div className="relative flex flex-col items-center">
                                        <div className="relative flex items-center justify-center w-8 h-8">
                                            <Icons.pin
                                                className={`w-8 h-8 stroke-black stroke-2`}
                                                style={{ color: place.featured ? '#f59e0b' : pinColor }}
                                            />
                                            <div className="top-1 absolute flex items-center justify-center w-4 h-4 text-white">
                                                {place.featured ? (
                                                    <Icons.star className="w-full h-full text-white fill-white" />
                                                ) : (
                                                    <PlaceIcon className="w-full h-full text-charlottePaperWhite" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Custom label positioned above the marker */}
                                        {shouldShowLabel && (
                                            <div
                                                className="absolute -top-7 bg-black/80 text-white px-1.5 py-0.5 rounded text-xs font-normal whitespace-nowrap pointer-events-none cursor-pointer"
                                                title={place.name} // Full name on hover
                                            >
                                                {place.name.length > 20 ? `${place.name.substring(0, 20)}...` : place.name}
                                            </div>
                                        )}
                                    </div>
                                </AdvancedMarker>
                            </div>
                        );
                    })}
                </Map>
            </div>
        </APIProvider>
    );
}
