import { describe, it, expect } from 'vitest'
import { getPlaceHighlights, listHighlightKeys, type PlaceHighlightResult } from '@/components/PlaceHighlights'
import { Place } from '@/lib/types'

/**
 * Creates a minimal Place object for testing PlaceHighlights.
 * Only includes fields that PlaceHighlights checks.
 */
function createTestPlace(overrides: Partial<Place> = {}): Place {
  return {
    recordId: 'test-123',
    name: 'Test Place',
    operational: 'Yes',
    type: ['Coffee Shop'],
    size: 'Medium',
    tags: [],
    neighborhood: 'NoDa',
    address: '123 Test St',
    purchaseRequired: 'No',
    parking: ['Street'],
    freeWiFi: 'Yes',
    hasCinnamonRolls: 'No',
    hasReviews: 'No',
    featured: false,
    description: 'A test place',
    website: 'https://test.com',
    tiktok: '',
    instagram: '',
    youtube: '',
    facebook: '',
    twitter: '',
    linkedIn: '',
    googleMapsPlaceId: '',
    googleMapsProfileURL: '',
    appleMapsProfileURL: '',
    photos: [],
    comments: '',
    latitude: 35.2271,
    longitude: -80.8431,
    createdDate: new Date(),
    lastModifiedDate: new Date(),
    ...overrides
  }
}

describe('listHighlightKeys', () => {
  it('returns an array of highlight keys', () => {
    const keys = listHighlightKeys()
    expect(Array.isArray(keys)).toBe(true)
    expect(keys.length).toBeGreaterThan(0)
  })

  it('includes expected highlight keys', () => {
    const keys = listHighlightKeys()
    expect(keys).toContain('featured')
    expect(keys).toContain('openingSoon')
    expect(keys).toContain('blackOwned')
    expect(keys).toContain('habesha')
    expect(keys).toContain('cinnamonRoll')
  })

  it('all keys are non-empty strings', () => {
    const keys = listHighlightKeys()
    keys.forEach(key => {
      expect(typeof key).toBe('string')
      expect(key.trim().length).toBeGreaterThan(0)
    })
  })
})

describe('getPlaceHighlights - basic functionality', () => {
  it('returns expected structure', () => {
    const place = createTestPlace()
    const result = getPlaceHighlights(place)

    expect(result).toHaveProperty('ribbon')
    expect(result).toHaveProperty('gradients')
    expect(result).toHaveProperty('badges')
  })

  it('returns no highlights for a plain place', () => {
    const place = createTestPlace()
    const result = getPlaceHighlights(place)

    expect(result.ribbon).toBeNull()
    expect(result.gradients).toEqual({})
    expect(result.badges).toHaveLength(0)
  })
})

describe('getPlaceHighlights - Featured places', () => {
  it('returns featured badge and ribbon', () => {
    const place = createTestPlace({ featured: true })
    const result = getPlaceHighlights(place)

    expect(result.ribbon).not.toBeNull()
    expect(result.ribbon?.label).toBe('Featured')
    expect(result.ribbon?.bgClass).toContain('amber')

    const featuredBadge = result.badges.find(b => b.key === 'featured')
    expect(featuredBadge).toBeDefined()
    expect(featuredBadge?.bgClass).toContain('amber')
  })

  it('provides card and modal gradients for featured places', () => {
    const place = createTestPlace({ featured: true })
    const result = getPlaceHighlights(place)

    expect(result.gradients.card).toBeDefined()
    expect(result.gradients.modal).toBeDefined()
    // Featured uses amber color (rgba(251,191,36)) in gradient
    expect(result.gradients.card).toContain('251,191,36')
  })
})

describe('getPlaceHighlights - Opening Soon places', () => {
  it('returns opening soon badge and ribbon', () => {
    const place = createTestPlace({ operational: 'Opening Soon' })
    const result = getPlaceHighlights(place)

    expect(result.ribbon).not.toBeNull()
    expect(result.ribbon?.label).toBe('Opening Soon')
    expect(result.ribbon?.bgClass).toContain('blue')

    const openingSoonBadge = result.badges.find(b => b.key === 'openingSoon')
    expect(openingSoonBadge).toBeDefined()
    expect(openingSoonBadge?.label).toBe('Opening Soon')
  })

  it('provides gradients for opening soon places', () => {
    const place = createTestPlace({ operational: 'Opening Soon' })
    const result = getPlaceHighlights(place)

    expect(result.gradients.card).toBeDefined()
    expect(result.gradients.modal).toBeDefined()
  })
})

describe('getPlaceHighlights - Tag-based badges', () => {
  it('returns Habesha badge for Habesha-tagged places', () => {
    const place = createTestPlace({ tags: ['Habesha'] })
    const result = getPlaceHighlights(place)

    const habeshaBadge = result.badges.find(b => b.key === 'habesha')
    expect(habeshaBadge).toBeDefined()
    expect(habeshaBadge?.ariaLabel).toBe('Habesha business')
  })

  it('returns Black Owned badge', () => {
    const place = createTestPlace({ tags: ['Black Owned'] })
    const result = getPlaceHighlights(place)

    const blackOwnedBadge = result.badges.find(b => b.key === 'blackOwned')
    expect(blackOwnedBadge).toBeDefined()
    expect(blackOwnedBadge?.ariaLabel).toBe('Black-owned business')
  })

  it('returns Christian badge with correct priority', () => {
    const place = createTestPlace({ tags: ['Christian'] })
    const result = getPlaceHighlights(place)

    const christianBadge = result.badges.find(b => b.key === 'christian')
    expect(christianBadge).toBeDefined()
    expect(christianBadge?.priority).toBe(3)
  })

  it('returns multiple badges for multiple tags', () => {
    const place = createTestPlace({ tags: ['Black Owned', 'Habesha'] })
    const result = getPlaceHighlights(place)

    expect(result.badges.length).toBeGreaterThanOrEqual(2)
    expect(result.badges.find(b => b.key === 'blackOwned')).toBeDefined()
    expect(result.badges.find(b => b.key === 'habesha')).toBeDefined()
  })

  it('no ribbon or gradient for tag-only badges', () => {
    const place = createTestPlace({ tags: ['Black Owned'] })
    const result = getPlaceHighlights(place)

    expect(result.ribbon).toBeNull()
    expect(result.gradients).toEqual({})
  })
})

describe('getPlaceHighlights - Cinnamon Rolls badge', () => {
  it('returns badge when hasCinnamonRolls is "Yes"', () => {
    const place = createTestPlace({ hasCinnamonRolls: 'Yes' })
    const result = getPlaceHighlights(place)

    const cinnamonBadge = result.badges.find(b => b.key === 'cinnamonRoll')
    expect(cinnamonBadge).toBeDefined()
    expect(cinnamonBadge?.ariaLabel).toBe('Has cinnamon rolls')
  })

  it('returns badge when hasCinnamonRolls is "TRUE"', () => {
    const place = createTestPlace({ hasCinnamonRolls: 'TRUE' })
    const result = getPlaceHighlights(place)

    const cinnamonBadge = result.badges.find(b => b.key === 'cinnamonRoll')
    expect(cinnamonBadge).toBeDefined()
  })

  it('returns badge when hasCinnamonRolls is "true"', () => {
    const place = createTestPlace({ hasCinnamonRolls: 'true' })
    const result = getPlaceHighlights(place)

    const cinnamonBadge = result.badges.find(b => b.key === 'cinnamonRoll')
    expect(cinnamonBadge).toBeDefined()
  })

  it('no badge when hasCinnamonRolls is "No"', () => {
    const place = createTestPlace({ hasCinnamonRolls: 'No' })
    const result = getPlaceHighlights(place)

    const cinnamonBadge = result.badges.find(b => b.key === 'cinnamonRoll')
    expect(cinnamonBadge).toBeUndefined()
  })
})

describe('getPlaceHighlights - Priority and ordering', () => {
  it('Featured takes priority over Opening Soon for ribbon/gradient', () => {
    const place = createTestPlace({ featured: true, operational: 'Opening Soon' })
    const result = getPlaceHighlights(place)

    // Featured has priority 1, Opening Soon has priority 2
    expect(result.ribbon?.label).toBe('Featured')
    // Featured uses amber color (rgba(251,191,36)) in gradient
    expect(result.gradients.card).toContain('251,191,36')
  })

  it('badges are ordered with unprioritized first, then prioritized descending', () => {
    // Place with featured (priority 1), Christian (priority 3), and Black Owned (no priority)
    const place = createTestPlace({
      featured: true,
      tags: ['Black Owned', 'Christian']
    })
    const result = getPlaceHighlights(place)

    // According to the ordering strategy:
    // 1. Unprioritized badges first (Black Owned) - left side
    // 2. Prioritized badges sorted DESC (Christian 3, Featured 1) - rightmost is most important

    const badgeKeys = result.badges.map(b => b.key)
    
    // Verify all expected badges exist
    expect(badgeKeys).toContain('featured')
    expect(badgeKeys).toContain('christian')
    expect(badgeKeys).toContain('blackOwned')

    // Verify ordering: unprioritized before prioritized
    const blackOwnedIndex = badgeKeys.indexOf('blackOwned')
    const featuredIndex = badgeKeys.indexOf('featured')
    const christianIndex = badgeKeys.indexOf('christian')

    // Black Owned (no priority) should come before prioritized badges
    expect(blackOwnedIndex).toBeLessThan(featuredIndex)
    expect(blackOwnedIndex).toBeLessThan(christianIndex)

    // Featured (priority 1) should be after Christian (priority 3) due to DESC sort
    // DESC sort: [3, 1] means Christian comes before Featured in the prioritized section
    expect(christianIndex).toBeLessThan(featuredIndex)
  })

  it('prioritized badges sorted descending (highest priority number first, lowest rightmost)', () => {
    // Featured (1) and Opening Soon (2)
    const place = createTestPlace({ featured: true, operational: 'Opening Soon' })
    const result = getPlaceHighlights(place)

    const badgeKeys = result.badges.map(b => b.key)
    const featuredIndex = badgeKeys.indexOf('featured')
    const openingSoonIndex = badgeKeys.indexOf('openingSoon')

    // Both are prioritized, sorted DESC by priority
    // DESC: [2, 1] -> openingSoon (2) comes before featured (1)
    expect(openingSoonIndex).toBeLessThan(featuredIndex)
  })
})

describe('getPlaceHighlights - Edge cases', () => {
  it('handles null tags array gracefully', () => {
    const place = createTestPlace()
    // @ts-expect-error - Testing null handling
    place.tags = null

    expect(() => getPlaceHighlights(place)).not.toThrow()
    const result = getPlaceHighlights(place)
    expect(result.badges).toEqual([])
  })

  it('handles undefined tags gracefully', () => {
    const place = createTestPlace()
    // @ts-expect-error - Testing undefined handling
    place.tags = undefined

    expect(() => getPlaceHighlights(place)).not.toThrow()
  })

  it('handles empty string operational status', () => {
    const place = createTestPlace({ operational: '' })
    const result = getPlaceHighlights(place)

    const openingSoonBadge = result.badges.find(b => b.key === 'openingSoon')
    expect(openingSoonBadge).toBeUndefined()
  })

  it('handles mixed case operational status', () => {
    // Opening Soon check is exact match, so 'opening soon' (lowercase) should not match
    const place = createTestPlace({ operational: 'opening soon' })
    const result = getPlaceHighlights(place)

    const openingSoonBadge = result.badges.find(b => b.key === 'openingSoon')
    expect(openingSoonBadge).toBeUndefined()
  })

  it('handles false featured as non-featured', () => {
    const place = createTestPlace({ featured: false })
    const result = getPlaceHighlights(place)

    const featuredBadge = result.badges.find(b => b.key === 'featured')
    expect(featuredBadge).toBeUndefined()
  })
})

describe('getPlaceHighlights - Badge properties', () => {
  it('all badges have required properties', () => {
    const place = createTestPlace({
      featured: true,
      tags: ['Black Owned', 'Habesha'],
      hasCinnamonRolls: 'Yes'
    })
    const result = getPlaceHighlights(place)

    result.badges.forEach(badge => {
      expect(badge.key).toBeDefined()
      expect(badge.icon).toBeDefined()
      expect(badge.bgClass).toBeDefined()
      // ariaLabel should exist for accessibility
      expect(badge.ariaLabel).toBeDefined()
    })
  })

  it('badges with custom padding have paddingClass', () => {
    const place = createTestPlace({ hasCinnamonRolls: 'Yes' })
    const result = getPlaceHighlights(place)

    const cinnamonBadge = result.badges.find(b => b.key === 'cinnamonRoll')
    expect(cinnamonBadge?.paddingClass).toBeDefined()
    expect(cinnamonBadge?.paddingClass).toBe('p-1')
  })
})
