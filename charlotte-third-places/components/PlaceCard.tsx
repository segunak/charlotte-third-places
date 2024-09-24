import { FC } from "react";
import { Place } from "@/lib/types";
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Predefined color mappings for tag backgrounds and text
const colorMap: { [key: string]: { bgColor: string; textColor: string } } = {
    "Cafe": { bgColor: "bg-blue-100", textColor: "text-blue-800" },         // Light blue background, dark blue text
    "Coffee Shop": { bgColor: "bg-yellow-100", textColor: "text-yellow-800" }, // Light yellow background, dark yellow text
    "Unsure": { bgColor: "bg-gray-200", textColor: "text-black" },          // Light gray background, black text for "Unsure"
};

// Extended fallback colors with warm and vibrant tones that get randomly assigned.
const fallbackColors = [
    { bgColor: "bg-orange-100", textColor: "text-orange-800" },   // Light orange background, dark orange text
    { bgColor: "bg-teal-100", textColor: "text-teal-800" },       // Light teal background, dark teal text
    { bgColor: "bg-indigo-100", textColor: "text-indigo-800" },   // Light indigo background, dark indigo text
    { bgColor: "bg-pink-100", textColor: "text-pink-800" },       // Light pink background, dark pink text
    { bgColor: "bg-lime-100", textColor: "text-lime-800" },       // Light lime background, dark lime text
    { bgColor: "bg-amber-100", textColor: "text-amber-800" },     // Light amber background, dark amber text
    { bgColor: "bg-fuchsia-100", textColor: "text-fuchsia-800" }, // Light fuchsia background, dark fuchsia text
    { bgColor: "bg-rose-100", textColor: "text-rose-800" },       // Light rose background, dark rose text
    { bgColor: "bg-cyan-100", textColor: "text-cyan-800" },       // Light cyan background, dark cyan text
    { bgColor: "bg-violet-100", textColor: "text-violet-800" },   // Light violet background, dark violet text
    { bgColor: "bg-emerald-100", textColor: "text-emerald-800" }, // Light emerald background, dark emerald text
    { bgColor: "bg-yellow-200", textColor: "text-yellow-900" },   // Bright yellow background, dark yellow text
    { bgColor: "bg-red-100", textColor: "text-red-800" },         // Light red background, dark red text
    { bgColor: "bg-red-200", textColor: "text-red-900" },         // Bright red background, dark red text
    { bgColor: "bg-purple-100", textColor: "text-purple-800" },      // Light purple background, dark purple text
    { bgColor: "bg-purple-200", textColor: "text-purple-900" },   // Bright purple background, dark purple text
    { bgColor: "bg-green-100", textColor: "text-green-800" }, // Light green background, dark green text
    { bgColor: "bg-green-200", textColor: "text-green-900" },     // Bright green background, dark green text
    { bgColor: "bg-blue-200", textColor: "text-blue-900" },       // Bright blue background, dark blue text
    { bgColor: "bg-pink-200", textColor: "text-pink-900" },       // Bright pink background, dark pink text
    { bgColor: "bg-amber-200", textColor: "text-amber-900" },     // Bright amber background, dark amber text
    { bgColor: "bg-lime-200", textColor: "text-lime-900" },       // Bright lime background, dark lime text
    { bgColor: "bg-teal-200", textColor: "text-teal-900" },       // Bright teal background, dark teal text
    { bgColor: "bg-fuchsia-200", textColor: "text-fuchsia-900" }, // Bright fuchsia background, dark fuchsia text
];

const getAttributeColors = (attribute: string) => {
    // Fallback to a random selection from the fallbackColors array for empty or undefined attributes
    const randomIndex = Math.floor(Math.random() * fallbackColors.length);

    // If the attribute is undefined or an empty string, return a random color
    if (!attribute || attribute.trim() === "") {
        return fallbackColors[randomIndex];
    }

    // First, try to get a color from the predefined color map
    if (colorMap[attribute]) {
        return colorMap[attribute];
    }

    // Generate a hash from the attribute string
    let hash = 0;
    for (let i = 0; i < attribute.length; i++) {
        hash = attribute.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Ensure the hash is positive and use it to get a color from fallbackColors
    const colorIndex = Math.abs(hash) % fallbackColors.length;

    // Fallback to a random selection from the fallbackColors array if the hash fails
    return fallbackColors[colorIndex] || fallbackColors[randomIndex];
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
                <CardDescription className="truncate">
                    {place?.description && place.description.trim() !== ""
                        ? place.description
                        : "A third place in the Charlotte, North Carolina area"}
                </CardDescription>
            </CardHeader>
            <CardContent className="w-full overflow-hidden">
                <span className="space-y-2">
                    <span className="text-sm block mt-1">
                        <strong>Size: </strong>
                        {place?.size && (
                            <span className={`${getAttributeColors(place.size).bgColor} ${getAttributeColors(place.size).textColor} text-balance text-xs sm:text-sm font-semibold mr-2 px-2.5 py-0.5 rounded-lg`}>
                                {place.size}
                            </span>
                        )}
                    </span>

                    <span className="flex flex-wrap space-x-2">
                        <strong>Type: </strong>
                        {place?.type?.map((tag, index) => {
                            const { bgColor, textColor } = getAttributeColors(tag);
                            return (
                                <span key={tag} className={`${bgColor} ${textColor} text-balance text-xs sm:text-sm font-semibold mr-2 px-2.5 py-0.5 rounded-lg`}>
                                    {tag}
                                </span>
                            );
                        })}
                    </span>

                    <span className="flex justify-between">
                        <span className="text-sm block">
                            <strong>Neighborhood: </strong>
                            {place?.neighborhood && (
                                <span className={`${getAttributeColors(place.neighborhood).bgColor} ${getAttributeColors(place.neighborhood).textColor} text-xs text-balance sm:text-sm font-semibold mr-2 px-2.5 py-0.5 rounded-lg`}>
                                    {place.neighborhood}
                                </span>
                            )}
                        </span>

                        <Button className="!font-bold" size="sm">
                            More Info
                        </Button>
                    </span>
                </span>
            </CardContent>
        </Card>
    );
};