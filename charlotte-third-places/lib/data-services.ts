import fs from 'fs';
import path from 'path';
import Airtable from 'airtable';
import csvParser from 'csv-parser';
import { Place } from '@/lib/types';
import stripBomStream from 'strip-bom-stream';
import { parse, parseISO, isValid } from "date-fns";

const base = new Airtable({
    apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN
}).base('apptV6h58vA4jhWFg');

/**
 * Determines whether to use local data or production data.
 * Returns true for local data, false for production data.
 * 
 * @returns {boolean} True if should use local data, false for production data
 */
const shouldUseLocalData = (): boolean => {
    // Check if we should force production data (even in development)
    if (process.env.FORCE_PRODUCTION_DATA === 'true') {
        console.log('Info: Using production data (forced via FORCE_PRODUCTION_DATA).');
        return false;
    }

    // Default development behavior: use local data
    if (process.env.NODE_ENV === 'development') {
        console.log('Info: Local development mode. Using CSV data for places.');
        return true;
    }

    // Production environment always uses production data
    return false;
};

function isAirtableNotFoundError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const maybeError = error as { error?: string; statusCode?: number; message?: string };
    return maybeError.statusCode === 404
        || maybeError.error === 'NOT_FOUND'
        || /not[_\s-]?found|could not find/i.test(maybeError.message ?? '');
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

export function parsePhotoUrlArray(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.filter(isNonEmptyString);
    }

    if (typeof value !== 'string' || value.trim().length === 0) return [];

    try {
        const parsedValue = JSON.parse(value);
        return Array.isArray(parsedValue) ? parsedValue.filter(isNonEmptyString) : [];
    } catch {
        return [];
    }
}

/**
 * Parses a date string and returns a `Date` object.
 * - Uses `parseISO()` for ISO 8601 dates (Airtable).
 * - Uses `parse()` for CSV format (`M/d/yyyy h:mma`).
 * - Returns `null` if parsing fails.
 * 
 * @param dateStr - The date string to parse.
 * @returns A `Date` object or `null` if parsing fails.
 */
function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    try {
        // First, try ISO 8601 (Airtable format for dates)
        const isoDate = parseISO(dateStr);
        if (isValid(isoDate)) return isoDate;

        // If that fails, try CSV format ("M/d/yyyy h:mma")
        if (/^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}(am|pm)$/i.test(dateStr)) {
            const csvDate = parse(dateStr, "M/d/yyyy h:mma", new Date());
            return isValid(csvDate) ? csvDate : null;
        }

        return null; // If no known format matches, return `null`
    } catch {
        return null;
    }
}

/**
 * Maps a record (either from Airtable or CSV) to a Place object.
 * 
 * @param record - The record to map, either an Airtable record or a CSV row.
 * @param isCSV - A boolean indicating whether the record is from a CSV file.
 * @returns A Place object.
 */
const mapRecordToPlace = (record: any, isCSV: boolean = false): Place => {
    const getField = (key: string): any => {
        if (isCSV) {
            const value = record[key];
            if (["Type", "Tags", "Parking"].includes(key)) {
                // Split comma-separated list, trim whitespace, drop empty tokens, and deduplicate while preserving order
                if (!value) return [];
                return value
                    .split(',')
                    .map((item: string) => item.trim())
                    .filter((item: string) => item.length > 0)
                    .filter((item: string, idx: number, arr: string[]) => arr.indexOf(item) === idx);
            }
            if (key === "Photos") {
                return parsePhotoUrlArray(value);
            }
            if (key === "Operating Hours") {
                if (!value) return [];
                try { return JSON.parse(value); } catch { return []; }
            }
            if (["Latitude", "Longitude"].includes(key)) {
                return parseFloat(value);
            }
            if (["Created Time", "Last Modified Time"].includes(key)) {
                return parseDate(value);
            }
            if (key === "Featured") {
                // For CSV: "checked" = true, empty/other = false
                return value?.toLowerCase() === "checked";
            }
            return value;
        } else {
            // For Airtable records
            const value = record.get(key);

            // Special handling for Photos from Airtable
            if (key === "Photos") {
                return parsePhotoUrlArray(value);
            }

            // Parse Operating Hours JSON array from Airtable
            if (key === "Operating Hours") {
                if (!value) return [];
                if (Array.isArray(value)) return value;
                try { return JSON.parse(value); } catch { return []; }
            }

            // For Featured field from Airtable (boolean checkbox)
            if (key === "Featured") {
                return Boolean(value);
            }

            return value;
        }
    };

    return {
        // CSV exports always include the real Airtable Record ID.
        recordId: isCSV ? record["Record ID"] : record.id,
        name: getField("Place"),
        operational: getField("Operational"),
        type: getField("Type"),
        size: getField("Size"),
        tags: getField("Tags"),
        neighborhood: getField("Neighborhood"),
        address: getField("Address"),
        purchaseRequired: getField("Purchase Required"),
        parking: getField("Parking"),
        freeWiFi: getField("Free Wi-Fi"),
        hasCinnamonRolls: getField("Has Cinnamon Rolls"),
        hasReviews: getField("Has Data File"),
        featured: getField("Featured"),
        description: getField("Description"),
        website: getField("Website"),
        tiktok: getField("TikTok"),
        instagram: getField("Instagram"),
        youtube: getField("YouTube"),
        facebook: getField("Facebook"),
        twitter: getField("Twitter"),
        linkedIn: getField("LinkedIn"),
        googleMapsPlaceId: getField("Google Maps Place Id"),
        googleMapsProfileURL: getField("Google Maps Profile URL"),
        appleMapsProfileURL: getField("Apple Maps Profile URL"),
        photos: getField("Photos"),
        comments: getField("Comments"),
        operatingHours: getField("Operating Hours"),
        latitude: getField("Latitude"),
        longitude: getField("Longitude"),
        createdDate: getField("Created Time"),
        lastModifiedDate: getField("Last Modified Time"),
    };
};

/**
 * Reads and parses CSV data from a given file name (relative path),
 * converts each row into a `Place` object, and returns an array of `Place`.
 * 
 * @param {string} filePath - The relative path to the CSV file.
 * @returns {Promise<Place[]>} Promise that resolves to an array of Place objects.
 */
const getPlacesFromCSV = async (filePath: string): Promise<Place[]> => {
    const localDataPath = path.resolve(filePath);
    const places: Place[] = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(localDataPath)
            .pipe(stripBomStream())
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    places.push(mapRecordToPlace(row, true));
                } catch (error) {
                    console.warn(`Failed to parse row: ${JSON.stringify(row)}. Error: ${error}`);
                }
            })
            .on('end', () => resolve(places))
            .on('error', (error) => reject(error));
    });
};

/**
 * Fetch a single place by ID. In development, it uses local data from CSV;
 * otherwise, it fetches from Airtable.
 * 
 * @param {string} id - The ID of the place to fetch.
 * @returns {Promise<Place | undefined>} A promise that resolves to the requested place, or `undefined` if not found.
 * @throws {Error} Throws an error if fetching the place fails.
 */
export async function getPlaceById(id: string) {
    const useLocalData = shouldUseLocalData();

    try {
        if (useLocalData) {
            const localData = await getPlacesFromCSV('./local-data/Charlotte Third Places-Production.csv');
            return localData.find((place) => place.recordId === id);
        }

        const record = await base('Charlotte Third Places').find(id);
        return mapRecordToPlace(record);
    } catch (error) {
        if (!useLocalData && isAirtableNotFoundError(error)) {
            return undefined;
        }

        console.error(`Failed to fetch place with ID ${id}:`, error);
        throw new Error(`Failed to fetch place with ID ${id}`);
    }
}

/**
 * Fetches a list of places from the data source.
 * 
 * If the environment is set to 'development', it uses data from a CSV file.
 * Otherwise, it fetches data from an Airtable base.
 *
 * IMPORTANT: Returns RAW places without dynamic tags (Open Late, Open Early).
 * Dynamic tags depend on the visitor's current day-of-week and must be computed
 * client-side. For enriched places in list/browse views, use the usePlaces() hook
 * from FilterContext. For single place detail pages, call injectDynamicTags() directly.
 * 
 * @returns {Promise<Place[]>} A promise that resolves to an array of Place objects.
 * @throws {Error} Throws an error if fetching places fails.
 */
export async function getPlaces(): Promise<Place[]> {
    try {
        if (shouldUseLocalData()) {
            const localData = await getPlacesFromCSV('./local-data/Charlotte Third Places-Production.csv');
            return localData;
        }

        // Get places from Airtable
        const records = await base('Charlotte Third Places')
            .select({ view: 'Production' })
            .all();

        return records.map((record) => mapRecordToPlace(record));
    } catch (error) {
        console.error('Failed to fetch places:', error);
        throw new Error('Failed to fetch places');
    }
}
