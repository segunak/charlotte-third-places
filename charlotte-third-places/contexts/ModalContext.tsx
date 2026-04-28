"use client";

import { Place } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import dynamic from "next/dynamic";
import React, { createContext, useCallback, useContext, useState, useEffect, useMemo, useRef } from "react";

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

const ChatModal = dynamic(
    () => import("@/components/ChatModal").then(mod => ({ default: mod.ChatModal })),
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
    import("@/components/ChatModal");
}

// ============================================================================
// SURFACE STACK MODEL
// ============================================================================
// A surface is one modal layer. The array order is bottom-to-top, so the last
// surface is the one the user sees on top and the first one closed by Back.

type SurfaceKind = 'place' | 'chat' | 'photos';

interface BaseSurface {
    id: string;
    kind: SurfaceKind;
    place: Place;
}

interface PlaceSurface extends BaseSurface {
    kind: 'place';
    // Used for places opened from chat links. It prevents Chat -> Place -> Ask AI
    // loops while keeping Ask AI visible for normal card/map place opens.
    hideAskAI?: boolean;
}

interface PhotosSurface extends BaseSurface {
    kind: 'photos';
}

interface ChatSurface extends BaseSurface {
    kind: 'chat';
    initialMessage?: string;
}

export type Surface = PlaceSurface | PhotosSurface | ChatSurface;

interface PushPlaceOptions {
    hideAskAI?: boolean;
}

interface ModalActionsContextValue {
    pushPlace: (place: Place, options?: PushPlaceOptions) => void;
    pushPhotos: (place: Place) => void;
    pushChat: (place: Place, initialMessage?: string) => void;
    pop: () => void;
    popTo: (id: string) => void;
    closeAll: () => void;
}

const ModalActionsContext = createContext<ModalActionsContextValue | undefined>(undefined);

// Each browser history entry stores enough surface state to restore the stack.
// Depth alone is not enough: browser Forward needs the actual surface data.
interface HistorySurfaceState {
    surfaceStackDepth?: number;
    surfaceStack?: Surface[];
}

function getSurfaceHistoryState(rawState: unknown): HistorySurfaceState | null {
    if (!rawState || typeof rawState !== 'object') return null;
    const state = rawState as HistorySurfaceState;
    if (typeof state.surfaceStackDepth === 'number' || Array.isArray(state.surfaceStack)) {
        return state;
    }
    return null;
}

function getTargetDepth(state: HistorySurfaceState | null): number {
    if (typeof state?.surfaceStackDepth === 'number' && Number.isFinite(state.surfaceStackDepth)) {
        return Math.max(0, Math.floor(state.surfaceStackDepth));
    }
    if (Array.isArray(state?.surfaceStack)) {
        return state.surfaceStack.length;
    }
    return 0;
}

function getStackSnapshot(state: HistorySurfaceState | null, targetDepth: number): Surface[] | null {
    if (!Array.isArray(state?.surfaceStack)) return null;
    if (state.surfaceStack.length < targetDepth) return null;
    return state.surfaceStack.slice(0, targetDepth);
}

function createHistoryState(stack: Surface[]): HistorySurfaceState {
    // Preserve unrelated router/framework history state and add our modal data.
    const existingState = typeof window !== 'undefined' && window.history.state && typeof window.history.state === 'object'
        ? window.history.state as Record<string, unknown>
        : {};

    return {
        ...existingState,
        surfaceStackDepth: stack.length,
        surfaceStack: stack,
    };
}

function newId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `surface-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ============================================================================
// PROVIDER
// ============================================================================

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [surfaces, setSurfaces] = useState<Surface[]>([]);

    // Event handlers and stable callbacks need the latest stack without being
    // recreated on every render, so state and ref are kept in sync together.
    const surfacesRef = useRef<Surface[]>(surfaces);
    useEffect(() => {
        surfacesRef.current = surfaces;
    }, [surfaces]);

    // Keep stack updates immediate. Deferring them with startTransition can let
    // browser history and the visible modal stack drift during Back/Forward.
    const setSurfaceStack = useCallback((nextSurfaces: Surface[]) => {
        surfacesRef.current = nextSurfaces;
        setSurfaces(nextSurfaces);
    }, []);

    // Preload modal chunks after page is interactive so first click is instant
    useEffect(() => {
        if (typeof window === "undefined") return;
        if ("requestIdleCallback" in window) {
            (window as Window & typeof globalThis).requestIdleCallback(preloadModalChunks);
        } else {
            setTimeout(preloadModalChunks, 1000);
        }
    }, []);

    // Browser Back/Forward controls the stack. This matters most in the PWA,
    // where Back may be the user's only native way to leave a nested modal.
    useEffect(() => {
        if (typeof window === "undefined") return;
        const handler = (e: PopStateEvent) => {
            const state = getSurfaceHistoryState(e.state);
            if (surfacesRef.current.length === 0 && !state) return;

            const targetDepth = getTargetDepth(state);
            const snapshot = getStackSnapshot(state, targetDepth);
            const current = surfacesRef.current;

            if (snapshot) {
                setSurfaceStack(snapshot);
                return;
            }

            if (current.length > targetDepth) {
                setSurfaceStack(current.slice(0, targetDepth));
            } else if (targetDepth === 0 && current.length > 0) {
                setSurfaceStack([]);
            }
        };
        window.addEventListener('popstate', handler);
        return () => window.removeEventListener('popstate', handler);
    }, [setSurfaceStack]);

    const pushSurface = useCallback((surface: Surface) => {
        const current = surfacesRef.current;
        const next = [...current, surface];
        if (typeof window !== 'undefined') {
            // Keep pushState outside React state updates. History is a browser
            // side effect and should happen exactly once per user action.
            window.history.pushState(createHistoryState(next), '');
        }
        setSurfaceStack(next);
    }, [setSurfaceStack]);

    const pushPlace = useCallback((place: Place, options?: PushPlaceOptions) => {
        pushSurface({ id: newId(), kind: 'place', place, hideAskAI: options?.hideAskAI });
    }, [pushSurface]);

    const pushPhotos = useCallback((place: Place) => {
        pushSurface({ id: newId(), kind: 'photos', place });
    }, [pushSurface]);

    const pushChat = useCallback((place: Place, initialMessage?: string) => {
        pushSurface({ id: newId(), kind: 'chat', place, initialMessage });
    }, [pushSurface]);

    const pop = useCallback(() => {
        if (typeof window === 'undefined') {
            const current = surfacesRef.current;
            setSurfaceStack(current.length > 0 ? current.slice(0, -1) : current);
            return;
        }
        if (surfacesRef.current.length === 0) return;
        window.history.back();
    }, [setSurfaceStack]);

    const popTo = useCallback((id: string) => {
        const surfacesNow = surfacesRef.current;
        const idx = surfacesNow.findIndex(s => s.id === id);
        if (idx < 0) return;
        // Pop everything ABOVE this surface (so the surface itself remains).
        const toPop = surfacesNow.length - (idx + 1);
        if (toPop <= 0) return;
        if (typeof window === 'undefined') {
            setSurfaceStack(surfacesNow.slice(0, idx + 1));
            return;
        }
        window.history.go(-toPop);
    }, [setSurfaceStack]);

    const closeAll = useCallback(() => {
        const n = surfacesRef.current.length;
        if (n === 0) return;
        if (typeof window === 'undefined') {
            setSurfaceStack([]);
            return;
        }
        window.history.go(-n);
    }, [setSurfaceStack]);

    const actionsValue = useMemo<ModalActionsContextValue>(() => ({
        pushPlace,
        pushPhotos,
        pushChat,
        pop,
        popTo,
        closeAll,
    }), [pushPlace, pushPhotos, pushChat, pop, popTo, closeAll]);

    // Render every surface in stack order. Later surfaces get higher z-indexes.
    // Ask AI is hidden for chat-origin places and for places above a chat modal.
    return (
        <ModalActionsContext.Provider value={actionsValue}>
            {children}
            {surfaces.map((surface, i) => {
                const zIndex = 50 + i * 10;
                const onClose = () => pop();
                const key = surface.id;
                if (surface.kind === 'place') {
                    const showAskAI = !surface.hideAskAI && !surfaces.slice(0, i).some(s => s.kind === 'chat');
                    return (
                        <PlaceModal
                            key={key}
                            place={surface.place}
                            open
                            onClose={onClose}
                            zIndex={zIndex}
                            showAskAI={showAskAI}
                        />
                    );
                }
                if (surface.kind === 'photos') {
                    return (
                        <PhotosModal
                            key={key}
                            place={surface.place}
                            open
                            onClose={onClose}
                            zIndex={zIndex}
                        />
                    );
                }
                return (
                    <ChatModal
                        key={key}
                        open
                        onClose={onClose}
                        place={surface.place}
                        initialMessage={surface.initialMessage}
                        zIndex={zIndex}
                    />
                );
            })}
        </ModalActionsContext.Provider>
    );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * useModalActions — RECOMMENDED for components that trigger modals.
 *
 * Returns stable callback references for pushing/popping modal surfaces.
 * Components subscribing to this hook do NOT re-render when the surface
 * stack changes, since the actions object is memoized with stable callbacks.
 */
export function useModalActions() {
    const context = useContext(ModalActionsContext);
    if (!context) {
        throw new Error("useModalActions must be used within a ModalProvider");
    }
    return context;
}
