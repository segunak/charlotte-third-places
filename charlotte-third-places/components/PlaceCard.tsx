import { Place } from "@/lib/types";
import { FC, useMemo, memo, useRef, useState, useEffect, useCallback } from "react";
import { Icons } from "@/components/Icons";
import { cn } from "@/lib/utils";
import { parseAirtableMarkdown } from "@/lib/parsing";
import { Button } from "@/components/ui/button";
import { useModalContext } from "@/contexts/ModalContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getPlaceHighlights } from "@/components/PlaceHighlights";

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
    "Lounge": "🛋️",
    "Museum": "🏛️",
    "Other": "🤷🏾",
    "Photo Shop": "📷",
    "Comic Book Store": "🦸",
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
    icon?: React.ReactNode; // Optional icon to display after attribute
    /**
     * Optional className to override default styles.
     * 
     * IMPORTANT: AttributeTag has NO default margin (mr-0). Callers must explicitly add
     * margin classes (e.g., "mr-2") when spacing between multiple tags is needed.
     * This design choice ensures the last tag in a row (like Neighborhood) doesn't have
     * unwanted trailing space that could cause layout issues with adjacent elements.
     */
    className?: string;
}

/**
 * Displays an attribute as a styled tag with a colored background and optional icon/emoji.
 * 
 * Key styling decisions:
 * - `whitespace-nowrap`: Prevents text + emoji from wrapping mid-tag (e.g., "Coffee" on one line, "☕" on the next)
 * - No default margin: Callers control spacing via className prop
 * - Uses cn() for class merging so callers can override padding (e.g., pr-0 for tight spaces)
 */
const AttributeTag: FC<AttributeTagProps> = memo(({ attribute, icon, className }) => {
    // Memoize the result of getAttributeColors to avoid unnecessary recalculations
    const { bgColor, textColor } = useMemo(() => getAttributeColors(attribute), [attribute]);

    /* We want it to appear as "attribute iconOrEmoji" on one line If iconOrEmoji is a string (like "🤷" or "🍞"), 
    do string concatenation. If it's a React node (like <Icons.mobile />), render it inline */
    let displayContent;
    const iconOrEmoji = icon ?? sizeIconMap[attribute] ?? typeEmojiMap[attribute] ?? "";

    if (typeof iconOrEmoji === "string") {
        displayContent = `${attribute} ${iconOrEmoji}`;
    } else {
        displayContent = (<>{attribute} {iconOrEmoji}</>);
    }

    return (
        <span className={cn(
            bgColor,
            textColor,
            "whitespace-nowrap text-xs font-semibold px-1.5 py-0.5 rounded-lg",
            className
        )}>
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
    const { showPlaceModal, showPlacePhotos, showPlaceChat } = useModalContext();
    const highlights = getPlaceHighlights(place);
    const isOpeningSoon = !!highlights.gradients.card && highlights.ribbon?.label === 'Opening Soon';

    const description = useMemo(() => {
        const raw = place?.description?.trim();
        if (!raw) {
            return "A third place in the Charlotte, North Carolina area";
        }
        // Get plain text from Airtable markdown so that description previews don't show raw markdown syntax
        try {
            return parseAirtableMarkdown(raw, { plain: true }).plainText || "";
        } catch {
            return raw;
        }
    }, [place?.description]);

    const handleCardClick = () => {
        showPlaceModal(place);
    };

    // Only show photos button if photos exist
    const hasPhotos = !!(place?.photos && place.photos.length > 0);
    const shouldShowPhotosButton = hasPhotos;
    const BADGE_BASE_CLASS = 'inline-flex items-center justify-center rounded-full shadow-md';
    const DEFAULT_BADGE_PADDING = 'p-1.5';
    // Badges array already ordered so that most important (lowest numeric priority) ends up at the far right.
    const badges = highlights.badges;

    /**
     * OVERFLOW DETECTION FOR TYPE ROW
     * 
     * Problem: Places can have multiple types (e.g., "Comic Book Store", "Game Store", "Ice Cream Shop").
     * Long type names or many types can overflow the card width, causing ugly wrapping.
     * 
     * Solution: Dynamically calculate how many type tags fit, and show "+N more" for the rest.
     * 
     * Edge cases handled:
     * 1. Long individual type names (e.g., "Comic Book Store" takes more space than "Café")
     * 2. Multiple types that together exceed available width
     * 3. Always show at least 2 types (if they exist) to maintain visual consistency
     * 4. Reserve space for "+N more" indicator when calculating fit
     * 5. Recalculate on window resize for responsive behavior
     * 
     * Example: "Comic Book Store", "Game Store", "Ice Cream Shop" → "Comic Book Store", "Game Store", "+1 more"
     */
    const typeContainerRef = useRef<HTMLSpanElement>(null);
    const [visibleTypeCount, setVisibleTypeCount] = useState(place?.type?.length ?? 0);

    const calculateVisibleTypes = useCallback(() => {
        const container = typeContainerRef.current;
        if (!container || !place?.type?.length) return;

        const containerWidth = container.clientWidth;
        const children = Array.from(container.children) as HTMLElement[];
        
        // Find the "Type:" label width (first child)
        let usedWidth = children[0]?.offsetWidth ?? 0;
        usedWidth += 8; // space-x-2 gap
        
        let fitCount = 0;
        const moreIndicatorWidth = 70; // Approximate width for "+N more" badge
        
        for (let i = 1; i < children.length; i++) {
            const child = children[i];
            if (!child || child.dataset.moreIndicator) continue;
            
            const childWidth = child.offsetWidth + 8; // Include gap
            const remainingTypes = place.type.length - fitCount;
            const needsMoreIndicator = remainingTypes > 1;
            const reservedWidth = needsMoreIndicator ? moreIndicatorWidth : 0;
            
            if (usedWidth + childWidth + reservedWidth <= containerWidth) {
                usedWidth += childWidth;
                fitCount++;
            } else {
                break;
            }
        }
        
        // Show at least 2 types if they exist
        const minTypes = Math.min(2, place.type.length);
        setVisibleTypeCount(Math.max(minTypes, fitCount));
    }, [place?.type?.length]);

    useEffect(() => {
        calculateVisibleTypes();
        window.addEventListener('resize', calculateVisibleTypes);
        return () => window.removeEventListener('resize', calculateVisibleTypes);
    }, [calculateVisibleTypes]);

    /**
     * OVERFLOW HANDLING FOR NEIGHBORHOOD ROW
     * 
     * Problem: The Neighborhood row shares space with action buttons (Chat, Photos, Info).
     * Long neighborhood names (e.g., "North Sharon Amity / Reddman Road") can collide with buttons.
     * 
     * Solution: Deterministic character-length check instead of runtime DOM measurement.
     * This eliminates flickering because the value is computed once and never changes.
     * 
     * Threshold: 13 characters (based on actual data analysis)
     * - We append " 🏘️" (space + emoji) which adds ~3 character widths
     * - So effective display length = neighborhood.length + 3
     * - Threshold of 13 catches neighborhoods like "West Sugar Creek" (16 chars)
     *   that would otherwise overflow when the emoji is added
     * 
     * When overflow is predicted, we apply ALL of these:
     * - Reduced right padding (pr-[2px]) - recovers ~4px
     * - Reduced font size (text-[0.7rem]) - recovers ~10px  
     * - Text truncation with ellipsis as final fallback
     */
    const neighborhoodRowRef = useRef<HTMLSpanElement>(null);
    const neighborhoodTextRef = useRef<HTMLSpanElement>(null);
    
    const NEIGHBORHOOD_CHAR_THRESHOLD = 13;
    const neighborhoodOverflows = useMemo(() => {
        if (!place?.neighborhood) return false;
        return place.neighborhood.length > NEIGHBORHOOD_CHAR_THRESHOLD;
    }, [place?.neighborhood]);

    const displayTitle = useMemo(() => {
        return place?.name || '';
    }, [place?.name]);

    // Base class plus optional gradient from highlights
    const cardClassName = useMemo(() => {
        const baseClass = "mb-4 cursor-pointer shadow-lg hover:shadow-xl transition-shadow duration-200 rounded-lg w-full card-font relative";
        return highlights.gradients.card ? `${baseClass} ${highlights.gradients.card}` : baseClass;
    }, [highlights.gradients.card]);

    return (
        <Card
            onClick={handleCardClick}
            className={cardClassName}>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg flex-1 min-w-0 leading-tight truncate">
                        {displayTitle}
                    </CardTitle>
                    <div className="flex items-center space-x-2 flex-shrink-0 h-3">
                        {badges.map(badge => (
                            <div
                                key={badge.key}
                                className={`${badge.bgClass} ${BADGE_BASE_CLASS} ${badge.paddingClass ?? DEFAULT_BADGE_PADDING}`}
                                aria-label={badge.ariaLabel}
                            >
                                <span className="inline-flex items-center">
                                    {badge.icon}
                                    {badge.label && (
                                        <span className="ml-1 text-xs font-semibold leading-none text-white whitespace-nowrap">{badge.label}</span>
                                    )}
                                </span>
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
                    {/* TYPE ROW: Uses overflow detection to show only types that fit, with "+N more" for extras.
                        - ref={typeContainerRef}: Used by calculateVisibleTypes() to measure available width
                        - flex-nowrap: Prevents types from wrapping to next line (we handle overflow with "+N more" instead)
                        - overflow-hidden: Clips any content that might still exceed bounds
                        - h-6: Fixed height prevents layout shift when type count changes */}
                    <span 
                        ref={typeContainerRef}
                        className="text-sm flex flex-nowrap items-center space-x-2 h-6 overflow-hidden"
                    >
                        <strong>Type: </strong>
                        {place?.type?.slice(0, visibleTypeCount).map((tag) => (
                            <AttributeTag key={tag} attribute={tag} />
                        ))}
                        {place?.type && place.type.length > visibleTypeCount && (
                            <span 
                                data-more-indicator="true"
                                className="bg-gray-200 text-gray-700 whitespace-nowrap text-xs font-semibold px-1.5 py-0.5 rounded-lg"
                            >
                                +{place.type.length - visibleTypeCount} more
                            </span>
                        )}
                    </span>

                    {/* NEIGHBORHOOD ROW: Shares space with action buttons, uses smart overflow handling.
                        - ref={neighborhoodRowRef}: Used by checkNeighborhoodOverflow() to measure available width
                        - justify-between: Pushes neighborhood text to left, buttons to right
                        - gap-2: Ensures minimum spacing between text and buttons */}
                    <span ref={neighborhoodRowRef} className="flex justify-between gap-2">
                        {/* Neighborhood text container:
                            - min-w-0: Allows flex item to shrink below content size (required for truncation)
                            - flex-1: Takes remaining space after buttons
                            - whitespace-nowrap: Prevents wrapping (we use ellipsis instead)
                            - overflow-hidden: Required for text-ellipsis to work
                            - text-ellipsis: Only applied when neighborhoodOverflows is true */}
                        <span 
                            ref={neighborhoodTextRef}
                            className={`text-sm block min-w-0 flex-1 whitespace-nowrap overflow-hidden ${neighborhoodOverflows ? 'text-ellipsis' : ''}`}
                        >
                            <strong>Neighborhood: </strong>
                            {/* AttributeTag gets pr-[2px] and text-[0.7rem] when overflow detected.
                                Using minimal padding (2px) instead of zero maintains visual breathing room.
                                All optimizations applied together to prevent flickering. */}
                            {place?.neighborhood && (
                                <AttributeTag 
                                    className={cn(
                                        neighborhoodOverflows && 'pr-[2px]',
                                        neighborhoodOverflows && 'text-[0.7rem]'
                                    )} 
                                    attribute={`${place.neighborhood} ${neighborhoodEmoji}`} 
                                />
                            )}
                        </span>

                        {/* Action buttons container:
                            - flex-shrink-0: CRITICAL - prevents buttons from compressing when space is tight
                            - data-buttons: Used by checkNeighborhoodOverflow() to measure button width */}
                        <div data-buttons className="flex space-x-2 flex-shrink-0">
                            <Button
                                variant="default"
                                size="icon"
                                className="h-9 w-9 rounded-full"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent click from bubbling to Card
                                    showPlaceChat(place);
                                }}
                                aria-label="Ask AI about this place"
                            >
                                <Icons.chat className="h-5 w-5 text-primary-foreground" />
                            </Button>
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
                                    <Icons.photoGallery className="h-5 w-5 text-primary-foreground" />
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
