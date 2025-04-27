"use client";

import { Place } from "@/lib/types";
import { PlaceModal } from "@/components/PlaceModal";
import React, { createContext, useCallback, useContext, useState } from "react";

interface ModalContextValue {
    showPlaceModal: (place: Place) => void;
    showPlacePhotos: (place: Place) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

    const showPlaceModal = useCallback((place: Place) => {
        setSelectedPlace(place);
    }, []);

    const showPlacePhotos = useCallback((place: Place) => {
        // Placeholder function for showing photos - to be implemented later
        console.log("Show photos for:", place.name);
    }, []);

    const closeModal = useCallback(() => {
        setSelectedPlace(null);
    }, []);

    return (
        <ModalContext.Provider value={{ showPlaceModal, showPlacePhotos, closeModal }}>
            {children}
            <PlaceModal place={selectedPlace} open={Boolean(selectedPlace)} onClose={closeModal} />
        </ModalContext.Provider>
    );
}

export function useModalContext() {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModalContext must be used within a ModalProvider");
    }
    return context;
}
