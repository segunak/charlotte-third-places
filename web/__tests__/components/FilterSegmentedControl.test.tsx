import { FilterSegmentedControl } from "@/components/FilterSegmentedControl";
import { FilterDataContext, FiltersContext } from "@/contexts/FilterContext";
import { DEFAULT_FILTER_CONFIG, type FilterConfig } from "@/lib/filters";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

function TestHarness() {
    const [filters, setFilters] = useState<FilterConfig>(DEFAULT_FILTER_CONFIG);

    return (
        <FilterDataContext.Provider value={{ getDistinctValues: () => ["Free", "Paid"] }}>
            <FiltersContext.Provider value={{ filters, setFilters }}>
                <FilterSegmentedControl field="parking" value={filters.parking.value as string} label="Parking" />
                <output data-testid="parking-value">{filters.parking.value as string}</output>
            </FiltersContext.Provider>
        </FilterDataContext.Provider>
    );
}

describe("FilterSegmentedControl", () => {
    it("selects and clears a single filter value", async () => {
        const user = userEvent.setup();
        render(<TestHarness />);
        const freeButton = screen.getByRole("button", { name: "Free" });

        await user.click(freeButton);
        expect(screen.getByTestId("parking-value")).toHaveTextContent("Free");

        await user.click(freeButton);
        expect(screen.getByTestId("parking-value")).toHaveTextContent("all");
    });
});