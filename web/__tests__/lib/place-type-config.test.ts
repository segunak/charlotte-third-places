import { describe, it, expect } from 'vitest'
import {
  placeTypeConfig,
  getPlaceTypeIcon,
  getPlaceTypeEmoji,
  getPlaceTypeColor,
  getAllMapColors,
  type PlaceTypeConfig
} from '@/lib/place-type-config'

describe('placeTypeConfig', () => {
  it('contains all expected place types', () => {
    const expectedTypes = [
      'Arcade',
      'Art Gallery',
      'Bakery',
      'Bar',
      'Bookstore',
      'Bottle Shop',
      'Brewery',
      'Bubble Tea Shop',
      'Café',
      'Coffee Shop',
      'Comic Book Store',
      'Community Center',
      'Coworking Space',
      'Creamery',
      'Deli',
      'Eatery',
      'Game Store',
      'Garden',
      'Grocery Store',
      'Ice Cream Shop',
      'Library',
      'Lounge',
      'Market',
      'Market Hall',
      'Museum',
      'Other',
      'Photo Shop',
      'Pickleball Club',
      'Public Market',
      'Restaurant',
      'Social Club',
      'Tea House'
    ]

    expectedTypes.forEach(type => {
      expect(placeTypeConfig[type]).toBeDefined()
    })
  })

  it('each place type has required properties', () => {
    Object.entries(placeTypeConfig).forEach(([type, config]) => {
      expect(config.icon, `${type} should have an icon`).toBeDefined()
      expect(config.emoji, `${type} should have an emoji`).toBeDefined()
      expect(config.mapColor, `${type} should have a mapColor`).toBeDefined()
    })
  })

  it('all map colors are valid hex colors', () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/

    Object.entries(placeTypeConfig).forEach(([type, config]) => {
      expect(
        hexColorRegex.test(config.mapColor),
        `${type} mapColor "${config.mapColor}" should be a valid hex color`
      ).toBe(true)
    })
  })

  it('all emojis are non-empty strings', () => {
    Object.entries(placeTypeConfig).forEach(([type, config]) => {
      expect(typeof config.emoji).toBe('string')
      expect(config.emoji.length).toBeGreaterThan(0)
    })
  })
})

describe('getAllMapColors', () => {
  it('returns an array of hex colors', () => {
    const colors = getAllMapColors()
    expect(Array.isArray(colors)).toBe(true)
    expect(colors.length).toBeGreaterThan(0)
  })

  it('returns all map colors from the config', () => {
    const colors = getAllMapColors()
    const expectedColors = Object.values(placeTypeConfig).map(c => c.mapColor)
    expect(colors).toEqual(expectedColors)
  })

  it('all returned colors are unique', () => {
    const colors = getAllMapColors()
    const uniqueColors = new Set(colors)
    expect(
      uniqueColors.size,
      'Map colors should be unique to distinguish place types on the map'
    ).toBe(colors.length)
  })
})

describe('getPlaceTypeIcon', () => {
  it('returns icon for a valid place type string', () => {
    const icon = getPlaceTypeIcon('Coffee Shop')
    expect(icon).toBeDefined()
    expect(typeof icon).toBe('function') // React components are functions
  })

  it('returns icon for first type in array', () => {
    const icon = getPlaceTypeIcon(['Bakery', 'Café'])
    const expectedIcon = placeTypeConfig['Bakery'].icon
    expect(icon).toBe(expectedIcon)
  })

  it('returns fallback icon for undefined', () => {
    const fallbackIcon = getPlaceTypeIcon(undefined)
    expect(fallbackIcon).toBeDefined()
  })

  it('returns fallback icon for unknown type', () => {
    const fallbackIcon = getPlaceTypeIcon('Unknown Type That Does Not Exist')
    expect(fallbackIcon).toBeDefined()
  })

  it('returns fallback icon for empty array', () => {
    const icon = getPlaceTypeIcon([])
    expect(icon).toBeDefined()
  })
})

describe('getPlaceTypeEmoji', () => {
  it('returns emoji for a valid place type string', () => {
    expect(getPlaceTypeEmoji('Coffee Shop')).toBe('☕')
    expect(getPlaceTypeEmoji('Library')).toBe('📚')
    expect(getPlaceTypeEmoji('Arcade')).toBe('🕹️')
  })

  it('returns emoji for first type in array', () => {
    const emoji = getPlaceTypeEmoji(['Bakery', 'Café'])
    expect(emoji).toBe('🍞') // Bakery emoji
  })

  it('returns empty string for undefined', () => {
    expect(getPlaceTypeEmoji(undefined)).toBe('')
  })

  it('returns empty string for unknown type', () => {
    expect(getPlaceTypeEmoji('Unknown Type')).toBe('')
  })

  it('returns empty string for empty array', () => {
    expect(getPlaceTypeEmoji([])).toBe('')
  })

  it('returns correct emojis for various place types', () => {
    const emojiTests: [string, string][] = [
      ['Brewery', '🍺'],
      ['Restaurant', '🍽️'],
      ['Museum', '🏛️'],
      ['Bookstore', '📖'],
      ['Bar', '🍸'],
      ['Tea House', '🍵']
    ]

    emojiTests.forEach(([type, expected]) => {
      expect(getPlaceTypeEmoji(type), `${type} should have emoji ${expected}`).toBe(expected)
    })
  })
})

describe('getPlaceTypeColor', () => {
  it('returns color for a valid place type string', () => {
    expect(getPlaceTypeColor('Coffee Shop')).toBe('#00BFFF') // Deep Sky Blue
    expect(getPlaceTypeColor('Library')).toBe('#BF00FF') // Purple
  })

  it('returns color for first type in array', () => {
    const color = getPlaceTypeColor(['Bakery', 'Café'])
    expect(color).toBe('#FFC649') // Saffron Yellow for Bakery
  })

  it('returns fallback blue color for undefined', () => {
    expect(getPlaceTypeColor(undefined)).toBe('#3B82F6')
  })

  it('returns fallback blue color for unknown type', () => {
    expect(getPlaceTypeColor('Unknown Type')).toBe('#3B82F6')
  })

  it('returns fallback blue color for empty array', () => {
    expect(getPlaceTypeColor([])).toBe('#3B82F6')
  })

  it('returns correct colors for specific place types', () => {
    const colorTests: [string, string][] = [
      ['Arcade', '#39FF14'],        // Neon Green
      ['Art Gallery', '#FF00DC'],   // Vivid Magenta
      ['Café', '#FF1493'],          // Deep Pink
      ['Game Store', '#107C10'],    // Microsoft Green
      ['Other', '#6B7280']          // Gray
    ]

    colorTests.forEach(([type, expected]) => {
      expect(getPlaceTypeColor(type), `${type} should have color ${expected}`).toBe(expected)
    })
  })
})
