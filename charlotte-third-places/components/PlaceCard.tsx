import { Place } from "@/lib/types";
import { FC, useMemo, memo } from "react";
import { Icons } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { useModalContext } from "@/contexts/ModalContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const neighborhoodEmoji = "🏘️";

const sizeIconMap: { [key: string]: React.ReactNode } = {
    "Small": <Icons.mobile className="inline-block h-3 w-3" />,
    "Medium": <Icons.tablet className="inline-block h-3 w-3" />,
    "Large": <Icons.desktop className="inline-block h-3 w-3" />,
    "Unsure": "🤷🏾",
};

const typeEmojiMap: { [key: string]: string } = {
    "Bakery": "🍞",
    "Bottle Shop": "🍷",
    "Café": "☕",
    "Coffee Shop": "☕",
    "Tea House": "🍵",
    "Bubble Tea Shop": "🧋",
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
    "Eatery": "🍴",
    "Creamery": "🍦",
    "Ice Cream Shop": "🍨",
    "Art Gallery": "🖼️",
    "Bar": "🍸",
    "Community Center": "🤝",
    "Coworking Space": "💻",
    "Museum": "🏛️",
    "Other": "🤷🏾",
};

// Predefined color mappings for tag backgrounds and text
const colorMap: { [key: string]: { bgColor: string; textColor: string } } = {
    "Cafe": { bgColor: "bg-blue-200", textColor: "text-blue-900" },             // Light blue background, dark blue text
    "Coffee Shop": { bgColor: "bg-yellow-200", textColor: "text-yellow-900" }, // Light yellow background, dark yellow text
    "Unsure": { bgColor: "bg-gray-300", textColor: "text-gray-900" },          // Light gray background, dark gray text for "Unsure"
};

const typeColorPalette = [
    { bgColor: "bg-orange-200", textColor: "text-orange-900" },   // Light orange background, dark orange text
    { bgColor: "bg-teal-200", textColor: "text-teal-900" },       // Light teal background, dark teal text
    { bgColor: "bg-indigo-200", textColor: "text-indigo-900" },   // Light indigo background, dark indigo text
    { bgColor: "bg-pink-200", textColor: "text-pink-900" },       // Light pink background, dark pink text
    { bgColor: "bg-lime-200", textColor: "text-lime-900" },       // Light lime background, dark lime text
    { bgColor: "bg-amber-200", textColor: "text-amber-900" },     // Light amber background, dark amber text
    { bgColor: "bg-fuchsia-200", textColor: "text-fuchsia-900" }, // Light fuchsia background, dark fuchsia text
    { bgColor: "bg-rose-200", textColor: "text-rose-900" },       // Light rose background, dark rose text
    { bgColor: "bg-cyan-200", textColor: "text-cyan-900" },       // Light cyan background, dark cyan text
    { bgColor: "bg-violet-200", textColor: "text-violet-900" },   // Light violet background, dark violet text
    { bgColor: "bg-emerald-200", textColor: "text-emerald-900" }, // Light emerald background, dark emerald text
    { bgColor: "bg-yellow-300", textColor: "text-yellow-900" },   // Bright yellow background, dark yellow text
    { bgColor: "bg-red-200", textColor: "text-red-900" },         // Light red background, dark red text
    { bgColor: "bg-purple-200", textColor: "text-purple-900" },   // Light purple background, dark purple text
    { bgColor: "bg-green-200", textColor: "text-green-900" },     // Light green background, dark green text
    { bgColor: "bg-blue-300", textColor: "text-blue-900" },       // Bright blue background, dark blue text
    { bgColor: "bg-pink-300", textColor: "text-pink-900" },       // Bright pink background, dark pink text
    { bgColor: "bg-amber-300", textColor: "text-amber-900" },     // Bright amber background, dark amber text
    { bgColor: "bg-lime-300", textColor: "text-lime-900" },       // Bright lime background, dark lime text
    { bgColor: "bg-teal-300", textColor: "text-teal-900" },       // Bright teal background, dark teal text
    { bgColor: "bg-fuchsia-300", textColor: "text-fuchsia-900" }, // Bright fuchsia background, dark fuchsia text
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

    // If the attribute is empty or only contains whitespace, use the first mapped color
    if (!attribute || attribute.trim() === "") {
        result = typeColorPalette[0];
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

        // Use the hash value to select a color from the mapped colors
        const colorIndex = Math.abs(hash) % typeColorPalette.length;
        result = typeColorPalette[colorIndex] || typeColorPalette[0];
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
        <span className={`${bgColor} ${textColor} text-balance text-xs font-semibold mr-2 px-1.5 py-0.5 rounded-lg`}>
            {displayContent}
        </span>
    );
});

// This only matters for development, so we can see the name of the component in the React DevTools
AttributeTag.displayName = 'AttributeTag';

interface PlaceCardProps {
    place: Place;
}

export const PlaceCard: FC<PlaceCardProps> = memo(({ place }) => {
    const { showPlaceModal, showPlacePhotos } = useModalContext();

    const description = useMemo(() =>
        place?.description?.trim() || "A third place in the Charlotte, North Carolina area",
        [place?.description]
    );

    const handleCardClick = () => {
        showPlaceModal(place);
    };

    // Only show photos button if photos exist
    const hasPhotos = !!(place?.photos && place.photos.length > 0);
    const shouldShowPhotosButton = hasPhotos;

    // Badge rendering defaults (centralized for consistency and easy future updates)
    // Use inline-flex to keep badges sized to their content + padding and prevent vertical stretching
    const BADGE_BASE_CLASS = 'inline-flex items-center justify-center rounded-full shadow-md';
    const DEFAULT_BADGE_PADDING = 'p-1.5';

    // Create badges array for flexible badge management
    const badges = useMemo(() => {
        const badgeList: Array<{
            key: string;
            icon: React.ReactNode;
            bgColor: string;
            priority: number;
            // Optional per-badge padding override (e.g., 'p-1', 'px-2 py-1')
            paddingClass?: string;
            // Tooltip/title for the badge
            title?: string;
        }> = [];

        // We assign priorities incrementally so that visual order follows insertion order (left -> right),
        // while the featured badge is always forced to the far right with a very high priority.
        let nextPriority = 0;

        if (place?.tags?.includes("Ethiopian")) {
            badgeList.push({
                key: 'ethiopian',
                icon: <Icons.ethiopianFlag className="h-6 w-6" />,
                bgColor: 'bg-amber-100',
                title: 'Ethiopian Business',
                priority: nextPriority++,
            });
        }

        if (place?.tags?.includes("Black Owned")) {
            badgeList.push({
                key: 'blackOwned',
                icon: <Icons.panAfricanFlag className="h-6 w-6" />,
                bgColor: 'bg-amber-100',
                title: 'Black-owned Business',
                priority: nextPriority++,
            });
        }

        if (place?.tags?.includes("Christian")) {
            badgeList.push({
                key: 'christian',
                icon: <Icons.cross className="h-6 w-6 text-amber-900" />,
                bgColor: 'bg-amber-100',
                title: 'Christian Business',
                priority: nextPriority++,
            });
        }

        if (place?.hasCinnamonRolls === 'Yes' || place?.hasCinnamonRolls === 'TRUE' || place?.hasCinnamonRolls === 'true') {
            badgeList.push({
                key: 'cinnamonRoll',
                icon: <Icons.cinnamonRoll className="h-7 w-7" />,
                // Custom padding to give the larger icon more breathing room within the circle
                paddingClass: 'p-1',
                bgColor: 'bg-amber-100',
                title: 'Has Cinnamon Rolls',
                priority: nextPriority++
            });
        }

        // Add featured badge (star) - always has highest priority to be rightmost
        if (place?.featured) {
            badgeList.push({
                key: 'featured',
                icon: <Icons.star className="h-5 w-5 text-white fill-white" />,
                bgColor: 'bg-amber-500',
                title: 'Featured Place',
                priority: Number.MAX_SAFE_INTEGER
            });
        }

        // Sort by priority (highest priority = rightmost position)
        return badgeList.sort((a, b) => a.priority - b.priority);
    }, [place?.hasCinnamonRolls, place?.featured, place?.tags]); // Always use full name - CSS flex layout will handle truncation

    const displayTitle = useMemo(() => {
        return place?.name || '';
    }, [place?.name]);

    return (
        <Card
            onClick={handleCardClick}
            className="mb-4 cursor-pointer shadow-lg hover:shadow-xl transition-shadow duration-200 rounded-lg w-full card-font relative">
            <CardHeader className="pb-2">
                {/* Flex container for title and badges */}
                <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg flex-1 min-w-0 leading-tight truncate">
                        {displayTitle}
                    </CardTitle>
                    {/* Badges container - always rendered to keep header height constant
                        even when no badges exist. */}
                    <div className="flex items-center space-x-2 flex-shrink-0 h-3">
                        {badges.map((badge) => (
                            <div
                                key={badge.key}
                                className={`${badge.bgColor} ${BADGE_BASE_CLASS} ${badge.paddingClass ?? DEFAULT_BADGE_PADDING}`}
                                title={badge.title}
                            >
                                {badge.icon}
                            </div>
                        ))}
                    </div>
                </div>
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

                          {/* Type chips row normalization:
                              - Wrapping to multiple lines was a primary source of card height variance.
                              - We force a single-line row and clip overflow to keep card height constant.
                              - h-6 reserves a consistent line height matching the chip size. */}
                          <span className="text-sm flex flex-nowrap items-center space-x-2 h-6 overflow-hidden">
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

                        <div className="flex space-x-2">
                            {shouldShowPhotosButton && (
                                <Button
                                    variant="default"
                                    size="icon"
                                    className="h-9 w-9 rounded-full"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent click from bubbling to Card
                                        showPlacePhotos(place, 'card'); // Specify origin as 'card'
                                    }}
                                    aria-label="View photos"
                                >
                                    <Icons.camera className="h-5 w-5 text-primary-foreground" />
                                </Button>
                            )}
                            <Button
                                variant="default"
                                size="icon"
                                className="h-9 w-9 rounded-full"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent click from bubbling to Card
                                    showPlaceModal(place);
                                }}
                                aria-label="More information"
                            >
                                <Icons.infoCircle className="h-5 w-5 text-primary-foreground" />
                            </Button>
                        </div>
                    </span>
                </span>
            </CardContent>
        </Card>
    );
});

// This only matters for development, so we can see the name of the component in the React DevTools
PlaceCard.displayName = 'PlaceCard';
