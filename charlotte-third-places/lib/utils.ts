import { twMerge } from "tailwind-merge"
import { clsx, type ClassValue } from "clsx"
import { Place, FilterConfig } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes text for improved searching and filtering.
 * This function removes diacritics, replaces specific ligatures,
 * removes most special characters, and converts the text to lowercase.
 * 
 * @param value - The input string to be normalized. Can be null or undefined.
 * @returns A normalized string suitable for case-insensitive, accent-insensitive searching.
 */
export const normalizeTextForSearch = (value: string | null | undefined): string => {
  // Return an empty string if the input is null, undefined, or not a string
  if (value == null || typeof value !== 'string') {
    return '';
  }

  return value
    // Step 1: Normalize Unicode characters to their base form + diacritic mark
    .normalize('NFD')
    // Step 2: Remove all diacritic marks (accent characters)
    .replace(/[\u0300-\u036f]/g, '')
    // Step 3: Replace specific ligatures and special characters
    .replace(/[œ]/g, 'oe')  // Replace 'œ' with 'oe'
    .replace(/[æ]/g, 'ae')  // Replace 'æ' with 'ae'
    .replace(/[ø]/g, 'o')   // Replace 'ø' with 'o'
    .replace(/[ß]/g, 'ss')  // Replace 'ß' with 'ss'
    // Step 4: Remove all special characters except comma, apostrophe, and hyphen
    // \w matches any word character (alphanumeric + underscore)
    // \s matches any whitespace character
    .replace(/[^\w\s,'''-]/g, '')
    // Step 5: Convert the resulting string to lowercase for case-insensitive matching
    .toLowerCase();
};

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * 
 * @param array - The array to shuffle.
 * @returns A new shuffled array.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Shuffles an array ensuring that no two adjacent items have the same 'name' property.
 * If it's impossible to arrange without adjacent duplicates (e.g., all items have the same name),
 * the function returns the shuffled array as is.
 * 
 * @param array - The array to shuffle.
 * @returns A new shuffled array with no adjacent duplicates by 'name', if possible.
 */
export function shuffleArrayNoAdjacentDuplicates<T>(array: T[]): T[] {
  const shuffled = [...array];
  let currentIndex = shuffled.length;

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [shuffled[currentIndex], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[currentIndex],
    ];
  }

  // Check for adjacent duplicates
  for (let i = 0; i < shuffled.length - 1; i++) {
    if (shuffled[i] === shuffled[i + 1]) {
      const swapIndex = (i + 2) % shuffled.length;
      [shuffled[i + 1], shuffled[swapIndex]] = [
        shuffled[swapIndex],
        shuffled[i + 1],
      ];
    }
  }

  return shuffled;
}

/**
 * Returns true if a place passes all active filters in the provided FilterConfig.
 * Each filter uses the convention value === 'all' => ignore.
 * Keep this single source of truth updated when adding or modifying filters.
 */
export function placeMatchesFilters(place: Place, filters: FilterConfig): boolean {
  const { name, type, size, neighborhood, purchaseRequired, parking, freeWiFi, hasCinnamonRolls } = filters;

  const isTypeMatch = type.value === 'all' || (Array.isArray(place.type) && place.type.includes(type.value));
  if (!isTypeMatch) return false;

  if (!(name.value === 'all' || place.name === name.value)) return false;
  if (!(size.value === 'all' || place.size === size.value)) return false;
  if (!(neighborhood.value === 'all' || place.neighborhood === neighborhood.value)) return false;
  if (!(purchaseRequired.value === 'all' || place.purchaseRequired === purchaseRequired.value)) return false;

  const parkingValues = Array.isArray(place.parking) ? place.parking : [];
  if (!(parking.value === 'all' || parkingValues.includes(parking.value))) return false;

  if (!(freeWiFi.value === 'all' || place.freeWiFi === freeWiFi.value)) return false;
  if (!(hasCinnamonRolls.value === 'all' || place.hasCinnamonRolls === hasCinnamonRolls.value)) return false;

  return true;
}

/**
 * Filters an array of places using current filters. Provided for convenience.
 */
export function filterPlaces(places: Place[], filters: FilterConfig): Place[] {
  return places.filter(p => placeMatchesFilters(p, filters));
}
