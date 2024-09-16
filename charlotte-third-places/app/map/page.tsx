import * as React from "react";
import { PlaceMap } from "@/components/PlaceMap";

export default function MapPage() {
    return (
        <div className="flex flex-col px-4 sm:px-12 py-8 mx-auto h-screen">
            <header className="mb-4">
                <h1 className="text-2xl font-bold mb-2">Explore the Map</h1>
                <p>Use the map below to explore various places in the area. Click on a marker to learn more about a location.</p>
            </header>
            <div className="flex-1 flex">
                <PlaceMap />
            </div>
        </div >
    );
}
