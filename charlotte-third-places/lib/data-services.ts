import fs from 'fs';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';
import Airtable from 'airtable';
import { Place } from '@/lib/data-models';

const base = new Airtable({
    apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN
}).base('apptV6h58vA4jhWFg');

// Function to generate a SHA1 hash from the URL
const generateHashFromURL = (url: string): string => {
    return crypto.createHash('sha1').update(url).digest('hex');
};

// Helper function to get the file extension
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

// Ensure that the directory exists before writing files
const ensureDirectoryExists = (dir: string) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Image downloading logic moved to its own function
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

export async function getPlaces(): Promise<Place[]> {
    const records = await base('Charlotte Third Places').select({ view: 'Production' }).all();

    const places = await Promise.all(
        records.map(async (record) => {
            const airtableRecordId = record.id;
            const placeName = record.get('Place') as string;
            const coverPhotoURL = record.get('Cover Photo URL') as string;
            let localCoverPhotoURL = '';
            // Toggle image download functionality on/off by commenting/uncommenting the next line
            // localCoverPhotoURL = coverPhotoURL ? await downloadImage(coverPhotoURL, airtableRecordId, placeName) : '';

            return {
                airtableRecordId: airtableRecordId,
                name: placeName,
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
                coverPhotoURL: coverPhotoURL,
                localCoverPhotoURL: localCoverPhotoURL,
                comments: record.get('Comments') as string,
            };
        })
    );

    return places;
}
