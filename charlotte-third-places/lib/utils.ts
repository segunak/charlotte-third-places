import { twMerge } from "tailwind-merge"
import { clsx, type ClassValue } from "clsx"

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
 * Simple gray placeholder image for use with next/image blurDataURL.
 */
export const blurDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8//9/PQAI8wNPvd7POQAAAABJRU5ErkJggg==';

/**
 * Optimizes a Google photo URL by adjusting its width/size parameters.
 * Passes through non-Google URLs unchanged. Leaves restricted gps-cs-s and
 * gps-proxy URLs unmodified since they use a different path structure that
 * may not support standard Google photo sizing parameters.
 *
 * @param url - The photo URL to optimize.
 * @param width - The desired width in pixels (default: 1280).
 * @returns The optimized URL string, or an empty string if invalid.
 */
export const optimizeGooglePhotoUrl = (url: string, width = 1280): string => {
  const cleanedUrl = (typeof url === 'string' && url.startsWith('http')) ? url.trim() : '';

  if (!cleanedUrl) return '';
  if (!cleanedUrl.includes('googleusercontent.com')) return cleanedUrl;

  if (cleanedUrl.includes('/gps-cs-s/') || cleanedUrl.includes('/gps-proxy/')) {
    return cleanedUrl;
  }

  const widthParamRegex = new RegExp(`=[whs]${width}(-[^=]+)?$`);
  if (widthParamRegex.test(cleanedUrl)) return cleanedUrl;

  const sizeRegex = /=[swh]\d+(-[swh]\d+)?(-k-no)?$/;
  if (sizeRegex.test(cleanedUrl)) {
    return cleanedUrl.replace(sizeRegex, `=w${width}-k-no`);
  }

  if (cleanedUrl.includes('=') && !sizeRegex.test(cleanedUrl)) {
    return cleanedUrl;
  }

  if (!cleanedUrl.includes('=')) {
    return cleanedUrl + `=w${width}-k-no`;
  }

  return cleanedUrl;
};

