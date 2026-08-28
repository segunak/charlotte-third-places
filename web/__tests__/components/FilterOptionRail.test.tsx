import { FilterOptionRail } from "@/components/FilterOptionRail";
import { FilterDataContext, FiltersContext } from "@/contexts/FilterContext";
import { DEFAULT_FILTER_CONFIG, type FilterConfig, type FilterKey } from "@/lib/filters";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

function TestHarness({ layout = "inline" }: { layout?: "inline" | "fieldset" }) {
    const [filters, setFilters] = useState<FilterConfig>(DEFAULT_FILTER_CONFIG);
    const getDistinctValues = (field: FilterKey) => field === "type"
        ? ["Zoo", "Coffee Shop", "Bookstore", "Bakery", "Library", "Coffee Shop"]
        : [];

    return (
        <FilterDataContext.Provider value={{ getDistinctValues }}>
            <FiltersContext.Provider value={{ filters, setFilters }}>
                <FilterOptionRail
                    field="type"
                    label="Type"
                    featuredValues={["Bookstore"]}
                    layout={layout}
                />
                <output data-testid="selected-types">{(filters.type.value as string[]).join("|")}</output>
            </FiltersContext.Provider>
        </FilterDataContext.Provider>
    );
}

describe("FilterOptionRail", () => {
    it("keeps chip order stable when toggling a selection directly", async () => {
        const user = userEvent.setup();
        render(<TestHarness />);

        const rail = screen.getByRole("group", { name: "Type options" });
        const zooChip = within(rail).getByRole("button", { name: "Zoo" });
        const initialOrder = within(rail).getAllByRole("button").map(button => button.textContent);
        rail.scrollLeft = 40;

        await user.click(zooChip);

        expect(screen.getByTestId("selected-types")).toHaveTextContent("Zoo");
        expect(zooChip).toHaveAttribute("aria-pressed", "true");
        expect(within(rail).getAllByRole("button").map(button => button.textContent)).toEqual(initialOrder);
        expect(rail).toHaveProperty("scrollLeft", 40);
        const selectionStatus = screen.getByText("1 Selected");
        expect(screen.getByRole("heading", { name: "Type" })).toHaveTextContent(/^Type$/);
        expect(selectionStatus.compareDocumentPosition(rail) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(screen.getByRole("button", { name: "View all 5 Type options, 1 selected" })).toHaveTextContent("5");
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        await user.click(zooChip);
        expect(screen.getByTestId("selected-types")).toBeEmptyDOMElement();
        expect(zooChip).toHaveAttribute("aria-pressed", "false");
        expect(within(rail).getAllByRole("button").map(button => button.textContent)).toEqual(initialOrder);
        expect(rail).toHaveProperty("scrollLeft", 40);
        expect(screen.queryByText("1 Selected")).not.toBeInTheDocument();
    });

    it("opens the picker from the browse button", async () => {
        const user = userEvent.setup();
        render(<TestHarness />);

        await user.click(screen.getByRole("button", { name: "View all 5 Type options" }));
        expect(await screen.findByRole("dialog", { name: "Select Type" })).toBeInTheDocument();
    });

    it("uses a centered rule legend and fixed selection status in fieldset layout", async () => {
        const user = userEvent.setup();
        render(<TestHarness layout="fieldset" />);

        const label = screen.getByText("Type");
        const legend = label.closest("legend");
        const fieldset = label.closest("fieldset");
        const rail = screen.getByRole("group", { name: "Type options" });

        expect(legend).toHaveClass("w-full", "p-0");
        expect(fieldset).toHaveClass("border-0", "bg-transparent", "p-0");
        expect(legend?.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);

        await user.click(within(rail).getByRole("button", { name: "Zoo" }));

        expect(screen.getByText("1 Selected")).toHaveClass("whitespace-nowrap");
        for (const rule of legend?.querySelectorAll('[aria-hidden="true"]') ?? []) {
            expect(rule).toHaveClass("bg-primary/40");
        }
    });
});