import { Place } from "@/lib/types"
import type { MetadataRoute } from 'next'
import { getPlaces } from "@/lib/data-services"

// See https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
export const dynamic = "force-static"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://charlottethirdplaces.com'
    const currentDate = new Date()

    const places = await getPlaces()

    // Generate sitemap entries for static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/map`,
            lastModified: currentDate,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/contribute`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.7,
        },
    ]

    // Generate sitemap entries for individual place pages
    const placePages: MetadataRoute.Sitemap = places.map((place: Place) => ({
        url: `${baseUrl}/places/${place.recordId}`,
        lastModified: new Date(place.lastModifiedDate),
        changeFrequency: 'weekly',
        priority: 0.6,
    }))

    // Combine static pages and place pages
    return [...staticPages, ...placePages]
}