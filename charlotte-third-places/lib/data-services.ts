import fs from 'fs';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';
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

/**
 * Generates a SHA1 hash from a given URL string.
 * 
 * @param {string} url - The URL to hash.
 * @returns {string} The SHA1 hash of the URL.
 */
const generateHashFromURL = (url: string): string => {
    return crypto.createHash('sha1').update(url).digest('hex');
};

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
 * Sends a HEAD request to a given URL and extracts the file extension from the
 * `content-type` header. Defaults to 'jpg' if the extension cannot be determined.
 * 
 * @param {string} url - The URL of the image.
 * @param {string} placeName - The name of the place associated with this image (used for logging).
 * @returns {Promise<string>} A promise that resolves to the file extension (e.g., "jpeg" or "jpg").
 */
const getImageExtension = async (url: string, placeName: string): Promise<string> => {
    try {
        const headResponse = await axios.head(url);
        const contentType = headResponse.headers['content-type'];
        const extension = contentType.split('/')[1]; // e.g., "image/jpeg" -> "jpeg"
        return extension || 'jpg'; // Default to 'jpg' if no extension found
    } catch (error) {
        console.warn(`Failed to get image extension for place "${placeName}" at URL "${url}". Defaulting to .jpg`);
        return 'jpg'; // Fallback to 'jpg' if the request fails
    }
};

/**
 * Ensures that a directory exists at the specified path. If it does not exist,
 * it will be created (recursively).
 * 
 * @param {string} dir - The directory path to ensure.
 */
const ensureDirectoryExists = (dir: string) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};


/**
 * Downloads an image from the given URL and saves it to the `/public/images/` directory.
 * Returns the relative URL path if successful, otherwise returns an empty string.
 * 
 * @param {string} coverPhotoURL - The URL of the image to download.
 * @param {string} recordId - The Airtable record ID of the place.
 * @param {string} placeName - The name of the place (for logging purposes).
 * @returns {Promise<string>} A promise that resolves to the local image URL (relative to `/public/images/`), or an empty string on failure.
 */
/* TODO Rewrite this to take the new array of photos 'photos', download them all, and return the array of local URLs
Or find some way to use the photos and make a photo gallery users can browse upon clicking then you just get the URL
on request. It's a call to Google's API not using any API usage. */
const downloadImage = async (coverPhotoURL: string, recordId: string, placeName: string): Promise<string> => {
    const urlHash = generateHashFromURL(coverPhotoURL); // Generate a SHA1 hash from the URL
    const extension = await getImageExtension(coverPhotoURL, placeName); // Get the file extension
    const filePath = path.resolve(`./public/images/${recordId}-${urlHash}.${extension}`);
    const localCoverPhotoURL = `/images/${recordId}-${urlHash}.${extension}`;

    // Ensure the directory exists
    ensureDirectoryExists(path.resolve('./public/images/'));

    // Check if the file already exists by checking the file path
    if (!fs.existsSync(filePath)) {
        try {
            const response = await axios({
                url: coverPhotoURL,
                method: 'GET',
                responseType: 'stream',
            });

            // Save image to public folder
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            console.log(`Image downloaded for place "${placeName}" (ID: ${recordId})`);
        } catch (error) {
            console.error(`Error downloading image for place "${placeName}" (ID: ${recordId}):`, error);
            return ''; // Return empty string if the download fails
        }
    } else {
        console.log(`Image for place "${placeName}" (ID: ${recordId}) already exists, skipping download.`);
    }

    return localCoverPhotoURL;
};

/**
 * Maps a record (either from Airtable or CSV) to a Place object.
 * 
 * @param record - The record to map, either an Airtable record or a CSV row.
 * @param isCSV - A boolean indicating whether the record is from a CSV file.
 * @param rowIndex - The row index for CSV records, used as a fallback ID.
 * @returns A Place object.
 */
const mapRecordToPlace = (record: any, isCSV: boolean = false, rowIndex: number = 0): Place => {
    // Parse Python-style array string to JavaScript array
    const parsePythonStyleArray = (value: string): string[] => {
        if (!value) return [];

        try {
            // Handle Python-style arrays with single quotes
            if (value.trim().startsWith('[') && value.trim().endsWith(']')) {
                // Convert Python-style array to valid JSON format by replacing single quotes with double quotes
                // but only for quotes that are part of the array syntax, not within URLs
                const jsonString = value
                    .replace(/^\['/g, '["')         // Replace opening [' with ["
                    .replace(/'\]$/g, '"]')         // Replace closing '] with "]
                    .replace(/', '/g, '", "');      // Replace ', ' with ", "

                try {
                    return JSON.parse(jsonString);
                } catch (e) {
                    // If the above replacement pattern fails, try this more general approach
                    // Extract URLs directly using regex
                    const urlRegex = /(https?:\/\/[^',\s]+)/g;
                    const matches = value.match(urlRegex);
                    if (matches && matches.length > 0) {
                        return matches;
                    }

                    // Last resort: split by comma and clean up
                    return value.split(',')
                        .map(item => item.trim()
                            .replace(/^\[['"]|['"]\]$|^['"]|['"]$/g, '')) // Remove brackets and quotes
                        .filter(Boolean);
                }
            }

            // If it's a single value, return it in an array
            return [value];
        } catch (e) {
            console.warn(`Error parsing array value: ${value}`, e);
            return [];
        }
    };
    const getField = (key: string): any => {
        if (isCSV) {
            const value = record[key];
            if (["Type", "Ambience", "Parking"].includes(key)) {
                return value?.split(',').map((item: string) => item.trim()) || [];
            }
            if (["Photos"].includes(key)) {
                if (!value) return [];
                return parsePythonStyleArray(value);
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

            // Special handling for Photos field from Airtable
            if (key === "Photos") {
                if (!value) return [];
                // If it's already an array, return it
                if (Array.isArray(value)) return value;
                return parsePythonStyleArray(value);
            }

            // For Featured field from Airtable (boolean checkbox)
            if (key === "Featured") {
                return Boolean(value);
            }

            return value;
        }
    };

    return {
        recordId: isCSV ? rowIndex.toString() : record.id,
        name: getField("Place"),
        type: getField("Type"),
        size: getField("Size"),
        ambience: getField("Ambience"),
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
        let rowIndex = 0;
        fs.createReadStream(localDataPath)
            .pipe(stripBomStream())
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    places.push(mapRecordToPlace(row, true, rowIndex));
                    rowIndex += 1;
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
    try {
        if (shouldUseLocalData()) {
            const localData = await getPlacesFromCSV('./local-data/Charlotte Third Places-Production.csv');
            return localData.find((place) => place.recordId === id);
        }

        const record = await base('Charlotte Third Places').find(id);
        return mapRecordToPlace(record);
    } catch (error) {
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
