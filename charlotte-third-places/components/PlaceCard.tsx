import { FC } from "react";
import { Place } from "@/components/DataModels";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface PlaceCardProps {
    place: Place;
    onClick: () => void;
}

export const PlaceCard: FC<PlaceCardProps> = ({ place, onClick }) => {
    return (
        <Card className="mb-4 cursor-pointer shadow-lg hover:shadow-xl transition-shadow duration-200 rounded-lg w-full" onClick={onClick}>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold truncate">{place?.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground truncate">
                    <p className="text-gray-500">{place?.neighborhood}</p>
                </CardDescription>
            </CardHeader>
            <CardContent className="w-full overflow-hidden">
                <div className="space-y-2">
                    <p className="text-gray-600 text-sm truncate">
                        <strong>Address: </strong> {place?.address}
                    </p>
                    <div className="flex flex-wrap space-x-2">
                        <strong>Type: </strong>
                        {place?.type?.map((tag) => (
                            <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-lg">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
