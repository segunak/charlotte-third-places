import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterQuickSearch, FilterSelect, FilterResetButton } from "@/components/FilterUtilities";
import { 
    QuickSearchContext, 
    FiltersContext, 
    SortContext, 
    FilterDataContext 
} from "@/contexts/FilterContext";
import { DEFAULT_FILTER_CONFIG } from "@/lib/filters";
import type { FilterConfig, FilterKey } from "@/lib/filters";
import { DEFAULT_SORT_OPTION } from "@/lib/types";

// Mock the useIsMobile hook
vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

// Helper to create a mock filter context
function createMockFilterContext(overrides: Partial<{
    quickFilterText: string;
    setQuickFilterText: (value: string) => void;
    filters: FilterConfig;
    setFilters: (filters: Partial<FilterConfig> | ((prev: FilterConfig) => FilterConfig)) => void;
    getDistinctValues: (field: FilterKey) => string[];
    resetFilters: () => void;
    setSortOption: (option: { field: string; direction: string }) => void;
    sortOption: { field: string; direction: string };
}> = {}) {
    return {
        quickFilterText: "",
        setQuickFilterText: vi.fn(),
        filters: { ...DEFAULT_FILTER_CONFIG },
        setFilters: vi.fn(),
        getDistinctValues: vi.fn().mockReturnValue(["Option A", "Option B", "Option C"]),
        resetFilters: vi.fn(),
        setSortOption: vi.fn(),
        sortOption: DEFAULT_SORT_OPTION,
        filteredPlaces: [],
        places: [],
        ...overrides,
    };
}

function renderWithContext(
    component: React.ReactNode,
    contextValue: ReturnType<typeof createMockFilterContext>
) {
    return render(
        <QuickSearchContext.Provider value={{ 
            quickFilterText: contextValue.quickFilterText, 
            setQuickFilterText: contextValue.setQuickFilterText as React.Dispatch<React.SetStateAction<string>>
        }}>
            <FiltersContext.Provider value={{ 
                filters: contextValue.filters, 
                setFilters: contextValue.setFilters as React.Dispatch<React.SetStateAction<FilterConfig>>
            }}>
                <SortContext.Provider value={{ 
                    sortOption: contextValue.sortOption as any, 
                    setSortOption: contextValue.setSortOption as any 
                }}>
                    <FilterDataContext.Provider value={{ 
                        getDistinctValues: contextValue.getDistinctValues 
                    }}>
                        {component}
                    </FilterDataContext.Provider>
                </SortContext.Provider>
            </FiltersContext.Provider>
        </QuickSearchContext.Provider>
    );
}

describe("FilterQuickSearch", () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders with correct initial value from context", () => {
        const contextValue = createMockFilterContext({ quickFilterText: "initial search" });
        renderWithContext(<FilterQuickSearch />, contextValue);

        const input = screen.getByRole("textbox");
        expect(input).toHaveValue("initial search");
    });

    it("updates local state immediately on input", async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        const setQuickFilterText = vi.fn();
        const contextValue = createMockFilterContext({ setQuickFilterText });
        renderWithContext(<FilterQuickSearch />, contextValue);

        const input = screen.getByRole("textbox");
        await user.type(input, "test");

        // Local state updates immediately - input shows value right away
        expect(input).toHaveValue("test");
    });

    it("debounces context update by 150ms", async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        const setQuickFilterText = vi.fn();
        const contextValue = createMockFilterContext({ setQuickFilterText });
        renderWithContext(<FilterQuickSearch />, contextValue);

        const input = screen.getByRole("textbox");
        await user.type(input, "abc");

        // Context should not be updated immediately
        expect(setQuickFilterText).not.toHaveBeenCalled();

        // Advance timers past debounce threshold
        await act(async () => {
            vi.advanceTimersByTime(200);
        });

        // Now context should be updated
        await waitFor(() => {
            expect(setQuickFilterText).toHaveBeenCalledWith("abc");
        });
    });

    it("syncs local state when context resets externally", async () => {
        const contextValue = createMockFilterContext({ quickFilterText: "initial" });
        const { rerender } = renderWithContext(<FilterQuickSearch />, contextValue);

        const input = screen.getByRole("textbox");
        expect(input).toHaveValue("initial");

        // Simulate external reset - context value changes
        const resetContextValue = createMockFilterContext({ quickFilterText: "" });
        rerender(
            <QuickSearchContext.Provider value={{ 
                quickFilterText: resetContextValue.quickFilterText, 
                setQuickFilterText: resetContextValue.setQuickFilterText as React.Dispatch<React.SetStateAction<string>>
            }}>
                <FiltersContext.Provider value={{ 
                    filters: resetContextValue.filters, 
                    setFilters: resetContextValue.setFilters as React.Dispatch<React.SetStateAction<FilterConfig>>
                }}>
                    <SortContext.Provider value={{ 
                        sortOption: resetContextValue.sortOption as any, 
                        setSortOption: resetContextValue.setSortOption as any 
                    }}>
                        <FilterDataContext.Provider value={{ 
                            getDistinctValues: resetContextValue.getDistinctValues 
                        }}>
                            <FilterQuickSearch />
                        </FilterDataContext.Provider>
                    </SortContext.Provider>
                </FiltersContext.Provider>
            </QuickSearchContext.Provider>
        );

        // Local state should sync with the new context value
        expect(input).toHaveValue("");
    });

    it("renders search icon", () => {
        const contextValue = createMockFilterContext();
        renderWithContext(<FilterQuickSearch />, contextValue);

        // The search icon should be present (svg with pointer-events-none)
        const icon = document.querySelector("svg.pointer-events-none");
        expect(icon).toBeInTheDocument();
    });
});

describe("FilterSelect", () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const defaultProps = {
        field: "placeType" as FilterKey,
        value: "all",
        label: "Place Type",
        placeholder: "All Places",
        predefinedOrder: ["Coffee Shop", "Library", "Park"],
    };

    it("renders with correct placeholder when value is 'all'", () => {
        const contextValue = createMockFilterContext();
        renderWithContext(<FilterSelect {...defaultProps} />, contextValue);

        expect(screen.getByText("All Places")).toBeInTheDocument();
    });

    it("renders with selected value when not 'all'", () => {
        const contextValue = createMockFilterContext();
        renderWithContext(
            <FilterSelect {...defaultProps} value="Coffee Shop" />,
            contextValue
        );

        expect(screen.getByText("Coffee Shop")).toBeInTheDocument();
    });

    it("renders combobox trigger", () => {
        const contextValue = createMockFilterContext();
        renderWithContext(<FilterSelect {...defaultProps} />, contextValue);

        // Should render as a combobox
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
});

describe("FilterSelect - desktopPicker behavior", () => {
    /**
     * Tests for the virtualized dropdown optimization.
     * 
     * ALL desktop fields now use VirtualizedSelect for consistent performance.
     * This uses virtua virtualization to render only visible items
     * instead of rendering all items at once.
     * 
     * VirtualizedSelect is built on Radix Select with role="combobox".
     */

    it("uses virtualized select for all desktop fields (name)", () => {
        const contextValue = createMockFilterContext();
        renderWithContext(
            <FilterSelect
                field="name"
                value="all"
                label="Name"
                placeholder="All Names"
                predefinedOrder={[]}
            />,
            contextValue
        );

        // All desktop fields use VirtualizedSelect with role="combobox"
        const trigger = screen.getByRole("combobox");
        expect(trigger).toBeInTheDocument();
        expect(trigger).toHaveTextContent(/all names/i);
    });

    it("uses virtualized select for all desktop fields (neighborhood)", () => {
        const contextValue = createMockFilterContext();
        renderWithContext(
            <FilterSelect
                field="neighborhood"
                value="all"
                label="Neighborhood"
                placeholder="All Neighborhoods"
                predefinedOrder={[]}
            />,
            contextValue
        );

        const trigger = screen.getByRole("combobox");
        expect(trigger).toBeInTheDocument();
        expect(trigger).toHaveTextContent(/all neighborhoods/i);
    });

    it("uses virtualized select for all desktop fields (type)", () => {
        const contextValue = createMockFilterContext();
        renderWithContext(
            <FilterSelect
                field="type"
                value="all"
                label="Type"
                placeholder="All Types"
                predefinedOrder={[]}
            />,
            contextValue
        );

        const trigger = screen.getByRole("combobox");
        expect(trigger).toBeInTheDocument();
        expect(trigger).toHaveTextContent(/all types/i);
    });

    it("uses virtualized select for all desktop fields (tags)", () => {
        const contextValue = createMockFilterContext();
        renderWithContext(
            <FilterSelect
                field="tags"
                value="all"
                label="Tag"
                placeholder="All Tags"
                predefinedOrder={[]}
            />,
            contextValue
        );

        const trigger = screen.getByRole("combobox");
        expect(trigger).toBeInTheDocument();
        expect(trigger).toHaveTextContent(/all tags/i);
    });

    it("uses virtualized select for all desktop fields (parking)", () => {
        const contextValue = createMockFilterContext();
        renderWithContext(
            <FilterSelect 
                field="parking" 
                value="all" 
                label="Parking" 
                placeholder="All Parking"
                predefinedOrder={["Free", "Paid"]}
            />, 
            contextValue
        );

        // All desktop fields use VirtualizedSelect with role="combobox"
        const trigger = screen.getByRole("combobox");
        expect(trigger).toBeInTheDocument();
    });

    it("uses virtualized select for all desktop fields (size)", () => {
        const contextValue = createMockFilterContext();
        renderWithContext(
            <FilterSelect 
                field="size" 
                value="all" 
                label="Size" 
                placeholder="All Sizes"
                predefinedOrder={[]}
            />, 
            contextValue
        );

        const trigger = screen.getByRole("combobox");
        expect(trigger).toBeInTheDocument();
    });
});

describe("FilterResetButton", () => {
    it("calls filter reset functions when clicked", async () => {
        const user = userEvent.setup();
        const setFilters = vi.fn();
        const setQuickFilterText = vi.fn();
        const setSortOption = vi.fn();
        const contextValue = createMockFilterContext({ 
            setFilters, 
            setQuickFilterText,
            setSortOption 
        });
        renderWithContext(<FilterResetButton variant="default" />, contextValue);

        const button = screen.getByRole("button", { name: /reset/i });
        await user.click(button);

        expect(setFilters).toHaveBeenCalled();
        expect(setQuickFilterText).toHaveBeenCalledWith("");
        expect(setSortOption).toHaveBeenCalled();
    });

    it("renders with correct text", () => {
        const contextValue = createMockFilterContext();
        renderWithContext(<FilterResetButton variant="default" />, contextValue);

        expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
    });

    it("can be disabled", () => {
        const contextValue = createMockFilterContext();
        renderWithContext(<FilterResetButton variant="default" disabled />, contextValue);

        expect(screen.getByRole("button", { name: /reset/i })).toBeDisabled();
    });
});
