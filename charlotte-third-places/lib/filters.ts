// Centralized filtering domain: definitions, configuration, and predicate helpers.
// This file owns all filter-related constructs so other modules only need to import from here.
import { Place, SortField, SortDirection } from "./types";

// A single sentinel value meaning "no constraint" for a filter field.
export const FILTER_SENTINEL = 'all';

export type FilterValueType = 'scalar' | 'array';

export interface FilterOption {
    value: string;              // Currently selected value or the sentinel meaning no constraint
    placeholder: string;        // UI placeholder label
    label: string;              // Human readable filter label
    predefinedOrder: string[];  // Optional explicit ordering for distinct values
}

export interface FilterDefinition {
    key: string;                        // Unique key used across config, UI, and predicate
    label: string;                      // Label displayed to users
    placeholder: string;                // Placeholder text when sentinel selected
    predefinedOrder?: string[];         // Fixed ordering for distinct values if needed
    allowedValues?: string[];           // When present, restricts which values are shown (allowlist)
    valueType: FilterValueType;         // Indicates whether accessor returns a scalar or string[]
    mobilePicker: boolean;              // Drives whether mobile uses custom searchable picker
    useChips: boolean;                  // If true, mobile displays inline chips instead of picker/select
    desktopPicker?: boolean;            // If true, uses searchable picker on desktop (for ultra-high cardinality)
    accessor: (p: Place) => string | string[]; // Function to extract raw value(s) from a Place
}

export const FILTER_DEFS: readonly FilterDefinition[] = [
    {
        key: 'name',
        label: 'Name',
        placeholder: 'Name',
        valueType: 'scalar',
        mobilePicker: true,
        useChips: false,
        desktopPicker: false,
        accessor: p => p.name
    },
    {
        key: 'neighborhood',
        label: 'Neighborhood',
        placeholder: 'Neighborhood',
        valueType: 'scalar',
        mobilePicker: true,
        desktopPicker: false,
        useChips: false,
        accessor: p => p.neighborhood
    },
    {
        key: 'type',
        label: 'Type',
        placeholder: 'Type',
        valueType: 'array',
        mobilePicker: true,
        desktopPicker: false,
        useChips: false,
        accessor: p => p.type
    },
    {
        key: 'tags',
        label: 'Tag',
        placeholder: 'Tag',
        valueType: 'array',
        mobilePicker: true,
        desktopPicker: false,
        useChips: false,
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
        mobilePicker: true,
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
        useChips: true,
        accessor: p => p.hasCinnamonRolls
    },
] as const;

export type FilterKey = typeof FILTER_DEFS[number]['key'];
export type FilterConfig = { [K in FilterKey]: FilterOption };

export const DEFAULT_FILTER_CONFIG: FilterConfig = FILTER_DEFS.reduce((acc, def) => {
    acc[def.key as FilterKey] = {
        value: FILTER_SENTINEL,
        placeholder: def.placeholder,
        label: def.label,
        predefinedOrder: def.predefinedOrder ?? [],
    };
    return acc;
}, {} as Record<FilterKey, FilterOption>);

export const FILTER_DEFINITION_MAP: Record<FilterKey, FilterDefinition> = FILTER_DEFS.reduce((m, d) => {
    m[d.key as FilterKey] = d; return m;
}, {} as Record<FilterKey, FilterDefinition>);

export const MOBILE_PICKER_FIELDS: Set<string> = new Set(
    FILTER_DEFS.filter(d => d.mobilePicker).map(d => d.key)
);

// Fields that use searchable picker on desktop (ultra-high cardinality)
export const DESKTOP_PICKER_FIELDS: Set<string> = new Set(
    FILTER_DEFS.filter(d => d.desktopPicker).map(d => d.key)
);

export const MOBILE_CHIP_FIELDS: Set<string> = new Set(
    FILTER_DEFS.filter(d => d.useChips).map(d => d.key)
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
 * Each filter uses the convention value === FILTER_SENTINEL => ignore.
 */
export function placeMatchesFilters(place: Place, filters: FilterConfig): boolean {
    for (const def of FILTER_DEFS) {
        const current = filters[def.key as FilterKey];
        const selected = current.value;
        if (selected === FILTER_SENTINEL) continue; // no constraint
        const raw = def.accessor(place);
        const values = Array.isArray(raw) ? raw : [raw];
        if (!values.includes(selected)) return false;
    }
    return true;
}

/**
 * Convenience helper to filter an array of places.
 */
export function filterPlaces(places: Place[], filters: FilterConfig): Place[] {
    return places.filter(p => placeMatchesFilters(p, filters));
}
