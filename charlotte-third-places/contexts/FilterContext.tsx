"use client";

import { createContext, useCallback, useMemo, useContext, ReactNode, useReducer } from "react";
import { DEFAULT_SORT_OPTION, SortOption } from "@/lib/types";
import { DEFAULT_FILTER_CONFIG, FILTER_DEFS, FilterConfig, FilterKey } from "@/lib/filters";

// ============================================================================
// CONSOLIDATED REDUCER - Single state update for atomic operations
// ============================================================================

interface FilterState {
    filters: FilterConfig;
    quickFilterText: string;
    sortOption: SortOption;
}

type FilterAction =
    | { type: 'SET_FILTERS'; payload: FilterConfig | ((prev: FilterConfig) => FilterConfig) }
    | { type: 'SET_QUICK_SEARCH'; payload: string }
    | { type: 'SET_SORT'; payload: SortOption }
    | { type: 'RESET_ALL' };

const initialState: FilterState = {
    filters: DEFAULT_FILTER_CONFIG,
    quickFilterText: "",
    sortOption: DEFAULT_SORT_OPTION,
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
    switch (action.type) {
        case 'SET_FILTERS':
            return {
                ...state,
                filters: typeof action.payload === 'function'
                    ? action.payload(state.filters)
                    : action.payload,
            };
        case 'SET_QUICK_SEARCH':
            return { ...state, quickFilterText: action.payload };
        case 'SET_SORT':
            return { ...state, sortOption: action.payload };
        case 'RESET_ALL':
            return initialState;
        default:
            return state;
    }
}

// ============================================================================
// GRANULAR CONTEXTS - Use these for optimal performance
// ============================================================================

/**
 * FilterDataContext: Pre-computed distinct values for filter dropdowns.
 * Changes only when places array changes (essentially static after initial load).
 */
interface FilterDataContextType {
    getDistinctValues: (field: FilterKey) => string[];
}

export const FilterDataContext = createContext<FilterDataContextType>({
    getDistinctValues: () => [],
});

/**
 * FiltersContext: Active filter selections.
 * Changes when user selects a filter option.
 */
interface FiltersContextType {
    filters: FilterConfig;
    setFilters: React.Dispatch<React.SetStateAction<FilterConfig>>;
}

export const FiltersContext = createContext<FiltersContextType>({
    filters: DEFAULT_FILTER_CONFIG,
    setFilters: () => { },
});

/**
 * QuickSearchContext: Quick search text input.
 * Changes frequently as user types (most volatile context).
 */
interface QuickSearchContextType {
    quickFilterText: string;
    setQuickFilterText: (value: string) => void;
}

export const QuickSearchContext = createContext<QuickSearchContextType>({
    quickFilterText: "",
    setQuickFilterText: () => { },
});

/**
 * SortContext: Sort option selection.
 * Changes when user changes sort order.
 */
interface SortContextType {
    sortOption: SortOption;
    setSortOption: (value: SortOption) => void;
}

export const SortContext = createContext<SortContextType>({
    sortOption: DEFAULT_SORT_OPTION,
    setSortOption: () => { },
});

// ============================================================================
// CONVENIENCE HOOKS - Use granular contexts directly for best performance
// ============================================================================

/** Hook for components that only need filter data (distinct values) */
export const useFilterData = () => useContext(FilterDataContext);

/** Hook for components that only need filter selections */
export const useFilters = () => useContext(FiltersContext);

/** Hook for components that only need quick search */
export const useQuickSearch = () => useContext(QuickSearchContext);

/** Hook for components that only need sort options */
export const useSort = () => useContext(SortContext);

// ============================================================================
// ACTIONS CONTEXT - Single dispatch for atomic operations
// ============================================================================

interface FilterActionsContextType {
    resetAll: () => void;
}

export const FilterActionsContext = createContext<FilterActionsContextType>({
    resetAll: () => { },
});

/** Hook for components that need filter actions (reset, etc.) */
export const useFilterActions = () => useContext(FilterActionsContext);

// ============================================================================
// PROVIDER COMPONENT - Nests all granular providers
// ============================================================================

/**
 * Pre-computed distinct values for each filter field.
 * Keyed only by places array to avoid recalculation on filter changes.
 */
type DistinctValuesCache = Record<FilterKey, string[]>;

export const FilterProvider = ({
    children,
    places,
}: {
    children: ReactNode;
    places: Array<any>;
}) => {
    // Consolidated state using reducer - single update for atomic operations like reset
    const [state, dispatch] = useReducer(filterReducer, initialState);
    const { filters, quickFilterText, sortOption } = state;

    // Stable setter functions that wrap dispatch for backward compatibility with granular contexts
    const setFilters = useCallback(
        (value: FilterConfig | ((prev: FilterConfig) => FilterConfig)) => {
            dispatch({ type: 'SET_FILTERS', payload: value });
        },
        []
    );

    const setQuickFilterText = useCallback(
        (value: string) => {
            dispatch({ type: 'SET_QUICK_SEARCH', payload: value });
        },
        []
    );

    const setSortOption = useCallback(
        (value: SortOption) => {
            dispatch({ type: 'SET_SORT', payload: value });
        },
        []
    );

    const resetAll = useCallback(() => {
        dispatch({ type: 'RESET_ALL' });
    }, []);

    // Pre-compute distinct values for ALL filter fields once when places change.
    // This eliminates repeated computation on every filter interaction (was causing 536-824ms INP).
    const distinctValuesCache = useMemo<DistinctValuesCache>(() => {
        const cache = {} as DistinctValuesCache;
        
        for (const def of FILTER_DEFS) {
            const field = def.key as FilterKey;
            const rawValues: string[] = places
                .map((p: any) => def.accessor(p))
                .flat()
                .filter((v: any) => typeof v === 'string' && v.length > 0);

            let distinctValues = Array.from(new Set(rawValues));
            
            // If allowedValues is defined, filter to only include those values (allowlist)
            if (def.allowedValues && def.allowedValues.length > 0) {
                const allowedSet = new Set(def.allowedValues);
                distinctValues = distinctValues.filter(v => allowedSet.has(v));
            }
            
            const predefinedOrder = def.predefinedOrder ?? [];

            cache[field] = distinctValues.sort((a, b) => {
                if (predefinedOrder.length === 0) return a.localeCompare(b);
                const ia = predefinedOrder.indexOf(a);
                const ib = predefinedOrder.indexOf(b);
                if (ia === -1 && ib === -1) return a.localeCompare(b);
                if (ia === -1) return 1;
                if (ib === -1) return -1;
                return ia - ib;
            });
        }
        
        return cache;
    }, [places]);

    // Simple lookup function that uses the pre-computed cache
    const getDistinctValues = useCallback(
        (field: FilterKey) => {
            return distinctValuesCache[field] ?? [];
        },
        [distinctValuesCache]
    );

    // Memoized context values for each granular context
    const filterDataValue = useMemo(
        () => ({ getDistinctValues }),
        [getDistinctValues]
    );

    const filtersValue = useMemo(
        () => ({ filters, setFilters }),
        [filters, setFilters]
    );

    const quickSearchValue = useMemo(
        () => ({ quickFilterText, setQuickFilterText }),
        [quickFilterText, setQuickFilterText]
    );

    const sortValue = useMemo(
        () => ({ sortOption, setSortOption }),
        [sortOption, setSortOption]
    );

    const actionsValue = useMemo(
        () => ({ resetAll }),
        [resetAll]
    );

    // Nesting order (outermost to innermost): FilterDataContext → FiltersContext → QuickSearchContext → SortContext → ActionsContext
    // This puts the least-frequently-changing context outermost.
    return (
        <FilterDataContext.Provider value={filterDataValue}>
            <FiltersContext.Provider value={filtersValue}>
                <QuickSearchContext.Provider value={quickSearchValue}>
                    <SortContext.Provider value={sortValue}>
                        <FilterActionsContext.Provider value={actionsValue}>
                            {children}
                        </FilterActionsContext.Provider>
                    </SortContext.Provider>
                </QuickSearchContext.Provider>
            </FiltersContext.Provider>
        </FilterDataContext.Provider>
    );
};
