// Centralized filtering domain: definitions, configuration, and predicate helpers.
// This file owns all filter-related constructs so other modules only need to import from here.
import { Place, SortField, SortDirection, SortOption } from "./types";

// A single sentinel value meaning "no constraint" for a filter field.
export const FILTER_SENTINEL = 'all';

export type FilterValueType = 'scalar' | 'array';
export type MatchMode = 'and' | 'or';

export interface FilterOption {
    value: string | string[];   // Selected value(s): string for single-select, string[] for multi-select
    placeholder: string;        // UI placeholder label
    label: string;              // Human readable filter label
    predefinedOrder: string[];  // Optional explicit ordering for distinct values
    matchMode?: MatchMode;      // For multi-select: 'and' (must match all) or 'or' (match any)
}

export interface FilterDefinition {
    key: string;                        // Unique key used across config, UI, and predicate
    label: string;                      // Label displayed to users
    placeholder: string;                // Placeholder text when sentinel selected
    predefinedOrder?: string[];         // Fixed ordering for distinct values if needed
    allowedValues?: string[];           // When present, restricts which values are shown (allowlist)
    valueType: FilterValueType;         // Indicates whether accessor returns a scalar or string[]
    mobilePicker: boolean;              // Drives whether mobile uses custom searchable picker
    desktopPicker: boolean;             // If true, desktop uses SearchablePickerModal instead of VirtualizedSelect
    useChips: boolean;                  // If true, mobile displays inline chips instead of picker/select
    multiSelect?: boolean;              // If true, filter accepts multiple values (OR logic)
    accessor: (p: Place) => string | string[]; // Function to extract raw value(s) from a Place
}

export const FILTER_DEFS: readonly FilterDefinition[] = [
    {
        key: 'name',
        label: 'Name',
        placeholder: 'Name',
        valueType: 'scalar',
        mobilePicker: true,
        desktopPicker: true,
        useChips: false,
        accessor: p => p.name
    },
    {
        key: 'neighborhood',
        label: 'Neighborhood',
        placeholder: 'Neighborhood',
        valueType: 'scalar',
        mobilePicker: true,
        desktopPicker: true,
        useChips: false,
        accessor: p => p.neighborhood
    },
    {
        key: 'type',
        label: 'Type',
        placeholder: 'Type',
        valueType: 'array',
        mobilePicker: true,
        desktopPicker: true,
        useChips: false,
        accessor: p => p.type
    },
    {
        key: 'tags',
        label: 'Tag',
        placeholder: 'Tags',
        valueType: 'array',
        mobilePicker: true,
        desktopPicker: true,
        useChips: false,
        multiSelect: true,
        accessor: p => p.tags
    },
    {
        key: 'parking',
        label: 'Parking',
        placeholder: 'Parking',
        predefinedOrder: ['Free', 'Paid'],
        allowedValues: ['Free', 'Paid'],
        valueType: 'array',
        mobilePicker: false,
        desktopPicker: false,
        useChips: true,
        accessor: p => p.parking
    },
    {
        key: 'freeWiFi',
        label: 'Free Wi-Fi',
        placeholder: 'Free Wi-Fi',
        predefinedOrder: ['Yes', 'No'],
        allowedValues: ['Yes', 'No'],
        valueType: 'scalar',
        mobilePicker: false,
        desktopPicker: false,
        useChips: true,
        accessor: p => p.freeWiFi
    },
    {
        key: 'purchaseRequired',
        label: 'Purchase Required',
        placeholder: 'Purchase Required',
        predefinedOrder: ['Yes', 'No'],
        valueType: 'scalar',
        mobilePicker: false,
        desktopPicker: false,
        useChips: true,
        accessor: p => p.purchaseRequired
    },
    {
        key: 'size',
        label: 'Size',
        placeholder: 'Size',
        predefinedOrder: ['Small', 'Medium', 'Large'],
        allowedValues: ['Small', 'Medium', 'Large'],
        valueType: 'scalar',
        mobilePicker: false,
        desktopPicker: false,
        useChips: true,
        accessor: p => p.size
    },
    {
        key: 'hasCinnamonRolls',
        label: 'Has Cinnamon Rolls',
        placeholder: 'Has Cinnamon Rolls',
        predefinedOrder: ['Yes', 'No', 'Sometimes'],
        allowedValues: ['Yes', 'No', 'Sometimes'],
        valueType: 'scalar',
        mobilePicker: false,
        desktopPicker: false,
        useChips: true,
        accessor: p => p.hasCinnamonRolls
    },
] as const;

export type FilterKey = typeof FILTER_DEFS[number]['key'];
export type FilterConfig = { [K in FilterKey]: FilterOption };

export const DEFAULT_FILTER_CONFIG: FilterConfig = FILTER_DEFS.reduce((acc, def) => {
    acc[def.key as FilterKey] = {
        value: def.multiSelect ? [] : FILTER_SENTINEL,
        placeholder: def.placeholder,
        label: def.label,
        predefinedOrder: def.predefinedOrder ?? [],
        matchMode: def.multiSelect ? 'and' : undefined, // Default to AND for multi-select
    };
    return acc;
}, {} as Record<FilterKey, FilterOption>);

export const FILTER_DEFINITION_MAP: Record<FilterKey, FilterDefinition> = FILTER_DEFS.reduce((m, d) => {
    m[d.key as FilterKey] = d; return m;
}, {} as Record<FilterKey, FilterDefinition>);

export const MOBILE_PICKER_FIELDS: Set<string> = new Set(
    FILTER_DEFS.filter(d => d.mobilePicker).map(d => d.key)
);

export const MOBILE_CHIP_FIELDS: Set<string> = new Set(
    FILTER_DEFS.filter(d => d.useChips).map(d => d.key)
);

export const DESKTOP_PICKER_FIELDS: Set<string> = new Set(
    FILTER_DEFS.filter(d => d.desktopPicker).map(d => d.key)
);

export const MULTI_SELECT_FIELDS: Set<string> = new Set(
    FILTER_DEFS.filter(d => d.multiSelect).map(d => d.key)
);

// Sort definitions for consistent sort options across the app
export interface SortDefinition {
    key: string;
    label: string;
    field: SortField;
    direction: SortDirection;
}

export const SORT_DEFS: readonly SortDefinition[] = [
    { key: 'name-asc', label: 'Name (A-Z)', field: SortField.Name, direction: SortDirection.Ascending },
    { key: 'name-desc', label: 'Name (Z-A)', field: SortField.Name, direction: SortDirection.Descending },
    { key: 'createdDate-asc', label: 'Date Added (Old to New)', field: SortField.DateAdded, direction: SortDirection.Ascending },
    { key: 'createdDate-desc', label: 'Date Added (New to Old)', field: SortField.DateAdded, direction: SortDirection.Descending },
    { key: 'lastModifiedDate-asc', label: 'Last Updated (Old to New)', field: SortField.LastModified, direction: SortDirection.Ascending },
    { key: 'lastModifiedDate-desc', label: 'Last Updated (New to Old)', field: SortField.LastModified, direction: SortDirection.Descending },
] as const;

// Sort uses mobile picker (6 options warrants a picker for better UX)
export const SORT_USES_MOBILE_PICKER = true;

/**
 * Returns true if a place passes all active filters in the provided FilterConfig.
 * - Single-select: value === FILTER_SENTINEL => ignore
 * - Multi-select: value === [] (empty array) => ignore; otherwise uses matchMode (default AND)
 */
export function placeMatchesFilters(place: Place, filters: FilterConfig): boolean {
    for (const def of FILTER_DEFS) {
        const current = filters[def.key as FilterKey];
        const selected = current.value;
        
        // Handle multi-select
        if (def.multiSelect) {
            // Defensive: ensure we have an array (could be 'all' if filter was reset incorrectly)
            if (!Array.isArray(selected) || selected.length === 0) continue; // no constraint
            const raw = def.accessor(place);
            const placeValues = Array.isArray(raw) ? raw : [raw];
            const matchMode = current.matchMode ?? 'and';
            if (matchMode === 'and') {
                // AND logic: place must have ALL of the selected values
                const hasAllMatches = selected.every(s => placeValues.includes(s));
                if (!hasAllMatches) return false;
            } else {
                // OR logic: place must have at least one of the selected values
                const hasAnyMatch = selected.some(s => placeValues.includes(s));
                if (!hasAnyMatch) return false;
            }
            continue;
        }
        
        // Handle single-select
        if (selected === FILTER_SENTINEL) continue; // no constraint
        const raw = def.accessor(place);
        const values = Array.isArray(raw) ? raw : [raw];
        if (!values.includes(selected as string)) return false;
    }
    return true;
}

/**
 * Convenience helper to filter an array of places.
 */
export function filterPlaces(places: Place[], filters: FilterConfig): Place[] {
    return places.filter(p => placeMatchesFilters(p, filters));
}

/**
 * Pre-computed sort item for efficient comparison.
 * Keys are computed once before sorting to avoid repeated operations.
 */
interface SortItem {
    place: Place;
    featured: boolean;
    sortKey: string | number;
}

/**
 * Sort places with featured-first priority, then by user-selected field and direction.
 * This is the canonical sort implementation used as fallback when Web Worker is unavailable.
 * 
 * Performance optimization: Pre-computes sort keys (lowercase strings, parsed dates)
 * ONCE before sorting to avoid repeated operations during comparisons.
 */
export function sortPlaces(places: Place[], sortOption: SortOption): Place[] {
    const { field, direction } = sortOption;
    const isAsc = direction === SortDirection.Ascending;
    const isNameField = field === SortField.Name;

    // Pre-compute sort keys ONCE for all items
    const items: SortItem[] = places.map((place) => {
        let sortKey: string | number;

        if (isNameField) {
            // Pre-compute lowercase string for name comparison
            sortKey = (place.name || '').toLowerCase();
        } else {
            // Pre-compute timestamp for date comparison
            const dateValue = place[field];
            if (dateValue instanceof Date) {
                sortKey = dateValue.getTime();
            } else if (typeof dateValue === 'string') {
                sortKey = new Date(dateValue).getTime();
            } else {
                sortKey = 0;
            }
        }

        return {
            place,
            featured: place.featured,
            sortKey,
        };
    });

    // Sort using pre-computed keys (fast comparisons)
    items.sort((a, b) => {
        // Featured places always come first
        if (a.featured !== b.featured) {
            return b.featured ? 1 : -1;
        }

        // Compare pre-computed sort keys
        if (isNameField) {
            const strA = a.sortKey as string;
            const strB = b.sortKey as string;
            const comparison = strA.localeCompare(strB);
            return isAsc ? comparison : -comparison;
        } else {
            const numA = a.sortKey as number;
            const numB = b.sortKey as number;
            return isAsc ? numA - numB : numB - numA;
        }
    });

    // Extract places back
    return items.map((item) => item.place);
}
