"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Icons } from "./Icons";

interface MobileFindMeButtonProps {
    className?: string;
    style?: React.CSSProperties;
}

export function MobileFindMeButton({ className = "", style }: MobileFindMeButtonProps) {
    const [isLocating, setIsLocating] = useState(false);

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

                // Dispatch a custom event for the map to listen to
                const locationEvent = new CustomEvent('userLocationFound', {
                    detail: { location: newLocation }
                });
                window.dispatchEvent(locationEvent);

                setIsLocating(false);
            },
            (error) => {
                console.error("Error getting location:", error);
                alert("Please allow location access to use this feature.");
                setIsLocating(false);
            },
            {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 300000
            }
        );
    };

    return (
        <Button
            onClick={handleLocationClick}
            className={`bg-primary hover:bg-primary/90 text-white font-extrabold sm:bg-[var(--button-white)] sm:hover:bg-gray-100 sm:text-black sm:font-bold flex items-center gap-2 shadow-lg rounded-sm ${className}`}
            size="sm"
            disabled={isLocating}
            style={style}
        >
            {isLocating ? (
                <>
                    <Icons.loader className="w-5 h-5 animate-spin" />
                    <span>Locating...</span>
                </>
            ) : (
                <>
                    <Icons.locate className="w-5 h-5" style={{ strokeWidth: 3 }} />
                    <span>Find Me</span>
                </>
            )}
        </Button>
    );
}
