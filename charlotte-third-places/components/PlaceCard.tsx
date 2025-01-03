import { Place } from "@/lib/types";
import { Button } from "@/components/ui/button"
import { FC, useMemo, memo, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Predefined color mappings for tag backgrounds and text
const colorMap: { [key: string]: { bgColor: string; textColor: string } } = {
    "Cafe": { bgColor: "bg-blue-100", textColor: "text-blue-800" },         // Light blue background, dark blue text
    "Coffee Shop": { bgColor: "bg-yellow-100", textColor: "text-yellow-800" }, // Light yellow background, dark yellow text
    "Unsure": { bgColor: "bg-gray-200", textColor: "text-black" },          // Light gray background, black text for "Unsure"
};

// Extended fallback colors with warm and vibrant tones that get randomly assigned.
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
    { bgColor: "bg-yellow-200", textColor: "text-yellow-900" },
    { bgColor: "bg-red-100", textColor: "text-red-800" },
    { bgColor: "bg-red-200", textColor: "text-red-900" },
    { bgColor: "bg-purple-100", textColor: "text-purple-800" },
    { bgColor: "bg-purple-200", textColor: "text-purple-900" },
    { bgColor: "bg-green-100", textColor: "text-green-800" },
    { bgColor: "bg-green-200", textColor: "text-green-900" },
    { bgColor: "bg-blue-200", textColor: "text-blue-900" },
    { bgColor: "bg-pink-200", textColor: "text-pink-900" },
    { bgColor: "bg-amber-200", textColor: "text-amber-900" },
    { bgColor: "bg-lime-200", textColor: "text-lime-900" },
    { bgColor: "bg-teal-200", textColor: "text-teal-900" },
    { bgColor: "bg-fuchsia-200", textColor: "text-fuchsia-900" },
];

const colorCache = new Map<string, { bgColor: string; textColor: string }>();

const getAttributeColors = (attribute: string) => {
    if (colorCache.has(attribute)) {
        return colorCache.get(attribute)!;
    }

    let result;
    if (!attribute || attribute.trim() === "") {
        result = fallbackColors[0];
    } else if (colorMap[attribute]) {
        result = colorMap[attribute];
    } else {
        let hash = 0;
        for (let i = 0; i < attribute.length; i++) {
            hash = attribute.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorIndex = Math.abs(hash) % fallbackColors.length;
        result = fallbackColors[colorIndex] || fallbackColors[0];
    }

    colorCache.set(attribute, result);
    return result;
};

interface AttributeTagProps {
    attribute: string;
}

const AttributeTag: FC<AttributeTagProps> = memo(({ attribute }) => {
    const { bgColor, textColor } = useMemo(() => getAttributeColors(attribute), [attribute]);
    return (
        <span className={`${bgColor} ${textColor} text-balance text-xs sm:text-sm font-semibold mr-2 px-2.5 py-0.5 rounded-lg`}>
            {attribute}
        </span>
    );
});
AttributeTag.displayName = 'AttributeTag';

interface PlaceCardProps {
    place: Place;
    onClick: () => void;
}

export const PlaceCard: FC<PlaceCardProps> = memo(({ place, onClick }) => {
    const handleClick = useRef(onClick).current;

    const description = useMemo(() =>
        place?.description?.trim() || "A third place in the Charlotte, North Carolina area",
        [place?.description]
    );

    const handleButtonClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        handleClick();
    }, [handleClick]);

    return (
        <Card className="mb-4 cursor-pointer shadow-lg hover:shadow-xl transition-shadow duration-200 rounded-lg w-full card-font" onClick={handleClick}>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg truncate">{place?.name}</CardTitle>
                <CardDescription className="truncate">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="w-full overflow-hidden">
                <span className="space-y-2">
                    <span className="text-sm block mt-1">
                        <strong>Size: </strong>
                        {place?.size && <AttributeTag attribute={place.size} />}
                    </span>

                    <span className="flex flex-wrap space-x-2">
                        <strong>Type: </strong>
                        {place?.type?.map((tag) => (
                            <AttributeTag key={tag} attribute={tag} />
                        ))}
                    </span>

                    <span className="flex justify-between">
                        <span className="text-sm block">
                            <strong>Neighborhood: </strong>
                            {place?.neighborhood && <AttributeTag attribute={place.neighborhood} />}
                        </span>

                        <Button
                            className="!font-bold"
                            size="sm"
                            onClick={handleButtonClick}
                        >
                            More Info
                        </Button>
                    </span>
                </span>
            </CardContent>
        </Card>
    );
});

PlaceCard.displayName = 'PlaceCard';

