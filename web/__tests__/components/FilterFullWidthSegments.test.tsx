import { FilterFullWidthSegments } from "@/components/FilterFullWidthSegments";
import { FiltersContext } from "@/contexts/FilterContext";
import { DEFAULT_FILTER_CONFIG, type FilterConfig } from "@/lib/filters";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

function TestHarness() {
    const [filters, setFilters] = useState<FilterConfig>(DEFAULT_FILTER_CONFIG);

    return (
        <FiltersContext.Provider value={{ filters, setFilters }}>
            <FilterFullWidthSegments
                field="purchaseRequired"
                value={filters.purchaseRequired.value as string}
                label="Free to Hang Out"
                options={[
                    { label: "Yes", value: "No" },
                    { label: "No", value: "Yes" },
                ]}
            />
            <output data-testid="purchase-required-value">
                {filters.purchaseRequired.value as string}
            </output>
        </FiltersContext.Provider>
    );
}

describe("FilterFullWidthSegments", () => {
    it("selects and clears a mapped value", async () => {
        const user = userEvent.setup();
        render(<TestHarness />);
        const yesButton = screen.getByRole("button", { name: "Yes" });

        await user.click(yesButton);
        expect(screen.getByTestId("purchase-required-value")).toHaveTextContent("No");

        await user.click(yesButton);
        expect(screen.getByTestId("purchase-required-value")).toHaveTextContent("all");
    });
});