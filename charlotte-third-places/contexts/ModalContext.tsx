"use client";

import { Place } from "@/lib/types";
import { PlaceModal } from "@/components/PlaceModal";
import { PhotosModal } from "@/components/PhotosModal";
import React, { createContext, useCallback, useContext, useState } from "react";

interface ModalContextValue {
    showPlaceModal: (place: Place) => void;
    showPlacePhotos: (place: Place) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [showPhotos, setShowPhotos] = useState(false);

    const showPlaceModal = useCallback((place: Place) => {
        setSelectedPlace(place);
        setShowPhotos(false);
    }, []);

    const showPlacePhotos = useCallback((place: Place) => {
        setSelectedPlace(place);
        setShowPhotos(true);
    }, []);

    const closeModal = useCallback(() => {
        setSelectedPlace(null);
        setShowPhotos(false);
    }, []);

    return (
        <ModalContext.Provider value={{ showPlaceModal, showPlacePhotos, closeModal }}>
            {children}
            <PlaceModal 
                place={selectedPlace} 
                open={Boolean(selectedPlace) && !showPhotos} 
                onClose={closeModal} 
            />
            <PhotosModal 
                place={selectedPlace} 
                open={Boolean(selectedPlace) && showPhotos} 
                onClose={closeModal} 
            />
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
