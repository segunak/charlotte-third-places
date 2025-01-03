import { FC, memo } from 'react';
import { Place } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

interface PlaceDetailsProps {
    place: Place;
}

const PlaceDetails: FC<PlaceDetailsProps> = memo(({ place }) => {
    return (
        <>
            <p><strong>Address:</strong> {place.address}</p>
            <p><strong>Neighborhood:</strong> {place.neighborhood}</p>
            <p><strong>Size:</strong> {place.size}</p>
            <p><strong>Purchase Required:</strong> {place.purchaseRequired}</p>
            <p><strong>Parking Situation:</strong> {place.parkingSituation}</p>
            <p><strong>Free Wifi:</strong> {place.freeWifi}</p>
            <p><strong>Has Cinnamon Rolls:</strong> {place.hasCinnamonRolls}</p>
            <Separator />
            <p><strong>Description:</strong> {place.description?.trim() || "A third place in the Charlotte, North Carolina area."}</p>
            <p><strong>Curator's Comments:</strong> {place.comments?.trim() || "None."}</p>
            <Separator className="hidden sm:block" />
            <p className="hidden sm:block">
                <strong>Metadata:</strong> Added: {place.createdDate} | Last Updated: {place.lastModifiedDate}.
            </p>
        </>
    );
});

PlaceDetails.displayName = 'PlaceDetails';

export default PlaceDetails;
