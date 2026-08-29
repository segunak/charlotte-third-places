import { MobileQuickFilters } from "@/components/MobileQuickFilters";
import { FiltersContext } from "@/contexts/FilterContext";
import { DEFAULT_FILTER_CONFIG } from "@/lib/filters";
import type { Place } from "@/lib/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    OpenNowToggle: () => (
        <button type="button" role="switch" aria-label="Open Now" aria-checked="false">Open Now</button>
    ),
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

    it("separates Open Now, filter commands, and Coming Soon", async () => {
        const user = userEvent.setup();
        const setComingSoonOpen = vi.fn();
        const comingSoonPlaces = [{}, {}] as Place[];

        render(
            <FiltersContext.Provider value={{ filters: DEFAULT_FILTER_CONFIG, setFilters: vi.fn() }}>
                <MobileQuickFilters
                    comingSoonPlaces={comingSoonPlaces}
                    comingSoonOpen={false}
                    setComingSoonOpen={setComingSoonOpen}
                />
            </FiltersContext.Provider>
        );

        const purchaseRequiredFieldset = screen.getByText("Purchase Required").closest("fieldset");
        const openNow = screen.getByRole("switch", { name: "Open Now" });
        const openNowBoundary = openNow.parentElement;
        const resetFilters = screen.getByRole("button", { name: "Reset Filters" });
        const commandBoundary = resetFilters.parentElement?.parentElement;
        const comingSoon = screen.getByRole("button", { name: "View 2 places coming soon" });

        expect(purchaseRequiredFieldset!.compareDocumentPosition(openNowBoundary!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(openNowBoundary).toHaveClass("border-t", "pt-4");
        expect(commandBoundary).toHaveClass("border-t", "pt-4");
        expect(openNowBoundary!.compareDocumentPosition(commandBoundary!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(comingSoon).toHaveClass(
            "h-11",
            "w-full",
            "grid",
            "grid-cols-[minmax(0,1fr)_auto_0.75rem]",
            "gap-3",
            "rounded-xl",
            "border",
            "border-border",
            "bg-background",
            "px-3",
            "text-sm",
            "font-semibold",
            "text-foreground",
            "shadow-xs",
            "hover:bg-muted"
        );
        expect(comingSoon).toHaveTextContent("Coming Soon");
        expect(comingSoon).toHaveTextContent("2 Places");
        expect(comingSoon.parentElement).toHaveClass("border-t", "bg-muted/30");

        await user.click(comingSoon);
        expect(setComingSoonOpen).toHaveBeenCalledWith(true);
    });
});
