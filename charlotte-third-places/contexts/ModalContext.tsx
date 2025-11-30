"use client";

import { Place } from "@/lib/types";
import { PlaceModal } from "@/components/PlaceModal";
import { PhotosModal } from "@/components/PhotosModal";
import { ChatDialog } from "@/components/ChatDialog";
import React, { createContext, useCallback, useContext, useState } from "react";

// Define the origin type
type PhotoModalOrigin = 'card' | 'modal' | null;

interface ModalContextValue {
    showPlaceModal: (place: Place) => void;
    // Update showPlacePhotos signature
    showPlacePhotos: (place: Place, origin: Exclude<PhotoModalOrigin, null>) => void; 
    showPlaceChat: (place: Place) => void;
    closePlaceModal: () => void;
    closePhotosModal: () => void;
    closeChatDialog: () => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [showPhotos, setShowPhotos] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatPlace, setChatPlace] = useState<Place | null>(null);
    // Add state for tracking the origin
    const [photoModalOrigin, setPhotoModalOrigin] = useState<PhotoModalOrigin>(null); 

    const showPlaceModal = useCallback((place: Place) => {
        setSelectedPlace(place);
        setShowPhotos(false);
        setPhotoModalOrigin(null); // Reset origin
    }, []);

    // Update showPlacePhotos to accept and set origin
    const showPlacePhotos = useCallback((place: Place, origin: Exclude<PhotoModalOrigin, null>) => {
        setSelectedPlace(place);
        setShowPhotos(true);
        setPhotoModalOrigin(origin); // Set the origin
    }, []);

    const showPlaceChat = useCallback((place: Place) => {
        setChatPlace(place);
        setShowChat(true);
    }, []);

    const closePlaceModal = useCallback(() => {
        setSelectedPlace(null);
        setShowPhotos(false);
        setPhotoModalOrigin(null); // Reset origin
    }, []);

    const closePhotosModal = useCallback(() => {
        // Only clear selectedPlace if opened from a card
        if (photoModalOrigin === 'card') {
            setSelectedPlace(null);
        }
        // Always hide photos and reset origin
        setShowPhotos(false);
        setPhotoModalOrigin(null); 
    }, [photoModalOrigin]); // Depend on photoModalOrigin

    const closeChatDialog = useCallback(() => {
        setShowChat(false);
        setChatPlace(null);
    }, []);

    return (
        <ModalContext.Provider 
            value={{ 
                showPlaceModal, 
                showPlacePhotos,
                showPlaceChat,
                closePlaceModal, 
                closePhotosModal,
                closeChatDialog
            }}
        >
            {children}
            {/* PlaceModal visibility depends on selectedPlace and !showPhotos */}
            <PlaceModal 
                place={selectedPlace} 
                open={Boolean(selectedPlace) && !showPhotos} 
                onClose={closePlaceModal}
            />
            {/* PhotosModal visibility depends on selectedPlace and showPhotos */}
            <PhotosModal 
                place={selectedPlace} 
                open={Boolean(selectedPlace) && showPhotos} 
                onClose={closePhotosModal}
            />
            {/* ChatDialog for place-specific chat from cards */}
            <ChatDialog
                open={showChat}
                onClose={closeChatDialog}
                place={chatPlace}
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
