import fs from 'fs';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';
import Airtable from 'airtable';
import csvParser from 'csv-parser';
import { Place } from '@/lib/types';
import stripBomStream from 'strip-bom-stream';

const base = new Airtable({
    apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN
}).base('apptV6h58vA4jhWFg');

/**
 * Reads and parses CSV data from a given file name (relative path),
 * converts each row into a `Place` object, and returns an array of `Place`.
 * 
 * @param {string} fileName - The relative path to the CSV file.
 * @returns {Promise<Place[]>} Promise that resolves to an array of Place objects.
 */
const getPlacesFromCSV = async (fileName: string): Promise<Place[]> => {
    const localDataPath = path.resolve(fileName);
    const places: Place[] = [];

    return new Promise((resolve, reject) => {
        let rowIndex = 0;
        fs.createReadStream(localDataPath)
            .pipe(stripBomStream())
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    places.push({
                        airtableRecordId: rowIndex.toString(),
                        name: row['Place'],
                        type: row['Type']?.split(',') || [],
                        size: row['Size'],
                        ambience: row['Ambience']?.split(',') || [],
                        neighborhood: row['Neighborhood'],
                        address: row['Address'],
                        purchaseRequired: row['Purchase Required'],
                        parkingSituation: row['Parking Situation'],
                        freeWifi: row['Free Wi-Fi'],
                        hasCinnamonRolls: row['Has Cinnamon Rolls'],
                        hasReviews: row['Has Reviews'],
                        description: row['Description'],
                        website: row['Website'],
                        googleMapsPlaceId: row['Google Maps Place Id'],
                        googleMapsProfileURL: row['Google Maps Profile URL'],
                        photos: row['Photos']?.split(',') || [],
                        comments: row['Comments'],
                        latitude: parseFloat(row['Latitude']) as number,
                        longitude: parseFloat(row['Longitude']) as number,
                        createdDate: row['Created Time'],
                        lastModifiedDate: row['Last Modified Time'],
                    });
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
 * Generates a SHA1 hash from a given URL string.
 * 
 * @param {string} url - The URL to hash.
 * @returns {string} The SHA1 hash of the URL.
 */
const generateHashFromURL = (url: string): string => {
    return crypto.createHash('sha1').update(url).digest('hex');
};

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
 * @param {string} airtableRecordId - The Airtable record ID of the place.
 * @param {string} placeName - The name of the place (for logging purposes).
 * @returns {Promise<string>} A promise that resolves to the local image URL (relative to `/public/images/`), or an empty string on failure.
 */
/* TODO Rewrite this to take the new array of photos 'photos', download them all, and return the array of local URLs
Or find some way to use the photos and make a photo gallery users can browse upon clicking then you just get the URL
on request. It's a call to Google's API not using any API usage. */
const downloadImage = async (coverPhotoURL: string, airtableRecordId: string, placeName: string): Promise<string> => {
    const urlHash = generateHashFromURL(coverPhotoURL); // Generate a SHA1 hash from the URL
    const extension = await getImageExtension(coverPhotoURL, placeName); // Get the file extension
    const filePath = path.resolve(`./public/images/${airtableRecordId}-${urlHash}.${extension}`);
    const localCoverPhotoURL = `/images/${airtableRecordId}-${urlHash}.${extension}`;

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

            console.log(`Image downloaded for place "${placeName}" (ID: ${airtableRecordId})`);
        } catch (error) {
            console.error(`Error downloading image for place "${placeName}" (ID: ${airtableRecordId}):`, error);
            return ''; // Return empty string if the download fails
        }
    } else {
        console.log(`Image for place "${placeName}" (ID: ${airtableRecordId}) already exists, skipping download.`);
    }

    return localCoverPhotoURL;
};

/**
 * Formats a date string into an 'MM/DD/YYYY' format.
 * 
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted date string in 'MM/DD/YYYY' format.
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

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
            console.log('Using CSV file as data source for local development');
            const localData = await getPlacesFromCSV('./Charlotte Third Places-All.csv');
            return localData.find((place) => place.airtableRecordId === id);
        }

        const record = await base('Charlotte Third Places').find(id);

        return {
            airtableRecordId: record.id,
            name: record.get('Place') as string,
            type: record.get('Type') as string[],
            size: record.get('Size') as string,
            ambience: record.get('Ambience') as string[],
            neighborhood: record.get('Neighborhood') as string,
            address: record.get('Address') as string,
            purchaseRequired: record.get('Purchase Required') as string,
            parkingSituation: record.get('Parking Situation') as string,
            freeWifi: record.get('Free Wi-Fi') as string,
            hasCinnamonRolls: record.get('Has Cinnamon Rolls') as string,
            hasReviews: record.get('Has Reviews') as string,
            description: record.get('Description') as string,
            website: record.get('Website') as string,
            googleMapsPlaceId: record.get('Google Maps Place Id') as string,
            googleMapsProfileURL: record.get('Google Maps Profile URL') as string,
            photos: record.get('Photos') as string[],
            comments: record.get('Comments') as string,
            latitude: record.get('Latitude') as number,
            longitude: record.get('Longitude') as number,
            createdDate: formatDate(record.get('Created Time') as string) as string,
            lastModifiedDate: formatDate(record.get('Last Modified Time') as string) as string
        };
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
        if (process.env.NODE_ENV === 'development') {
            console.log('Using CSV data for local development');
            const localData = await getPlacesFromCSV('./Charlotte Third Places-All.csv');
            return localData;
        }

        const records = await base('Charlotte Third Places')
            .select({ view: 'Production' })
            .all();

        const places = await Promise.all(
            records.map(async (record) => {
                return {
                    airtableRecordId: record.id,
                    name: record.get('Place') as string,
                    type: record.get('Type') as string[],
                    size: record.get('Size') as string,
                    ambience: record.get('Ambience') as string[],
                    neighborhood: record.get('Neighborhood') as string,
                    address: record.get('Address') as string,
                    purchaseRequired: record.get('Purchase Required') as string,
                    parkingSituation: record.get('Parking Situation') as string,
                    freeWifi: record.get('Free Wi-Fi') as string,
                    hasCinnamonRolls: record.get('Has Cinnamon Rolls') as string,
                    hasReviews: record.get('Has Reviews') as string,
                    description: record.get('Description') as string,
                    website: record.get('Website') as string,
                    googleMapsPlaceId: record.get('Google Maps Place Id') as string,
                    googleMapsProfileURL: record.get('Google Maps Profile URL') as string,
                    photos: record.get('Photos') as string[],
                    comments: record.get('Comments') as string,
                    latitude: record.get('Latitude') as number,
                    longitude: record.get('Longitude') as number,
                    createdDate: formatDate(record.get('Created Time') as string) as string,
                    lastModifiedDate: formatDate(record.get('Last Modified Time') as string) as string
                };
            })
        );

        return places;
    } catch (error) {
        console.error('Failed to fetch places:', error);
        throw new Error('Failed to fetch places');
    }
}
