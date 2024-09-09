import { FC } from "react";
import { Place } from "@/lib/data-models";
import { Button } from "@/components/ui/button";
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PlaceModalProps {
    place: Place;
    onClose: () => void;
}

export const PlaceModal: FC<PlaceModalProps> = ({ place, onClose }) => {
    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="w-full sm:w-auto sm:max-w-7xl sm:mx-auto rounded-lg sm:rounded-xl ">
                <DialogHeader className="mt-5">
                    <DialogTitle>{place?.name}</DialogTitle>
                    <DialogDescription>{place?.type?.join(", ")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <p>
                        <strong>Google Maps Profile:</strong>{" "}
                        {place?.googleMapsProfileURL ? (
                            <ResponsiveLink href={place.googleMapsProfileURL}>Visit Profile</ResponsiveLink>
                        ) : (
                            "No profile available."
                        )}
                    </p>
                    <p><strong>Address:</strong> {place?.address}</p>
                    <p><strong>Neighborhood:</strong> {place?.neighborhood}</p>
                    <p><strong>Size:</strong> {place?.size}</p>
                    <p><strong>Purchase Required:</strong> {place?.purchaseRequired}</p>
                    <p><strong>Parking Situation:</strong> {place?.parkingSituation}</p>
                    <p><strong>Free Wifi:</strong> {place?.freeWifi}</p>
                    <p><strong>Has Cinnamon Rolls:</strong> {place?.hasCinnamonRolls}</p>
                    <p>
                        <strong>Website:</strong>{" "}
                        {place?.website ? (
                            <ResponsiveLink href={place.website}>Visit Website</ResponsiveLink>
                        ) : (
                            "No website available."
                        )}
                    </p>
                    <p><strong>Description:</strong> {place?.description || "No description available."}</p>
                    <p><strong>Site Author Comments:</strong> {place?.comments || "None."}</p>
                </div>
                <div className="flex justify-end mt-4">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
