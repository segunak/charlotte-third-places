import { PlaceSearchFilter } from "@/components/PlaceSearchFilter";
import { FilterDataContext, FiltersContext } from "@/contexts/FilterContext";
import { DEFAULT_FILTER_CONFIG, type FilterConfig } from "@/lib/filters";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

function TestHarness() {
    const [filters, setFilters] = useState<FilterConfig>(DEFAULT_FILTER_CONFIG);

    return (
        <FilterDataContext.Provider value={{ getDistinctValues: () => ["Amélie's", "The Hobbyist"] }}>
            <FiltersContext.Provider value={{ filters, setFilters }}>
                <PlaceSearchFilter />
                <output data-testid="place-value">{filters.name.value as string}</output>
            </FiltersContext.Provider>
        </FilterDataContext.Provider>
    );
}

describe("PlaceSearchFilter", () => {
    it("uses the existing searchable picker and supports clearing one place", async () => {
        const user = userEvent.setup();
        render(<TestHarness />);

        await user.click(screen.getByRole("button", { name: "Search Places" }));
        expect(await screen.findByRole("heading", { name: "Choose a Place" })).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Search Places")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "All Places" })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "The Hobbyist" }));
        expect(screen.getByTestId("place-value")).toHaveTextContent("The Hobbyist");
        expect(screen.getByRole("button", { name: "Clear place filter" })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Clear place filter" }));
        expect(screen.getByTestId("place-value")).toHaveTextContent("all");
    });
});