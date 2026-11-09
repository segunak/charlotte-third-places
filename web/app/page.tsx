export const dynamic = "force-static";

import { getPlaces, copyPlaceWithOnlyFirstPhotoAndTotalPhotoCount } from '@/lib/data-services';
import HomePageClient from "@/components/HomePageClient";

export default async function HomePage() {
  const places = (await getPlaces()).map(copyPlaceWithOnlyFirstPhotoAndTotalPhotoCount);

  // Pass the fetched place data to the client component
  return <HomePageClient places={places} />;
}