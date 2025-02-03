import { Place } from "@/lib/types";
import { FC, useMemo, memo } from "react";
import { Icons } from "@/components/Icons"
import { Button } from "@/components/ui/button"
import { useModalContext } from "@/contexts/ModalContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const neighborhoodEmoji = "🏘️";

const sizeIconMap: { [key: string]: React.ReactNode } = {
    "Small": <Icons.mobile className="inline-block h-3 w-3" />,
    "Medium": <Icons.tablet className="inline-block h-3 w-3" />,
    "Large": <Icons.desktop className="inline-block h-3 w-3" />,
    "Unsure": "🤷",
};

const typeEmojiMap: { [key: string]: string } = {
    "Bakery": "🍞",
    "Café": "☕",
    "Coffee Shop": "☕",
    "Bubble Tea Store": "🧋",
    "Restaurant": "🍽️",
    "Market": "🛍️",
    "Grocery Store": "🛒",
    "Market Hall": "🏬",
    "Library": "📚",
    "Bookstore": "📖",
    "Public Market": "🏪",
    "Game Store": "🎮",
    "Garden": "🪴",
    "Brewery": "🍺",
    "Deli": "🥪",
};

// Predefined color mappings for tag backgrounds and text
const colorMap: { [key: string]: { bgColor: string; textColor: string } } = {
    "Cafe": { bgColor: "bg-blue-100", textColor: "text-blue-800" },             // Light blue background, dark blue text
    "Coffee Shop": { bgColor: "bg-yellow-100", textColor: "text-yellow-800" }, // Light yellow background, dark yellow text
    "Unsure": { bgColor: "bg-gray-200", textColor: "text-black" },            // Light gray background, black text for "Unsure"
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
    { bgColor: "bg-purple-100", textColor: "text-purple-800" },   // Light purple background, dark purple text
    { bgColor: "bg-purple-200", textColor: "text-purple-900" },   // Bright purple background, dark purple text
    { bgColor: "bg-green-100", textColor: "text-green-800" },     // Light green background, dark green text
    { bgColor: "bg-green-200", textColor: "text-green-900" },     // Bright green background, dark green text
    { bgColor: "bg-blue-200", textColor: "text-blue-900" },       // Bright blue background, dark blue text
    { bgColor: "bg-pink-200", textColor: "text-pink-900" },       // Bright pink background, dark pink text
    { bgColor: "bg-amber-200", textColor: "text-amber-900" },     // Bright amber background, dark amber text
    { bgColor: "bg-lime-200", textColor: "text-lime-900" },       // Bright lime background, dark lime text
    { bgColor: "bg-teal-200", textColor: "text-teal-900" },       // Bright teal background, dark teal text
    { bgColor: "bg-fuchsia-200", textColor: "text-fuchsia-900" }, // Bright fuchsia background, dark fuchsia text
];

// Cache to store previously computed colors for attributes
const colorCache = new Map<string, { bgColor: string; textColor: string }>();

// Function to get colors based on an attribute
const getAttributeColors = (attribute: string) => {
    // Check if the color for the given attribute is already in the cache
    if (colorCache.has(attribute)) {
        // Return the cached color if available
        return colorCache.get(attribute)!;
    }

    let result;

    // If the attribute is empty or only contains whitespace, use the first fallback color
    if (!attribute || attribute.trim() === "") {
        result = fallbackColors[0];
    }
    // If the attribute exists in the predefined color map, use the corresponding color
    else if (colorMap[attribute]) {
        result = colorMap[attribute];
    }
    // If the attribute is not in the color map, generate a color based on a hash of the attribute
    else {
        let hash = 0;
        // Generate a hash value from the attribute string
        for (let i = 0; i < attribute.length; i++) {
            hash = attribute.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Use the hash value to select a color from the fallback colors
        const colorIndex = Math.abs(hash) % fallbackColors.length;
        result = fallbackColors[colorIndex] || fallbackColors[0];
    }

    // Cache the computed color for future use
    colorCache.set(attribute, result);
    // Return the computed color
    return result;
};

interface AttributeTagProps {
    attribute: string; // The attribute to be displayed
}

// Functional component wrapped with memo for performance optimization
const AttributeTag: FC<AttributeTagProps> = memo(({ attribute }) => {
    // Memoize the result of getAttributeColors to avoid unnecessary recalculations
    const { bgColor, textColor } = useMemo(() => getAttributeColors(attribute), [attribute]);

    /* We want it to appear as "attribute iconOrEmoji" on one line If iconOrEmoji is a string (like "🤷" or "🍞"), 
    do string concatenation. If it's a React node (like <Icons.mobile />), render it inline */
    let displayContent;
    const iconOrEmoji = sizeIconMap[attribute] ?? typeEmojiMap[attribute] ?? "";

    if (typeof iconOrEmoji === "string") {
        displayContent = `${attribute} ${iconOrEmoji}`;
    } else {
        displayContent = (<>{attribute} {iconOrEmoji}</>);
    }

    return (
        // Render the attribute
        <span className={`${bgColor} ${textColor} text-balance text-xs sm:text-sm font-semibold mr-2 px-2.5 py-0.5 rounded-lg`}>
            {displayContent}
        </span>
    );
});

// Set display name for better debugging and development experience
AttributeTag.displayName = 'AttributeTag';

interface PlaceCardProps {
    place: Place;
}

export const PlaceCard: FC<PlaceCardProps> = memo(({ place }) => {
    const { showPlaceModal } = useModalContext();

    const description = useMemo(() =>
        place?.description?.trim() || "A third place in the Charlotte, North Carolina area",
        [place?.description]
    );

    const handleCardClick = () => {
        showPlaceModal(place);
    };

    return (
        <Card
            onClick={handleCardClick}
            className="mb-4 cursor-pointer shadow-lg hover:shadow-xl transition-shadow duration-200 rounded-lg w-full card-font">
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

                    <span className="text-sm flex flex-wrap space-x-2">
                        <strong>Type: </strong>
                        {place?.type?.map((tag) => (
                            <AttributeTag key={tag} attribute={tag} />
                        ))}
                    </span>

                    <span className="flex justify-between">
                        <span className="text-sm block">
                            <strong>Neighborhood: </strong>
                            {place?.neighborhood && <AttributeTag attribute={`${place.neighborhood} ${neighborhoodEmoji}`} />}
                        </span>

                        <Button
                            className="!font-bold"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                showPlaceModal(place);
                            }}
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
