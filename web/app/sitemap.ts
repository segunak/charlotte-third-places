import { Place } from "@/lib/types"
import type { MetadataRoute } from 'next'
import { getPlaces } from "@/lib/data-services"

// See https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
export const dynamic = "force-static"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://charlottethirdplaces.com'

    const places = await getPlaces()
    const latestModifiedDate = places.reduce<Date | undefined>((latest, place) => {
        const modified = new Date(place.lastModifiedDate)
        if (Number.isNaN(modified.getTime())) return latest
        return !latest || modified > latest ? modified : latest
    }, undefined)

    // Generate sitemap entries for static pages without wall-clock timestamps
    // so /sitemap.xml stays deterministic when no Airtable record changed.
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            ...(latestModifiedDate && { lastModified: latestModifiedDate }),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/map`,
            ...(latestModifiedDate && { lastModified: latestModifiedDate }),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/contribute`,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/about`,
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