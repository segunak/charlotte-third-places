import { FilterStatusRow } from "@/components/FilterStatusRow";
import { FilterProvider, useFilters } from "@/contexts/FilterContext";
import type { Place } from "@/lib/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

function createPlace(name: string, neighborhood: string): Place {
    return {
        recordId: name,
        name,
        description: "",
        address: "",
        neighborhood,
        latitude: 35.2,
        longitude: -80.8,
        type: ["Coffee Shop"],
        size: "Medium",
        purchaseRequired: "Yes",
        parking: ["Free"],
        freeWiFi: "Yes",
        hasCinnamonRolls: "No",
        hasReviews: "No",
        googleMapsPlaceId: "",
        googleMapsProfileURL: "",
        appleMapsProfileURL: "",
        website: "",
        tiktok: "",
        instagram: "",
        youtube: "",
        facebook: "",
        twitter: "",
        linkedIn: "",
        tags: [],
        photos: [],
        hours: [],
        comments: "",
        featured: false,
        operational: "Open",
        createdDate: new Date("2026-01-01T00:00:00.000Z"),
        lastModifiedDate: new Date("2026-01-01T00:00:00.000Z"),
    };
}

function FilterControls() {
    const { setFilters } = useFilters();

    return (
        <button
            type="button"
            onClick={() => setFilters(previousFilters => ({
                ...previousFilters,
                neighborhood: { ...previousFilters.neighborhood, value: ["NoDa"] },
            }))}
        >
            Apply NoDa
        </button>
    );
}

describe("FilterStatusRow", () => {
    it("shows the default result count", () => {
        render(
            <FilterProvider places={[
                createPlace("NoDa Cafe", "NoDa"),
                createPlace("Uptown Library", "Uptown"),
            ]}>
                <FilterStatusRow />
            </FilterProvider>
        );

        const status = screen.getByRole("status");
        expect(status).toHaveTextContent("All Places");
        expect(status).toHaveTextContent("2 Places");
    });

    it("shows the applied filter count and matching place count", async () => {
        const user = userEvent.setup();
        render(
            <FilterProvider places={[
                createPlace("NoDa Cafe", "NoDa"),
                createPlace("Uptown Library", "Uptown"),
            ]}>
                <FilterStatusRow />
                <FilterControls />
            </FilterProvider>
        );

        await user.click(screen.getByRole("button", { name: "Apply NoDa" }));

        const status = screen.getByRole("status");
        expect(status).toHaveTextContent("1 Filter Applied");
        expect(status).toHaveTextContent("1 Place");
    });
});