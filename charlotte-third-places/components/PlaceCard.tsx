import { FC } from "react";
import { Place } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Predefined color mappings for tag backgrounds and text
const colorMap: { [key: string]: { bgColor: string; textColor: string } } = {
    "Restaurant": { bgColor: "bg-green-100", textColor: "text-green-800" },
    "Cafe": { bgColor: "bg-blue-100", textColor: "text-blue-800" },
    "Coffee Shop": { bgColor: "bg-yellow-100", textColor: "text-yellow-800" },
    "Bakery": { bgColor: "bg-red-100", textColor: "text-red-800" },
    "Bar": { bgColor: "bg-purple-100", textColor: "text-purple-800" },
    // Add more types as needed, or default to a random color for unmapped types
};

// Extended fallback colors with warm and vibrant tones
const fallbackColors = [
    { bgColor: "bg-orange-100", textColor: "text-orange-800" },
    { bgColor: "bg-teal-100", textColor: "text-teal-800" },
    { bgColor: "bg-indigo-100", textColor: "text-indigo-800" },
    { bgColor: "bg-pink-100", textColor: "text-pink-800" },
    { bgColor: "bg-lime-100", textColor: "text-lime-800" },
    { bgColor: "bg-amber-100", textColor: "text-amber-800" },
    { bgColor: "bg-fuchsia-100", textColor: "text-fuchsia-800" },
    { bgColor: "bg-rose-100", textColor: "text-rose-800" },
    { bgColor: "bg-cyan-100", textColor: "text-cyan-800" },
    { bgColor: "bg-violet-100", textColor: "text-violet-800" },
    { bgColor: "bg-emerald-100", textColor: "text-emerald-800" },
    { bgColor: "bg-lightBlue-100", textColor: "text-lightBlue-800" },
];

// Function to get colors for a tag, with fallback support
const getTagColors = (tag: string, index: number) => {
    return colorMap[tag] || fallbackColors[index % fallbackColors.length];
};

interface PlaceCardProps {
    place: Place;
    onClick: () => void;
}

export const PlaceCard: FC<PlaceCardProps> = ({ place, onClick }) => {
    return (
        <Card className="mb-4 cursor-pointer shadow-lg hover:shadow-xl transition-shadow duration-200 rounded-lg w-full" onClick={onClick}>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg truncate">{place?.name}</CardTitle>
                <CardDescription className="truncate">{place?.neighborhood}</CardDescription>
            </CardHeader>
            <CardContent className="w-full overflow-hidden">
                <span className="space-y-2">
                    <span className="text-sm truncate">
                        <strong>Address: </strong> {place?.address}
                    </span>
                    <span className="flex flex-wrap space-x-2">
                        <strong>Type: </strong>
                        {place?.type?.map((tag, index) => {
                            const { bgColor, textColor } = getTagColors(tag, index);
                            return (
                                <span key={tag} className={`${bgColor} ${textColor} text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-lg`}>
                                    {tag}
                                </span>
                            );
                        })}
                    </span>
                </span>
            </CardContent>
        </Card>
    );
};