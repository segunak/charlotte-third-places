import { twMerge } from "tailwind-merge"
import { clsx, type ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes text for improved searching and filtering in AG Grid.
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
export function shuffleArrayNoAdjacentDuplicates<T extends { name: string }>(array: T[]): T[] {
  if (array.length <= 1) return array;

  let shuffled = shuffleArray(array);

  const maxAttempts = 1000;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let hasAdjacentDuplicates = false;

    for (let i = 1; i < shuffled.length; i++) {
      if (shuffled[i].name === shuffled[i - 1].name) {
        hasAdjacentDuplicates = true;

        // Find an element to swap with that doesn't cause a duplicate
        let swapIndex = -1;
        for (let j = shuffled.length - 1; j > i; j--) {
          if (shuffled[j].name !== shuffled[i - 1].name) {
            swapIndex = j;
            break;
          }
        }

        if (swapIndex !== -1) {
          [shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]];
        } else {
          // If no suitable swap found, cannot resolve duplicates in this attempt
          break;
        }
      }
    }

    if (!hasAdjacentDuplicates) {
      return shuffled;
    }

    // Reshuffle and retry
    shuffled = shuffleArray(array);
  }

  // If unable to rearrange to avoid duplicates after maxAttempts, return the shuffled array
  return shuffled;
}
