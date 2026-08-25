import { PopularTagFilters } from "@/components/PopularTagFilters";
import { FilterDataContext, FiltersContext } from "@/contexts/FilterContext";
import { DEFAULT_FILTER_CONFIG, type FilterConfig } from "@/lib/filters";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

function TestHarness({
    initialTags = ["Hidden Gem"],
}: {
    initialTags?: string[];
}) {
    const [filters, setFilters] = useState<FilterConfig>({
        ...DEFAULT_FILTER_CONFIG,
        tags: { ...DEFAULT_FILTER_CONFIG.tags, value: initialTags },
    });

    return (
        <FilterDataContext.Provider value={{
            getDistinctValues: () => [
                "Woman Owned",
                "Charlotte Local",
                "Has Fireplace",
                "Date Spot",
                "Hidden Gem",
                "Dog Friendly",
                "Black Owned",
                "Charlotte Local",
            ],
        }}>
            <FiltersContext.Provider value={{ filters, setFilters }}>
                <PopularTagFilters />
                <output data-testid="selected-tags">{(filters.tags.value as string[]).join("|")}</output>
            </FiltersContext.Provider>
        </FilterDataContext.Provider>
    );
}

describe("PopularTagFilters", () => {
    it("shows featured tags and opens the complete picker", async () => {
        const user = userEvent.setup();
        render(<TestHarness initialTags={["Has Fireplace"]} />);

        const localButton = screen.getByRole("button", { name: "Charlotte Local" });
        const hiddenGemButton = screen.getByRole("button", { name: "Hidden Gem" });

        expect(localButton).toHaveTextContent("Charlotte Local");
        expect(screen.getByRole("button", { name: "Date Spot" })).toBeInTheDocument();
        expect(hiddenGemButton).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "More Tags, 1 other selected" })).toHaveTextContent("More Tags (1)");

        await user.click(localButton);
        await user.click(hiddenGemButton);
        expect(screen.getByTestId("selected-tags")).toHaveTextContent(
            "Has Fireplace|Charlotte Local|Hidden Gem"
        );

        await user.click(screen.getByRole("button", { name: /^More Tags/ }));
        expect(await screen.findByRole("heading", { name: "Select Tags" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Has Fireplace" })).toBeInTheDocument();
    });

    it("toggles popular tags without removing other selected tags", async () => {
        const user = userEvent.setup();
        render(<TestHarness />);

        const localButton = screen.getByRole("button", { name: "Charlotte Local" });
        const dateButton = screen.getByRole("button", { name: "Date Spot" });

        expect(localButton).toHaveAttribute("aria-pressed", "false");
        expect(dateButton).toHaveAttribute("aria-pressed", "false");

        await user.click(localButton);
        await user.click(dateButton);

        expect(localButton).toHaveAttribute("aria-pressed", "true");
        expect(dateButton).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByTestId("selected-tags")).toHaveTextContent(
            "Hidden Gem|Charlotte Local|Date Spot"
        );

        await user.click(localButton);

        expect(localButton).toHaveAttribute("aria-pressed", "false");
        expect(dateButton).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByTestId("selected-tags")).toHaveTextContent("Hidden Gem|Date Spot");
    });
});