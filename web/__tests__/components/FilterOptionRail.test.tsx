import { FilterOptionRail } from "@/components/FilterOptionRail";
import { FilterDataContext, FiltersContext } from "@/contexts/FilterContext";
import { DEFAULT_FILTER_CONFIG, type FilterConfig, type FilterKey } from "@/lib/filters";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

function TestHarness() {
    const [filters, setFilters] = useState<FilterConfig>(DEFAULT_FILTER_CONFIG);
    const getDistinctValues = (field: FilterKey) => field === "type"
        ? ["Zoo", "Coffee Shop", "Bookstore", "Coffee Shop"]
        : [];

    return (
        <FilterDataContext.Provider value={{ getDistinctValues }}>
            <FiltersContext.Provider value={{ filters, setFilters }}>
                <FilterOptionRail
                    field="type"
                    label="Type"
                    featuredValues={["Bookstore"]}
                />
                <output data-testid="selected-types">{(filters.type.value as string[]).join("|")}</output>
            </FiltersContext.Provider>
        </FilterDataContext.Provider>
    );
}

describe("FilterOptionRail", () => {
    it("keeps featured values first and preserves the existing picker behavior", async () => {
        const user = userEvent.setup();
        render(<TestHarness />);

        const rail = screen.getByLabelText("Scrollable type options");
        const labels = Array.from(rail.querySelectorAll("button"), button => button.textContent);
        expect(labels).toEqual(["Bookstore", "Coffee Shop", "Zoo"]);

        await user.click(screen.getByRole("button", { name: "Coffee Shop" }));
        expect(screen.getByTestId("selected-types")).toHaveTextContent("Coffee Shop");

        await user.click(screen.getByRole("button", { name: "See all 3" }));
        expect(await screen.findByRole("heading", { name: "Select Type" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Has Any Type" })).toHaveAttribute("aria-pressed", "true");
    });

    it("uses alphabetical order when Neighborhood has no featured values", async () => {
        const user = userEvent.setup();
        const getDistinctValues = (field: FilterKey) => field === "neighborhood"
            ? ["Uptown", "NoDa", "Ballantyne"]
            : [];

        render(
            <FilterDataContext.Provider value={{ getDistinctValues }}>
                <FiltersContext.Provider value={{ filters: DEFAULT_FILTER_CONFIG, setFilters: () => {} }}>
                    <FilterOptionRail
                        field="neighborhood"
                        label="Neighborhood"
                        featuredValues={[]}
                    />
                </FiltersContext.Provider>
            </FilterDataContext.Provider>
        );

        const rail = screen.getByLabelText("Scrollable neighborhood options");
        const labels = Array.from(rail.querySelectorAll("button"), button => button.textContent);
        expect(labels).toEqual(["Ballantyne", "NoDa", "Uptown"]);

        await user.click(screen.getByRole("button", { name: "See all 3" }));
        expect(await screen.findByText("Places in any selected neighborhood.")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Has Any/i })).not.toBeInTheDocument();
    });

});