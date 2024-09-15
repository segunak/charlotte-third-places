import * as React from "react";
import { PlaceMap } from "@/components/PlaceMap";

export default function MapPage() {
    return (
        <div className="flex flex-col h-full">
            <header className="container py-8 bg-white text-gray-800 shadow"> {/* Container to align with other pages */}
                <h1 className="text-lg font-semibold">Explore Locations</h1>
                <p>Use the map below to explore where places are located.</p>
            </header>
            <div className="flex-1 container"> {/* The map container takes up the remaining space */}
                <PlaceMap />
            </div>
        </div>
    );
}
