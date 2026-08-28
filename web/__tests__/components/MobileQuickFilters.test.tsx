import { MobileQuickFilters } from "@/components/MobileQuickFilters";
import { FiltersContext } from "@/contexts/FilterContext";
import { DEFAULT_FILTER_CONFIG } from "@/lib/filters";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/FilterDrawer", () => ({
    FilterDrawer: () => null,
}));

vi.mock("@/components/FilterOptionRail", () => ({
    FilterOptionRail: ({ field, label }: { field: string; label: string }) => (
        <div data-filter-field={field}>{label}</div>
    ),
}));

vi.mock("@/components/FilterStatusRow", () => ({
    FilterStatusRow: () => null,
}));

vi.mock("@/components/FilterUtilities", () => ({
    FilterQuickSearch: () => <input aria-label="Search Places" />,
    FilterResetButton: () => <button type="button">Reset Filters</button>,
    OpenNowToggle: () => <button type="button">Open Now</button>,
}));

describe("MobileQuickFilters", () => {
    it("shows centered Purchase Required segments after Tags without Size", () => {
        render(
            <FiltersContext.Provider value={{ filters: DEFAULT_FILTER_CONFIG, setFilters: vi.fn() }}>
                <MobileQuickFilters
                    comingSoonPlaces={[]}
                    comingSoonOpen={false}
                    setComingSoonOpen={vi.fn()}
                />
            </FiltersContext.Provider>
        );

        const tags = screen.getByText("Tags");
        const label = screen.getByText("Purchase Required");
        const legend = label.closest("legend");
        const purchaseRequiredFieldset = label.closest("fieldset");
        const purchaseRequiredSegments = purchaseRequiredFieldset?.querySelector('[role="group"]');
        const legendRules = legend?.querySelectorAll('[aria-hidden="true"]');

        expect(screen.queryByText("Size")).not.toBeInTheDocument();
        expect(purchaseRequiredFieldset).not.toBeNull();
        expect(tags.compareDocumentPosition(purchaseRequiredFieldset!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(legend).not.toBeNull();
        expect(legend).toHaveClass("w-full", "p-0");
        expect(legendRules).toHaveLength(2);
        expect(purchaseRequiredFieldset).toHaveClass("border-0", "bg-transparent", "p-0");
        expect(purchaseRequiredSegments).toHaveClass("grid-cols-2");
    });
});
