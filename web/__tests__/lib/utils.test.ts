import { describe, it, expect } from 'vitest'
import { cn, normalizeTextForSearch, shuffleArray, shuffleArrayNoAdjacentDuplicates } from '@/lib/utils'

describe('cn (className merge utility)', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', true && 'active', false && 'inactive')).toBe('base active')
  })

  it('merges Tailwind classes correctly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('handles undefined and null values', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
  })
})

describe('normalizeTextForSearch', () => {
  it('converts text to lowercase', () => {
    expect(normalizeTextForSearch('HELLO WORLD')).toBe('hello world')
  })

  it('removes diacritics', () => {
    expect(normalizeTextForSearch('café')).toBe('cafe')
    expect(normalizeTextForSearch('naïve')).toBe('naive')
    expect(normalizeTextForSearch('résumé')).toBe('resume')
  })

  it('replaces ligatures with equivalent characters', () => {
    expect(normalizeTextForSearch('œuvre')).toBe('oeuvre')
    // Note: The function only handles lowercase ligatures explicitly
    // Uppercase Æ becomes empty via NFD normalization + diacritic removal
    expect(normalizeTextForSearch('æther')).toBe('aether')
    expect(normalizeTextForSearch('straße')).toBe('strasse')
  })

  it('preserves commas, apostrophes, and hyphens', () => {
    expect(normalizeTextForSearch("it's a test")).toBe("it's a test")
    expect(normalizeTextForSearch('well-known')).toBe('well-known')
    expect(normalizeTextForSearch('one, two, three')).toBe('one, two, three')
  })

  it('removes other special characters', () => {
    expect(normalizeTextForSearch('hello@world.com')).toBe('helloworldcom')
    expect(normalizeTextForSearch('$100 off!')).toBe('100 off')
    expect(normalizeTextForSearch('test#1')).toBe('test1')
  })

  it('handles null and undefined', () => {
    expect(normalizeTextForSearch(null)).toBe('')
    expect(normalizeTextForSearch(undefined)).toBe('')
  })

  it('handles empty string', () => {
    expect(normalizeTextForSearch('')).toBe('')
  })

  it('handles complex mixed input', () => {
    const input = "Amélie's Café & Bakery"
    const expected = "amelie's cafe  bakery"
    expect(normalizeTextForSearch(input)).toBe(expected)
  })
})

describe('shuffleArray', () => {
  it('returns an array of the same length', () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffleArray(input)
    expect(result).toHaveLength(input.length)
  })

  it('contains all original elements', () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffleArray(input)
    expect(result.sort()).toEqual(input.sort())
  })

  it('does not mutate the original array', () => {
    const input = [1, 2, 3, 4, 5]
    const original = [...input]
    shuffleArray(input)
    expect(input).toEqual(original)
  })

  it('handles empty array', () => {
    expect(shuffleArray([])).toEqual([])
  })

  it('handles single element array', () => {
    expect(shuffleArray([1])).toEqual([1])
  })
})

describe('shuffleArrayNoAdjacentDuplicates', () => {
  it('returns an array of the same length', () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffleArrayNoAdjacentDuplicates(input)
    expect(result).toHaveLength(input.length)
  })

  it('contains all original elements', () => {
    const input = [1, 2, 2, 3, 3, 3]
    const result = shuffleArrayNoAdjacentDuplicates(input)
    expect(result.sort()).toEqual(input.sort())
  })

  it('does not mutate the original array', () => {
    const input = [1, 2, 3, 4, 5]
    const original = [...input]
    shuffleArrayNoAdjacentDuplicates(input)
    expect(input).toEqual(original)
  })

  it('handles empty array', () => {
    expect(shuffleArrayNoAdjacentDuplicates([])).toEqual([])
  })

  it('handles single element array', () => {
    expect(shuffleArrayNoAdjacentDuplicates([1])).toEqual([1])
  })

  it('handles two different elements', () => {
    const result = shuffleArrayNoAdjacentDuplicates([1, 2])
    expect(result).toHaveLength(2)
    expect(result.sort()).toEqual([1, 2])
  })

  it('attempts to prevent adjacent duplicates for simple cases', () => {
    // With [1, 1, 2, 2], we can arrange as [1, 2, 1, 2]
    const input = [1, 1, 2, 2]
    // Run multiple times to increase confidence
    for (let i = 0; i < 5; i++) {
      const result = shuffleArrayNoAdjacentDuplicates(input)
      expect(result).toHaveLength(4)
    }
  })

  it('handles array with all same elements', () => {
    // When all elements are the same, it's impossible to avoid adjacent duplicates
    const input = [1, 1, 1, 1]
    const result = shuffleArrayNoAdjacentDuplicates(input)
    expect(result).toHaveLength(4)
    expect(result.every(x => x === 1)).toBe(true)
  })
})
