import { twMerge } from "tailwind-merge"
import { clsx, type ClassValue } from "clsx"
import { Place, FilterConfig } from "./types";

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

/**
 * Parsed markdown node structure for rendering
 */
export interface ParsedMarkdownNode {
  type: 'paragraph' | 'text' | 'bold' | 'italic' | 'strikethrough' | 'link' | 'linebreak';
  content?: string;
  children?: ParsedMarkdownNode[];
  href?: string; // for links
}

/**
 * Complete parsed markdown structure
 */
export interface ParsedMarkdown {
  nodes: ParsedMarkdownNode[];
}

/**
 * Parses Airtable-specific markdown into a structured format for rendering.
 * Handles the specific markdown features that Airtable supports:
 * - **Bold text**
 * - *Italic text*
 * - ~~Strikethrough text~~
 * - [Link text](URL)
 * - Line breaks (preserved as hard breaks)
 * - Paragraph breaks (double line breaks)
 * - Trailing newlines (common in Airtable data)
 * 
 * @param markdown - The Airtable markdown text to parse
 * @returns Structured markdown that can be rendered with full control
 */
export function parseAirtableMarkdown(markdown: string): ParsedMarkdown {
  if (!markdown) {
    return { nodes: [] };
  }

  // Remove trailing newline that Airtable adds and trim
  const cleaned = markdown.replace(/\n$/, '').trim();

  if (!cleaned) {
    return { nodes: [] };
  }

  // Split by paragraph breaks (double newlines or more)
  const paragraphTexts = cleaned.split(/\n\n+/);

  const paragraphs: ParsedMarkdownNode[] = paragraphTexts
    .filter(text => text.trim()) // Remove empty paragraphs
    .map(text => ({
      type: 'paragraph' as const,
      children: parseInlineElements(text.trim())
    }));

  return { nodes: paragraphs };
}

/**
 * Parses inline markdown elements within a paragraph.
 * Handles bold, italic, strikethrough, links, line breaks, and plain text.
 * 
 * @param text - The paragraph text to parse
 * @returns Array of parsed inline nodes
 */
function parseInlineElements(text: string): ParsedMarkdownNode[] {
  const nodes: ParsedMarkdownNode[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    // Check for links first [text](url)
    const linkMatch = remaining.match(/^\[([^\]]*)\]\(([^)]*)\)/);
    if (linkMatch) {
      // Parse the link text for nested formatting
      const linkTextNodes = parseInlineElements(linkMatch[1]);
      if (linkTextNodes.length === 1 && linkTextNodes[0].type === 'text') {
        // Simple case: just text in the link
        nodes.push({
          type: 'link',
          content: linkTextNodes[0].content,
          href: linkMatch[2]
        });
      } else {
        // Complex case: formatted text in the link
        nodes.push({
          type: 'link',
          children: linkTextNodes,
          href: linkMatch[2]
        });
      }
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Check for strikethrough ~~text~~ (must come before other patterns)
    const strikethroughMatch = remaining.match(/^~~([^~]*(?:~(?!~)[^~]*)*)~~/);
    if (strikethroughMatch) {
      // Parse the strikethrough content for nested formatting
      const strikethroughNodes = parseInlineElements(strikethroughMatch[1]);
      if (strikethroughNodes.length === 1 && strikethroughNodes[0].type === 'text') {
        nodes.push({
          type: 'strikethrough',
          content: strikethroughNodes[0].content
        });
      } else {
        nodes.push({
          type: 'strikethrough',
          children: strikethroughNodes
        });
      }
      remaining = remaining.slice(strikethroughMatch[0].length);
      continue;
    }

    // Check for bold **text** (must come before italic to handle ***text***)
    const boldMatch = remaining.match(/^\*\*([^*]*(?:\*(?!\*)[^*]*)*)\*\*/);
    if (boldMatch) {
      // Parse the bold content for nested formatting
      const boldNodes = parseInlineElements(boldMatch[1]);
      if (boldNodes.length === 1 && boldNodes[0].type === 'text') {
        nodes.push({
          type: 'bold',
          content: boldNodes[0].content
        });
      } else {
        nodes.push({
          type: 'bold',
          children: boldNodes
        });
      }
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }    // Check for italic _text_ (Airtable uses underscores)
    const italicMatch = remaining.match(/^_([^_\n]+)_/);
    if (italicMatch) {
      // Parse the italic content for nested formatting
      const italicNodes = parseInlineElements(italicMatch[1]);
      if (italicNodes.length === 1 && italicNodes[0].type === 'text') {
        nodes.push({
          type: 'italic',
          content: italicNodes[0].content
        });
      } else {
        nodes.push({
          type: 'italic',
          children: italicNodes
        });
      }
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Check for single line break (preserved as hard break in Airtable)
    if (remaining.startsWith('\n')) {
      nodes.push({ type: 'linebreak' });
      remaining = remaining.slice(1);
      continue;
    }    // Regular text - take until next special character or end
    const nextSpecial = remaining.search(/[\[*~_\n]/);
    if (nextSpecial === -1) {
      // No more special characters, take the rest
      if (remaining) {
        nodes.push({ type: 'text', content: remaining });
      }
      break;
    } else if (nextSpecial > 0) {
      // Text before next special character
      nodes.push({ type: 'text', content: remaining.slice(0, nextSpecial) });
      remaining = remaining.slice(nextSpecial);
    } else {
      // Special character at start didn't match patterns, treat as text
      nodes.push({ type: 'text', content: remaining[0] });
      remaining = remaining.slice(1);
    }
  }

  return nodes;
}
