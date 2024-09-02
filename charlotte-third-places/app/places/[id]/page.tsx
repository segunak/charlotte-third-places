import { getPlaces } from '@/lib/data';
import { Place } from '@/lib/definitions';

/**
 * This file defines the structure and behavior of the PlacePage component in Next.js,
 * leveraging the App Router to fetch and cache data from Airtable while optimizing performance.
 * 
 * Key Concepts:
 * 
 * 1. Caching with `revalidate`:
 *    - The `revalidate` property is set to 12 hours (43200 seconds), meaning that the data fetched 
 *      from Airtable is cached for 12 hours.
 *    - During this period, any requests for this data will be served directly from the cache, 
 *      avoiding unnecessary API calls to Airtable. All users get cached data.
 *    - Once the 12-hour window has passed, the cache is invalidated, and the next request 
 *      will trigger a fresh fetch from Airtable, updating the cache with the new data.
  *    - Note: If multiple users request data right after the cache expires, there is a small 
 *      risk of multiple API calls being made. However, once the cache is refreshed, all users 
 *      will receive the same cached data for the next 12 hours, minimizing API calls overall.
 * 
 * 2. Handling Dynamic Paths with `dynamicParams`:
 *    - The `dynamicParams` property is set to `true`, allowing Next.js to generate pages 
 *      on-demand for paths that weren't pre-rendered during the build process.
 *    - This is particularly useful for handling new entries in Airtable that may be added 
 *      after the site has been built. Instead of requiring a complete rebuild, these pages 
 *      will be generated when first requested, ensuring the site remains up-to-date.
 * 
 * 3. `generateStaticParams` Function:
 *    - This function is executed at build time, fetching all places from Airtable by calling 
 *      `getPlaces()`. It then maps over these places to create an array of `id` objects, 
 *      each corresponding to an Airtable record ID.
 *    - These IDs are used by Next.js to pre-generate static pages for each place, which 
 *      ensures fast load times and good SEO.
 * 
 * 4. `PlacePage` Component:
 *    - The `PlacePage` component is the page users see when navigating to a specific place's URL.
 *    - It receives the `id` from the URL parameters and uses it to find the corresponding place 
 *      by fetching all places again with `getPlaces()` (this ensures access to all the place data).
 *    - If a matching place is found, its details are rendered on the page; otherwise, 
 *      a "Place not found" message is displayed.
 * 
 * Caching and Data Fetching:
 * 
 * - At Build Time:
 *    - `generateStaticParams` runs, fetching all places and determining which pages to pre-generate.
 *    - These pages are built as static HTML files and served to users directly, ensuring fast response times.
 * 
 * - At Runtime:
 *    - Pre-generated pages are served from the cache during the `revalidate` period.
 *    - If a user requests a page that wasn't pre-generated, Next.js dynamically generates the page 
 *      and caches it for future requests.
 *    - After 12 hours, the cache is invalidated, and the next request will trigger a fresh data fetch from Airtable.
 */

// `revalidate` defines the interval in seconds during which the cached data is considered valid.
// After this interval, Next.js will invalidate the cache and fetch fresh data.
// Here, we set it to 12 hours (43200 seconds).
export const revalidate = 43200; // 12 hours in seconds (12 * 60 * 60)

// `dynamicParams` is a configuration for Next.js to handle paths that weren't pre-rendered at build time.
// If set to `true`, Next.js will generate pages on-demand for paths not generated during the build.
// If set to `false`, Next.js will return a 404 for any path not pre-rendered.
export const dynamicParams = true; // If true, Next.js will generate pages on-demand for unknown paths

// `generateStaticParams` is a special function that Next.js runs at build time.
// Its purpose is to pre-generate static pages based on the data fetched here.
// In this case, it calls `getPlaces()` to fetch all places from Airtable.
export async function generateStaticParams() {
    // Fetch all places from Airtable.
    const places = await getPlaces();

    // Map over the fetched places and return an array of objects, 
    // each containing the `id` of a place. This `id` corresponds 
    // to the Airtable record ID and will be used to generate dynamic routes.
    return places.map((place: Place) => ({
        id: place.airtableRecordId,
    }));
}

// This is the page component for individual places. It is a dynamic route, 
// meaning it is rendered based on the `id` parameter provided in the URL.
export default async function PlacePage({ params: { id } }: { params: { id: string } }) {
    // Fetch all places again. This is necessary because Next.js does not automatically pass 
    // the data fetched in `generateStaticParams` to this component.
    const places = await getPlaces();

    // Find the specific place that matches the `id` from the URL.
    const place = places.find((place: Place) => place.airtableRecordId === id);

    // If no place is found with the given `id`, return a "Place not found" message.
    if (!place) return <div>Place not found</div>;

    // If the place is found, render its details on the page.
    // TODO - Make this a Card layout. Centered. With key details about a place.
    return (
        <div>
            <h1>{place.name}</h1>
            <p>{place.description}</p>
            {/* Add other fields and display as needed */}
        </div>
    );
}
