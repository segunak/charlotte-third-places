import { Icons } from "@/components/Icons";

export interface PlaceTypeConfig {
  icon: React.ComponentType<any>;
  emoji: string;
  mapColor: string;
}

/**
 * Centralized configuration for all place types.
 * Each type maps to its icon, emoji, and map marker color.
 *
 * IMPORTANT: When adding new types, ensure the mapColor is UNIQUE.
 * Check existing mapColor values before choosing a new one.
 */
export const placeTypeConfig: Record<string, PlaceTypeConfig> = {
  "Arcade": {
    icon: Icons.arcade,
    emoji: "🕹️",
    mapColor: "#39FF14", // Neon Green
  },
  "Art Gallery": {
    icon: Icons.palette,
    emoji: "🖼️",
    mapColor: "#FF00DC", // Vivid Magenta
  },
  "Bakery": {
    icon: Icons.breadSlice,
    emoji: "🍞",
    mapColor: "#FFC649", // Saffron Yellow
  },
  "Bar": {
    icon: Icons.cocktail,
    emoji: "🍸",
    mapColor: "#8B008B", // Dark Magenta
  },
  "Bookstore": {
    icon: Icons.openBook,
    emoji: "📖",
    mapColor: "#144EE3", // Laser Blue
  },
  "Bottle Shop": {
    icon: Icons.wineBottle,
    emoji: "🍷",
    mapColor: "#800020", // Burgundy Wine Red
  },
  "Brewery": {
    icon: Icons.beer,
    emoji: "🍺",
    mapColor: "#C21807", // Chili Red
  },
  "Bubble Tea Shop": {
    icon: Icons.bubbleTea,
    emoji: "🧋",
    mapColor: "#FF00FF", // Magenta
  },
  "Café": {
    icon: Icons.coffeeMug,
    emoji: "☕",
    mapColor: "#FF1493", // Deep Pink
  },
  "Coffee Shop": {
    icon: Icons.coffee,
    emoji: "☕",
    mapColor: "#00BFFF", // Deep Sky Blue
  },
  "Collectibles Shop": {
    icon: Icons.gem,
    emoji: "💎",
    mapColor: "#B8860B", // Dark Goldenrod
  },
  "Comic Book Store": {
    icon: Icons.comicBook,
    emoji: "🦸",
    mapColor: "#FF4500", // Orange Red
  },
  "Community Center": {
    icon: Icons.users,
    emoji: "🤝",
    mapColor: "#9400D3", // Dark Violet
  },
  "Coworking Space": {
    icon: Icons.laptop,
    emoji: "💻",
    mapColor: "#00CED1", // Dark Turquoise
  },
  "Creamery": {
    icon: Icons.iceCream,
    emoji: "🍦",
    mapColor: "#FF69B4", // Hot Pink
  },
  "Deli": {
    icon: Icons.fastFood,
    emoji: "🥪",
    mapColor: "#D2691E", // Chocolate Brown
  },
  "Eatery": {
    icon: Icons.utensils,
    emoji: "🍴",
    mapColor: "#DA70D6", // Orchid
  },
  "Game Store": {
    icon: Icons.gamepad,
    emoji: "🎮",
    mapColor: "#107C10", // Microsoft Green
  },
  "Garden": {
    icon: Icons.plantSeed,
    emoji: "🪴",
    mapColor: "#50C878", // Emerald Green
  },
  "Grocery Store": {
    icon: Icons.shoppingCart,
    emoji: "🛒",
    mapColor: "#00A651", // Publix Green
  },
  "Ice Cream Shop": {
    icon: Icons.iceCream,
    emoji: "🍨",
    mapColor: "#FF77FF", // Light Fuchsia Pink
  },
  "Library": {
    icon: Icons.book,
    emoji: "📚",
    mapColor: "#BF00FF", // Purple
  },
  "Lounge": {
    icon: Icons.couch,
    emoji: "🛋️",
    mapColor: "#708090", // Slate Gray
  },
  "Market": {
    icon: Icons.store,
    emoji: "🛍️",
    mapColor: "#FF7F50", // Coral
  },
  "Market Hall": {
    icon: Icons.store,
    emoji: "🏬",
    mapColor: "#20B2AA", // Light Sea Green
  },
  "Museum": {
    icon: Icons.museum,
    emoji: "🏛️",
    mapColor: "#8A2BE2", // Blue Violet
  },
  "Other": {
    icon: Icons.queen,
    emoji: "🤷🏾",
    mapColor: "#6B7280", // Gray
  },
  "Photo Shop": {
    icon: Icons.camera,
    emoji: "📷",
    mapColor: "#9333EA", // Purple (unique shade)
  },
  "Pickleball Club": {
    icon: Icons.pickleball,
    emoji: "🏓",
    mapColor: "#32CD32", // Lime Green
  },
  "Public Market": {
    icon: Icons.store,
    emoji: "🏪",
    mapColor: "#FFD700", // Gold
  },
  "Restaurant": {
    icon: Icons.utensils,
    emoji: "🍽️",
    mapColor: "#FF0033", // Bright Red
  },
  "Social Club": {
    icon: Icons.users,
    emoji: "🎉",
    mapColor: "#E066FF", // Medium Orchid
  },
  "Tea House": {
    icon: Icons.teaCup,
    emoji: "🍵",
    mapColor: "#00FF00", // Bright Green
  },
};

// Fallback values for unknown types
const FALLBACK_ICON = Icons.queen;
const FALLBACK_EMOJI = "🤷🏾";
const FALLBACK_COLOR = "#3B82F6"; // Default blue

/**
 * Get the icon component for a place type.
 */
export function getPlaceTypeIcon(
  placeTypes: string | string[] | undefined
): React.ComponentType<any> {
  if (!placeTypes) return FALLBACK_ICON;
  const type = Array.isArray(placeTypes) ? placeTypes[0] : placeTypes;
  return placeTypeConfig[type]?.icon ?? FALLBACK_ICON;
}

/**
 * Get the emoji for a place type.
 * Returns empty string if the type is not found (allows caller to handle fallback).
 */
export function getPlaceTypeEmoji(
  placeTypes: string | string[] | undefined
): string {
  if (!placeTypes) return "";
  const type = Array.isArray(placeTypes) ? placeTypes[0] : placeTypes;
  return placeTypeConfig[type]?.emoji ?? "";
}

/**
 * Get the map marker color for a place type.
 * Returns the configured hex color or the fallback color.
 */
export function getPlaceTypeColor(
  placeTypes: string | string[] | undefined
): string {
  if (!placeTypes) return FALLBACK_COLOR;
  const type = Array.isArray(placeTypes) ? placeTypes[0] : placeTypes;
  return placeTypeConfig[type]?.mapColor ?? FALLBACK_COLOR;
}

/**
 * Get all existing mapColor values from the config.
 * Useful for verifying color uniqueness when adding new types.
 */
export function getAllMapColors(): string[] {
  return Object.values(placeTypeConfig).map((cfg) => cfg.mapColor);
}
