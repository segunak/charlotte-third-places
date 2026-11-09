"use client";

import type { Place, PlacePhoto } from "@/lib/types";
import { useEffect, useState } from "react";

const EMPTY_PHOTOS: PlacePhoto[] = [];
const photoCache = new Map<string, PlacePhoto[] | Promise<PlacePhoto[]>>();
type PhotoPlace = Pick<Place, "recordId" | "photos" | "photoCount">;

interface PhotoState {
    recordId: string;
    photos?: PlacePhoto[];
    error?: boolean;
}

function loadPhotos(recordId: string): Promise<PlacePhoto[]> {
    const cached = photoCache.get(recordId);
    if (cached) return Promise.resolve(cached);

    const pending = (async () => {
        const response = await fetch(`/api/places/${encodeURIComponent(recordId)}`);
        if (!response.ok) {
            throw new Error(`Photo request failed with status ${response.status}`);
        }

        const data = (await response.json()) as Partial<Place>;
        if (!Array.isArray(data?.photos)) {
            throw new Error(`Invalid photo response for place ${recordId}`);
        }

        photoCache.set(recordId, data.photos);
        return data.photos;
    })().catch((error: unknown) => {
        photoCache.delete(recordId);
        console.error(`Failed to load photos for place ${recordId}:`, error);
        throw error;
    });

    photoCache.set(recordId, pending);
    return pending;
}

export function usePlacePhotos(place: PhotoPlace | null, open: boolean) {
    const recordId = place?.recordId ?? "";
    const [state, setState] = useState<PhotoState>({ recordId: "" });

    const cached = photoCache.get(recordId);
    const loadedPhotos = Array.isArray(cached)
        ? cached
        : state.recordId === recordId ? state.photos : undefined;
    const needsPhotos = !!place && !loadedPhotos && (place.photoCount ?? place.photos.length) > place.photos.length;
    const error = needsPhotos && state.recordId === recordId && Boolean(state.error);

    useEffect(() => {
        if (!open || !needsPhotos || error) return;
        let active = true;

        void loadPhotos(recordId).then(
            (photos) => {
                if (active) setState({ recordId, photos });
            },
            () => {
                if (active) setState({ recordId, error: true });
            }
        );

        return () => { active = false; };
    }, [open, needsPhotos, error, recordId]);

    const retry = () => setState({ recordId });

    return {
        photos: loadedPhotos ?? place?.photos ?? EMPTY_PHOTOS,
        isLoading: open && needsPhotos && !error,
        error,
        retry,
    };
}
