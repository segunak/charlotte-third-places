"use client";

import { Place } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import dynamic from "next/dynamic";
import React, { createContext, useCallback, useContext, useState, useTransition, useEffect, useMemo, useRef } from "react";

// Lazy-load modal components to reduce initial bundle and defer rendering work
const PlaceModal = dynamic(
    () => import("@/components/PlaceModal").then(mod => ({ default: mod.PlaceModal })),
    {
        ssr: false,
        loading: () => (
            <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
                <LoadingSpinner />
            </div>
        ),
    }
);

const PhotosModal = dynamic(
    () => import("@/components/PhotosModal").then(mod => ({ default: mod.PhotosModal })),
    {
        ssr: false,
        loading: () => (
            <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
                <LoadingSpinner />
            </div>
        ),
    }
);

const ChatDialog = dynamic(
    () => import("@/components/ChatDialog").then(mod => ({ default: mod.ChatDialog })),
    {
        ssr: false,
        loading: () => (
            <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
                <LoadingSpinner />
            </div>
        ),
    }
);

// Preload modal chunks after page is interactive so first click is instant
function preloadModalChunks() {
    import("@/components/PlaceModal");
    import("@/components/PhotosModal");
    import("@/components/ChatDialog");
}

// Define the origin type
type PhotoModalOrigin = 'card' | 'modal' | null;

// ============================================================================
// GRANULAR CONTEXTS - Split for optimal render performance
// ============================================================================

/**
 * ModalActionsContext: Stable callback functions for opening/closing modals.
 * These callbacks are memoized and never change, so components subscribing
 * to this context won't re-render when modal state changes.
 * 
 * This is the key optimization: PlaceCards subscribe to actions only,
 * not state, so they don't re-render when a modal opens/closes.
 */
interface ModalActionsContextValue {
    showPlaceModal: (place: Place) => void;
    showPlacePhotos: (place: Place, origin: Exclude<PhotoModalOrigin, null>) => void;
    showPlaceChat: (place: Place) => void;
    closePlaceModal: () => void;
    closePhotosModal: () => void;
    closeChatDialog: () => void;
}

const ModalActionsContext = createContext<ModalActionsContextValue | undefined>(undefined);

// ============================================================================
// LEGACY CONTEXT - For backward compatibility
// ============================================================================

interface ModalContextValue {
    showPlaceModal: (place: Place) => void;
    showPlacePhotos: (place: Place, origin: Exclude<PhotoModalOrigin, null>) => void; 
    showPlaceChat: (place: Place) => void;
    closePlaceModal: () => void;
    closePhotosModal: () => void;
    closeChatDialog: () => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [showPhotos, setShowPhotos] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatPlace, setChatPlace] = useState<Place | null>(null);
    const [photoModalOrigin, setPhotoModalOrigin] = useState<PhotoModalOrigin>(null);
    const [, startTransition] = useTransition();
    
    // Use ref to track photoModalOrigin for closePhotosModal without causing
    // the callback to be recreated (which would defeat the optimization)
    const photoModalOriginRef = useRef<PhotoModalOrigin>(null);
    photoModalOriginRef.current = photoModalOrigin;

    // Preload modal chunks after page is interactive so first click is instant
    useEffect(() => {
        if (typeof window !== "undefined") {
            if ("requestIdleCallback" in window) {
                requestIdleCallback(preloadModalChunks);
            } else {
                // Fallback for Safari and older browsers
                setTimeout(preloadModalChunks, 1000);
            }
        }
    }, []);

    // All callbacks use empty dependency arrays - they're stable references
    // that read current state via refs or setState functional updates
    const showPlaceModal = useCallback((place: Place) => {
        startTransition(() => {
            setSelectedPlace(place);
            setShowPhotos(false);
            setPhotoModalOrigin(null);
        });
    }, []);

    const showPlacePhotos = useCallback((place: Place, origin: Exclude<PhotoModalOrigin, null>) => {
        startTransition(() => {
            setSelectedPlace(place);
            setShowPhotos(true);
            setPhotoModalOrigin(origin);
        });
    }, []);

    const showPlaceChat = useCallback((place: Place) => {
        startTransition(() => {
            setChatPlace(place);
            setShowChat(true);
        });
    }, []);

    const closePlaceModal = useCallback(() => {
        setSelectedPlace(null);
        setShowPhotos(false);
        setPhotoModalOrigin(null);
    }, []);

    const closePhotosModal = useCallback(() => {
        // Read from ref to avoid dependency on photoModalOrigin state
        if (photoModalOriginRef.current === 'card') {
            setSelectedPlace(null);
        }
        setShowPhotos(false);
        setPhotoModalOrigin(null);
    }, []); // Empty deps - reads from ref

    const closeChatDialog = useCallback(() => {
        setShowChat(false);
        setChatPlace(null);
    }, []);

    // Memoize the actions object - it never changes because all callbacks are stable
    const actionsValue = useMemo<ModalActionsContextValue>(() => ({
        showPlaceModal,
        showPlacePhotos,
        showPlaceChat,
        closePlaceModal,
        closePhotosModal,
        closeChatDialog,
    }), [showPlaceModal, showPlacePhotos, showPlaceChat, closePlaceModal, closePhotosModal, closeChatDialog]);

    return (
        <ModalActionsContext.Provider value={actionsValue}>
            {/* Legacy context wraps for backward compatibility */}
            <ModalContext.Provider value={actionsValue}>
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
        </ModalActionsContext.Provider>
    );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * useModalActions - RECOMMENDED for components that trigger modals
 * 
 * Use this hook in components like PlaceCard, PlaceMap, etc. that only need
 * to OPEN modals. Since the actions are stable references, components using
 * this hook won't re-render when modal state changes.
 */
export function useModalActions() {
    const context = useContext(ModalActionsContext);
    if (!context) {
        throw new Error("useModalActions must be used within a ModalProvider");
    }
    return context;
}

/**
 * useModalContext - Legacy hook for backward compatibility
 * 
 * This hook still works but subscribes to the same stable actions context.
 * Existing code using useModalContext will continue to work without changes.
 */
export function useModalContext() {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModalContext must be used within a ModalProvider");
    }
    return context;
}
