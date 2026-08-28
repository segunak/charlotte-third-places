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
                label="Purchase Required"
                options={[
                    { label: "Yes", value: "Yes" },
                    { label: "No", value: "No" },
                ]}
            />
            <output data-testid="purchase-required-value">
                {filters.purchaseRequired.value as string}
            </output>
        </FiltersContext.Provider>
    );
}

describe("FilterFullWidthSegments", () => {
    it("selects and clears direct Purchase Required values", async () => {
        const user = userEvent.setup();
        render(<TestHarness />);
        const yesButton = screen.getByRole("button", { name: "Yes" });
        const noButton = screen.getByRole("button", { name: "No" });

        expect(document.querySelectorAll('[data-segment-divider=""]')).toHaveLength(1);

        await user.click(yesButton);
        expect(screen.getByTestId("purchase-required-value")).toHaveTextContent("Yes");
        expect(document.querySelector('[data-segment-divider=""]')).not.toBeInTheDocument();

        await user.click(yesButton);
        expect(screen.getByTestId("purchase-required-value")).toHaveTextContent("all");
        expect(document.querySelectorAll('[data-segment-divider=""]')).toHaveLength(1);

        await user.click(noButton);
        expect(screen.getByTestId("purchase-required-value")).toHaveTextContent("No");
        expect(document.querySelector('[data-segment-divider=""]')).not.toBeInTheDocument();
    });
});