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
            <DialogContent className="rounded-lg w-11/12 sm:rounded-xl md:max-w-lg md:mx-auto sm:w-auto">
                <DialogHeader>
                    <DialogTitle>{place?.name}</DialogTitle>
                    <DialogDescription>{place?.type?.join(", ")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <p><strong>Address:</strong> {place?.address}</p>
                    <p><strong>Neighborhood:</strong> {place?.neighborhood}</p>
                    <p><strong>Size:</strong> {place?.size}</p>
                    <p><strong>Purchase Required:</strong> {place?.purchaseRequired}</p>
                    <p><strong>Parking Situation:</strong> {place?.parkingSituation}</p>
                    <p><strong>Free Wifi:</strong> {place?.freeWifi}</p>
                    <p><strong>Has Cinnamon Rolls:</strong> {place?.hasCinnamonRolls}</p>
                    <p><strong>Website:</strong> {place?.website || "No Website Big Dawg"}
                    {/* <ResponsiveLink href={place?.website}>third places</ResponsiveLink>Place Website */}
                    </p>
                    <p><strong>Description:</strong> {place?.description || "No description available."}</p>
                </div>
                <div className="flex justify-end mt-4">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
