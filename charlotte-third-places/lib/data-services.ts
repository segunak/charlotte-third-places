import Airtable from 'airtable';
import { Place } from '@/lib/data-models';

const base = new Airtable({
    apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN
}).base('apptV6h58vA4jhWFg');

export async function getPlaces(): Promise<Place[]> {
    const records = await base('Charlotte Third Places').select({ view: 'Production' }).all();
    return records.map((record) => {
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
            coverPhotoURL: record.get('Cover Photo URL') as string,
            comments: record.get('Comments') as string
        };
    });
}