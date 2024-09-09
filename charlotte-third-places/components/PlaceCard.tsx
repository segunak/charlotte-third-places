import { FC } from "react";
import { Place } from "@/components/DataModels";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface PlaceCardProps {
    place: Place;
    onClick: () => void;
}

export const PlaceCard: FC<PlaceCardProps> = ({ place, onClick }) => {
    return (
        <Card className="mb-4 cursor-pointer" onClick={onClick}>
            <CardHeader>
                <CardTitle>{place?.name}</CardTitle>
                <CardDescription>{place?.type?.join(", ")}</CardDescription>
            </CardHeader>
            <CardContent>
                <p>{place?.neighborhood}</p>
                <p>{place?.size}</p>
            </CardContent>
            <div className="flex justify-end p-4">
                <Button variant="secondary" onClick={onClick}>
                    View Details
                </Button>
            </div>
        </Card>
    );
};
