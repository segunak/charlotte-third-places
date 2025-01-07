import fs from 'fs';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';
import Airtable from 'airtable';
import csvParser from 'csv-parser';
import { Place } from '@/lib/types';
import { parse, format } from "date-fns";
import stripBomStream from 'strip-bom-stream';

const base = new Airtable({
    apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN
}).base('apptV6h58vA4jhWFg');

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
 * Parses a date string and formats it to "MM/dd/yyyy".
 *
 * This function attempts to parse a date string in the format "M/d/yyyy h:mma"
 * (e.g., "12/27/2024 2:52pm") and then formats it to "MM/dd/yyyy". If the input
 * date string is invalid or cannot be parsed, the original date string is returned.
 *
 * @param dateStr - The date string to parse and format.
 * @returns The formatted date string in "MM/dd/yyyy" format, or the original date string if parsing fails.
 */
function parseAndFormatDate(dateStr: string): string {
    if (!dateStr) return "";

    try {
        // Adjust to match your exact input format. Here, we assume "M/d/yyyy h:mma",
        // e.g. "12/27/2024 2:52pm"
        const parsedDate = parse(dateStr, "M/d/yyyy h:mma", new Date());

        // If date-fns couldn’t parse it, parsedDate might be invalid. Check that:
        if (isNaN(parsedDate.getTime())) {
            // fallback: return original string if invalid
            return dateStr;
        }

        // Format it as just "MM/dd/yyyy"
        return format(parsedDate, "MM/dd/yyyy");
    } catch (err) {
        // fallback
        return dateStr;
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
    const getField = (key: string): any => {
        if (isCSV) {
            const value = record[key];
            if (key === "Type" || key === "Ambience" || key === "Photos") {
                return value?.split(',') || [];
            }
            if (key === "Latitude" || key === "Longitude") {
                return parseFloat(value);
            }
            if (key === "Created Time" || key === "Last Modified Time") {
                return parseAndFormatDate(value);
            }
            return value;
        } else {
            return record.get(key);
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
        parkingSituation: getField("Parking Situation"),
        freeWifi: getField("Free Wi-Fi"),
        hasCinnamonRolls: getField("Has Cinnamon Rolls"),
        hasReviews: getField("Has Reviews"),
        description: getField("Description"),
        website: getField("Website"),
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
        if (process.env.NODE_ENV === 'development') {
            console.log('Info: Local development mode. Using CSV data for places.');
            const localData = await getPlacesFromCSV('./local-data/Charlotte Third Places.csv');
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
        // Get places from a CSV file
        if (process.env.NODE_ENV === 'development') {
            console.log('Info: Local development mode. Using CSV data for places.');
            const localData = await getPlacesFromCSV('./local-data/Charlotte Third Places.csv');
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
