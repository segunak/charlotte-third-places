"use client";

import { useFilters, useOpenNow, usePlaces, useQuickSearch } from "@/contexts/FilterContext";
import { FILTER_SENTINEL, placeMatchesFilters } from "@/lib/filters";
import { getCharlotteTimeNow, isPlaceOpenNow } from "@/lib/hours";
import { normalizeTextForSearch } from "@/lib/utils";
import { useMemo } from "react";

export function useFilteredPlaceSummary() {
    const { places } = usePlaces();
    const { filters } = useFilters();
    const { quickFilterText } = useQuickSearch();
    const { openNow } = useOpenNow();

    const appliedFilterCount = Object.values(filters).filter(filter =>
        Array.isArray(filter.value)
            ? filter.value.length > 0
            : filter.value !== FILTER_SENTINEL
    ).length + (quickFilterText.trim() ? 1 : 0);

    const filteredPlaces = useMemo(() => {
        const normalizedSearchTerm = normalizeTextForSearch(quickFilterText);
        let result = places.filter(place => {
            if (normalizedSearchTerm && !normalizeTextForSearch(place.name || "").includes(normalizedSearchTerm)) {
                return false;
            }

            return placeMatchesFilters(place, filters);
        });

        if (openNow) {
            const time = getCharlotteTimeNow();
            result = result.filter(place => isPlaceOpenNow(place.hours ?? [], time));
        }

        return result;
    }, [filters, openNow, places, quickFilterText]);

    return {
        appliedFilterCount,
        filteredPlaces,
        openNow,
        visibleCount: filteredPlaces.length,
    };
}