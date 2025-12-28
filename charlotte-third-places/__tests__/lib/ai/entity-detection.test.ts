import { describe, it, expect } from 'vitest'
import {
  detectEntities,
  detectNeighborhoods,
  detectTags,
  getNearbyNeighborhoods,
  NEIGHBORHOOD_ALIASES,
  NEARBY_NEIGHBORHOODS,
  NEIGHBORHOODS,
  TAGS
} from '@/lib/ai/entity-detection'

describe('NEIGHBORHOODS constant', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(NEIGHBORHOODS)).toBe(true)
    expect(NEIGHBORHOODS.length).toBeGreaterThan(0)
  })

  it('contains expected Charlotte neighborhoods', () => {
    const expectedNeighborhoods = [
      'Uptown',
      'NoDa',
      'South End',
      'Plaza Midwood',
      'Dilworth',
      'Myers Park',
      'SouthPark',
      'University City',
      'Ballantyne'
    ]

    expectedNeighborhoods.forEach(hood => {
      expect(NEIGHBORHOODS, `Should contain ${hood}`).toContain(hood)
    })
  })

  it('all values are non-empty strings', () => {
    NEIGHBORHOODS.forEach(hood => {
      expect(typeof hood).toBe('string')
      expect(hood.trim().length).toBeGreaterThan(0)
    })
  })
})

describe('TAGS constant', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(TAGS)).toBe(true)
    expect(TAGS.length).toBeGreaterThan(0)
  })

  it('contains expected tags', () => {
    const expectedTags = [
      'Black Owned',
      'Habesha',
      'Great Date Spot',
      'Hidden Gem'
    ]

    expectedTags.forEach(tag => {
      expect(TAGS, `Should contain ${tag}`).toContain(tag)
    })
  })
})

describe('NEIGHBORHOOD_ALIASES', () => {
  it('is a non-empty object', () => {
    expect(typeof NEIGHBORHOOD_ALIASES).toBe('object')
    expect(Object.keys(NEIGHBORHOOD_ALIASES).length).toBeGreaterThan(0)
  })

  it('maps downtown to Uptown (Charlotte convention)', () => {
    expect(NEIGHBORHOOD_ALIASES['downtown']).toBe('Uptown')
    expect(NEIGHBORHOOD_ALIASES['downtown charlotte']).toBe('Uptown')
    expect(NEIGHBORHOOD_ALIASES['center city']).toBe('Uptown')
    expect(NEIGHBORHOOD_ALIASES['cbd']).toBe('Uptown')
  })

  it('maps NoDa aliases correctly', () => {
    expect(NEIGHBORHOOD_ALIASES['north davidson']).toBe('NoDa')
    expect(NEIGHBORHOOD_ALIASES['arts district']).toBe('NoDa')
  })

  it('maps University City aliases', () => {
    expect(NEIGHBORHOOD_ALIASES['uncc area']).toBe('University City')
    expect(NEIGHBORHOOD_ALIASES['u city']).toBe('University City')
    expect(NEIGHBORHOOD_ALIASES['university area']).toBe('University City')
  })

  it('maps ward names to Uptown', () => {
    expect(NEIGHBORHOOD_ALIASES['first ward']).toBe('Uptown')
    expect(NEIGHBORHOOD_ALIASES['second ward']).toBe('Uptown')
    expect(NEIGHBORHOOD_ALIASES['third ward']).toBe('Uptown')
    expect(NEIGHBORHOOD_ALIASES['fourth ward']).toBe('Uptown')
  })

  it('all alias values exist in NEIGHBORHOODS', () => {
    Object.values(NEIGHBORHOOD_ALIASES).forEach(canonical => {
      expect(NEIGHBORHOODS, `Alias points to non-existent neighborhood: ${canonical}`).toContain(canonical)
    })
  })
})

describe('NEARBY_NEIGHBORHOODS', () => {
  it('has entries for major neighborhoods', () => {
    const majorHoods = ['Uptown', 'NoDa', 'South End', 'Plaza Midwood', 'Myers Park']
    majorHoods.forEach(hood => {
      expect(NEARBY_NEIGHBORHOODS[hood], `${hood} should have nearby neighborhoods`).toBeDefined()
      expect(NEARBY_NEIGHBORHOODS[hood].length).toBeGreaterThan(0)
    })
  })

  it('Uptown is near South End and Dilworth', () => {
    const uptownNearby = NEARBY_NEIGHBORHOODS['Uptown']
    expect(uptownNearby).toContain('South End')
    expect(uptownNearby).toContain('Dilworth')
  })

  it('NoDa is near Plaza Midwood', () => {
    expect(NEARBY_NEIGHBORHOODS['NoDa']).toContain('Plaza Midwood')
  })

  it('relationships are bidirectional', () => {
    // If A lists B as nearby, B should list A
    Object.entries(NEARBY_NEIGHBORHOODS).forEach(([hood, nearby]) => {
      nearby.forEach(neighbor => {
        const neighborNearby = NEARBY_NEIGHBORHOODS[neighbor]
        if (neighborNearby) {
          expect(
            neighborNearby,
            `${neighbor} should list ${hood} as nearby (bidirectional)`
          ).toContain(hood)
        }
      })
    })
  })
})

describe('detectNeighborhoods', () => {
  it('detects a single neighborhood', () => {
    const result = detectNeighborhoods('Looking for coffee in NoDa')
    expect(result.primary).toContain('NoDa')
  })

  it('detects multiple neighborhoods', () => {
    const result = detectNeighborhoods('Places in NoDa or Plaza Midwood')
    expect(result.primary).toContain('NoDa')
    expect(result.primary).toContain('Plaza Midwood')
  })

  it('is case insensitive', () => {
    const result = detectNeighborhoods('coffee in UPTOWN')
    expect(result.primary).toContain('Uptown')
  })

  it('detects neighborhoods via aliases', () => {
    const result = detectNeighborhoods('Looking for places downtown')
    expect(result.primary).toContain('Uptown')
  })

  it('detects NoDa via "arts district" alias', () => {
    const result = detectNeighborhoods('art galleries in the arts district')
    expect(result.primary).toContain('NoDa')
  })

  it('expands with nearby neighborhoods', () => {
    const result = detectNeighborhoods('cafes in NoDa')
    expect(result.primary).toContain('NoDa')
    expect(result.nearby.length).toBeGreaterThan(0)
    // NoDa nearby includes Plaza Midwood
    expect(result.nearby).toContain('Plaza Midwood')
  })

  it('does not include primary neighborhoods in nearby', () => {
    const result = detectNeighborhoods('cafes in NoDa and Plaza Midwood')
    expect(result.primary).toContain('NoDa')
    expect(result.primary).toContain('Plaza Midwood')
    // Nearby should not duplicate primary
    result.primary.forEach(p => {
      expect(result.nearby).not.toContain(p)
    })
  })

  it('returns empty arrays for query with no neighborhoods', () => {
    const result = detectNeighborhoods('best coffee shop in the city')
    expect(result.primary).toEqual([])
    expect(result.nearby).toEqual([])
  })

  it('matches longer terms before shorter (Plaza Midwood before Plaza)', () => {
    const result = detectNeighborhoods('things to do in Plaza Midwood')
    expect(result.primary).toContain('Plaza Midwood')
    // Should not have "Plaza" as a separate match if it exists
  })

  it('handles queries with University City aliases', () => {
    const queries = [
      'coffee near uncc',
      'places in university city',
      'u city cafes'
    ]

    queries.forEach(query => {
      const result = detectNeighborhoods(query)
      expect(result.primary, `Query "${query}" should detect University City`).toContain('University City')
    })
  })
})

describe('detectTags', () => {
  it('detects a single tag', () => {
    const result = detectTags('Looking for black owned coffee shops')
    expect(result).toContain('Black Owned')
  })

  it('is case insensitive', () => {
    const result = detectTags('HIDDEN GEM in the city')
    expect(result).toContain('Hidden Gem')
  })

  it('detects multiple tags', () => {
    const result = detectTags('black owned hidden gem coffee spot')
    expect(result).toContain('Black Owned')
    expect(result).toContain('Hidden Gem')
  })

  it('detects Habesha tag', () => {
    const result = detectTags('Looking for Habesha restaurants')
    expect(result).toContain('Habesha')
  })

  it('detects "Great Date Spot" tag', () => {
    const result = detectTags('need a great date spot for Friday')
    expect(result).toContain('Great Date Spot')
  })

  it('returns empty array when no tags match', () => {
    const result = detectTags('just looking for coffee')
    expect(result).toEqual([])
  })

  it('detects Latino Owned tag', () => {
    const result = detectTags('latino owned restaurant')
    expect(result).toContain('Latino Owned')
  })

  it('detects outdoor outlets tag', () => {
    const result = detectTags('cafe with outdoor outlets')
    expect(result).toContain('Outdoor Outlets')
  })
})

describe('detectEntities', () => {
  it('returns both neighborhoods and tags', () => {
    const result = detectEntities('black owned coffee shop in NoDa')

    expect(result.neighborhoods.primary).toContain('NoDa')
    expect(result.tags).toContain('Black Owned')
  })

  it('returns empty results for generic query', () => {
    const result = detectEntities('what is a good restaurant')

    expect(result.neighborhoods.primary).toEqual([])
    expect(result.neighborhoods.nearby).toEqual([])
    expect(result.tags).toEqual([])
  })

  it('handles complex queries with multiple entities', () => {
    const result = detectEntities('hidden gem black owned cafe in uptown or south end')

    expect(result.neighborhoods.primary).toContain('Uptown')
    expect(result.neighborhoods.primary).toContain('South End')
    expect(result.tags).toContain('Hidden Gem')
    expect(result.tags).toContain('Black Owned')
  })
})

describe('getNearbyNeighborhoods', () => {
  it('returns nearby neighborhoods for valid neighborhood', () => {
    const nearby = getNearbyNeighborhoods('NoDa')
    expect(Array.isArray(nearby)).toBe(true)
    expect(nearby.length).toBeGreaterThan(0)
  })

  it('returns empty array for unknown neighborhood', () => {
    const nearby = getNearbyNeighborhoods('Fake Neighborhood')
    expect(nearby).toEqual([])
  })

  it('returns correct neighbors for Uptown', () => {
    const nearby = getNearbyNeighborhoods('Uptown')
    expect(nearby).toContain('South End')
    expect(nearby).toContain('Dilworth')
  })

  it('returns correct neighbors for Ballantyne', () => {
    const nearby = getNearbyNeighborhoods('Ballantyne')
    expect(nearby).toContain('Pineville')
    expect(nearby).toContain('Indian Land')
  })
})
