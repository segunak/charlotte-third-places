import { describe, it, expect } from 'vitest'
import {
  FILTER_SENTINEL,
  FILTER_DEFS,
  DEFAULT_FILTER_CONFIG,
  placeMatchesFilters,
  filterPlaces,
  MOBILE_PICKER_FIELDS,
  MOBILE_CHIP_FIELDS,
  SORT_DEFS,
  type FilterConfig,
} from '@/lib/filters'
import type { Place } from '@/lib/types'

// Helper to create a minimal Place object for testing
function createTestPlace(overrides: Partial<Place> = {}): Place {
  return {
    recordId: 'rec123',
    name: 'Test Place',
    operational: 'Yes',
    type: ['Coffee Shop'],
    size: 'Medium',
    tags: ['Good for Groups', 'Has Fireplace'],
    neighborhood: 'NoDa',
    address: '123 Test St',
    purchaseRequired: 'Yes',
    parking: ['Street Parking'],
    freeWiFi: 'Yes',
    hasCinnamonRolls: 'No',
    hasReviews: 'Yes',
    featured: false,
    description: 'A test place',
    website: 'https://example.com',
    tiktok: '',
    instagram: '',
    youtube: '',
    facebook: '',
    twitter: '',
    linkedIn: '',
    googleMapsPlaceId: 'abc123',
    googleMapsProfileURL: 'https://maps.google.com',
    appleMapsProfileURL: 'https://maps.apple.com',
    photos: [],
    comments: '',
    latitude: 35.2271,
    longitude: -80.8431,
    createdDate: new Date(),
    lastModifiedDate: new Date(),
    ...overrides,
  }
}

describe('FILTER_DEFS', () => {
  it('has unique keys for each filter', () => {
    const keys = FILTER_DEFS.map(d => d.key)
    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(keys.length)
  })

  it('all filters have required properties', () => {
    for (const def of FILTER_DEFS) {
      expect(def).toHaveProperty('key')
      expect(def).toHaveProperty('label')
      expect(def).toHaveProperty('placeholder')
      expect(def).toHaveProperty('valueType')
      expect(def).toHaveProperty('accessor')
      expect(def).toHaveProperty('useChips')
      expect(typeof def.accessor).toBe('function')
      expect(typeof def.useChips).toBe('boolean')
    }
  })

  it('accessor functions return correct types', () => {
    const place = createTestPlace()
    
    for (const def of FILTER_DEFS) {
      const value = def.accessor(place)
      if (def.valueType === 'array') {
        expect(Array.isArray(value)).toBe(true)
      } else {
        expect(typeof value).toBe('string')
      }
    }
  })

  it('parking filter has allowedValues restricting to Free and Paid', () => {
    const parkingDef = FILTER_DEFS.find(d => d.key === 'parking')
    expect(parkingDef).toBeDefined()
    expect(parkingDef?.allowedValues).toEqual(['Free', 'Paid'])
  })

  it('filters with useChips=true are in MOBILE_CHIP_FIELDS', () => {
    const chipFilters = FILTER_DEFS.filter(d => d.useChips)
    expect(chipFilters.length).toBeGreaterThan(0)
    for (const def of chipFilters) {
      expect(MOBILE_CHIP_FIELDS.has(def.key)).toBe(true)
    }
  })
})

describe('MOBILE_CHIP_FIELDS', () => {
  it('is derived from FILTER_DEFS with useChips=true', () => {
    const expectedFields = FILTER_DEFS.filter(d => d.useChips).map(d => d.key)
    expect(MOBILE_CHIP_FIELDS.size).toBe(expectedFields.length)
    for (const field of expectedFields) {
      expect(MOBILE_CHIP_FIELDS.has(field)).toBe(true)
    }
  })

  it('includes parking, freeWiFi, purchaseRequired, size, and hasCinnamonRolls', () => {
    expect(MOBILE_CHIP_FIELDS.has('parking')).toBe(true)
    expect(MOBILE_CHIP_FIELDS.has('freeWiFi')).toBe(true)
    expect(MOBILE_CHIP_FIELDS.has('purchaseRequired')).toBe(true)
    expect(MOBILE_CHIP_FIELDS.has('size')).toBe(true)
    expect(MOBILE_CHIP_FIELDS.has('hasCinnamonRolls')).toBe(true)
  })

  it('does not include name, neighborhood, type, or tags', () => {
    expect(MOBILE_CHIP_FIELDS.has('name')).toBe(false)
    expect(MOBILE_CHIP_FIELDS.has('neighborhood')).toBe(false)
    expect(MOBILE_CHIP_FIELDS.has('type')).toBe(false)
    expect(MOBILE_CHIP_FIELDS.has('tags')).toBe(false)
  })
})

describe('SORT_DEFS', () => {
  it('has unique keys for each sort option', () => {
    const keys = SORT_DEFS.map(d => d.key)
    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(keys.length)
  })

  it('all sort options have required properties', () => {
    for (const def of SORT_DEFS) {
      expect(def).toHaveProperty('key')
      expect(def).toHaveProperty('label')
      expect(def).toHaveProperty('field')
      expect(def).toHaveProperty('direction')
    }
  })

  it('includes name ascending and descending', () => {
    const nameAsc = SORT_DEFS.find(d => d.key === 'name-asc')
    const nameDesc = SORT_DEFS.find(d => d.key === 'name-desc')
    expect(nameAsc).toBeDefined()
    expect(nameDesc).toBeDefined()
    expect(nameAsc?.label).toBe('Name (A-Z)')
    expect(nameDesc?.label).toBe('Name (Z-A)')
  })

  it('includes date added ascending and descending', () => {
    const dateAsc = SORT_DEFS.find(d => d.key === 'createdDate-asc')
    const dateDesc = SORT_DEFS.find(d => d.key === 'createdDate-desc')
    expect(dateAsc).toBeDefined()
    expect(dateDesc).toBeDefined()
  })

  it('includes last modified ascending and descending', () => {
    const lastModAsc = SORT_DEFS.find(d => d.key === 'lastModifiedDate-asc')
    const lastModDesc = SORT_DEFS.find(d => d.key === 'lastModifiedDate-desc')
    expect(lastModAsc).toBeDefined()
    expect(lastModDesc).toBeDefined()
  })

  it('has 6 total sort options', () => {
    expect(SORT_DEFS.length).toBe(6)
  })
})

describe('DEFAULT_FILTER_CONFIG', () => {
  it('has a config entry for each filter definition', () => {
    for (const def of FILTER_DEFS) {
      expect(DEFAULT_FILTER_CONFIG).toHaveProperty(def.key)
    }
  })

  it('all default values are set to FILTER_SENTINEL', () => {
    for (const key of Object.keys(DEFAULT_FILTER_CONFIG)) {
      expect(DEFAULT_FILTER_CONFIG[key as keyof FilterConfig].value).toBe(FILTER_SENTINEL)
    }
  })
})

describe('placeMatchesFilters', () => {
  it('returns true when all filters are at sentinel value', () => {
    const place = createTestPlace()
    expect(placeMatchesFilters(place, DEFAULT_FILTER_CONFIG)).toBe(true)
  })

  it('filters by scalar value (neighborhood)', () => {
    const place = createTestPlace({ neighborhood: 'NoDa' })
    
    const matchingFilters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      neighborhood: { ...DEFAULT_FILTER_CONFIG.neighborhood, value: 'NoDa' },
    }
    
    const nonMatchingFilters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      neighborhood: { ...DEFAULT_FILTER_CONFIG.neighborhood, value: 'Plaza Midwood' },
    }
    
    expect(placeMatchesFilters(place, matchingFilters)).toBe(true)
    expect(placeMatchesFilters(place, nonMatchingFilters)).toBe(false)
  })

  it('filters by array value (type)', () => {
    const place = createTestPlace({ type: ['Coffee Shop', 'Bakery'] })
    
    const matchingFilters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      type: { ...DEFAULT_FILTER_CONFIG.type, value: 'Coffee Shop' },
    }
    
    const alsoMatchingFilters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      type: { ...DEFAULT_FILTER_CONFIG.type, value: 'Bakery' },
    }
    
    const nonMatchingFilters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      type: { ...DEFAULT_FILTER_CONFIG.type, value: 'Restaurant' },
    }
    
    expect(placeMatchesFilters(place, matchingFilters)).toBe(true)
    expect(placeMatchesFilters(place, alsoMatchingFilters)).toBe(true)
    expect(placeMatchesFilters(place, nonMatchingFilters)).toBe(false)
  })

  it('filters by tags array', () => {
    const place = createTestPlace({ tags: ['Has Fireplace', 'Good for Groups'] })
    
    const matchingFilters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      tags: { ...DEFAULT_FILTER_CONFIG.tags, value: 'Has Fireplace' },
    }
    
    const nonMatchingFilters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      tags: { ...DEFAULT_FILTER_CONFIG.tags, value: 'Outdoor Seating' },
    }
    
    expect(placeMatchesFilters(place, matchingFilters)).toBe(true)
    expect(placeMatchesFilters(place, nonMatchingFilters)).toBe(false)
  })

  it('requires all active filters to match (AND logic)', () => {
    const place = createTestPlace({
      neighborhood: 'NoDa',
      size: 'Large',
    })
    
    const bothMatchFilters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      neighborhood: { ...DEFAULT_FILTER_CONFIG.neighborhood, value: 'NoDa' },
      size: { ...DEFAULT_FILTER_CONFIG.size, value: 'Large' },
    }
    
    const oneMatchFilters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      neighborhood: { ...DEFAULT_FILTER_CONFIG.neighborhood, value: 'NoDa' },
      size: { ...DEFAULT_FILTER_CONFIG.size, value: 'Small' },
    }
    
    expect(placeMatchesFilters(place, bothMatchFilters)).toBe(true)
    expect(placeMatchesFilters(place, oneMatchFilters)).toBe(false)
  })
})

describe('filterPlaces', () => {
  const places = [
    createTestPlace({ recordId: '1', name: 'Place A', neighborhood: 'NoDa', size: 'Small' }),
    createTestPlace({ recordId: '2', name: 'Place B', neighborhood: 'NoDa', size: 'Large' }),
    createTestPlace({ recordId: '3', name: 'Place C', neighborhood: 'Plaza Midwood', size: 'Small' }),
  ]

  it('returns all places when no filters active', () => {
    const result = filterPlaces(places, DEFAULT_FILTER_CONFIG)
    expect(result).toHaveLength(3)
  })

  it('filters by single criterion', () => {
    const filters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      neighborhood: { ...DEFAULT_FILTER_CONFIG.neighborhood, value: 'NoDa' },
    }
    
    const result = filterPlaces(places, filters)
    expect(result).toHaveLength(2)
    expect(result.every(p => p.neighborhood === 'NoDa')).toBe(true)
  })

  it('filters by multiple criteria', () => {
    const filters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      neighborhood: { ...DEFAULT_FILTER_CONFIG.neighborhood, value: 'NoDa' },
      size: { ...DEFAULT_FILTER_CONFIG.size, value: 'Small' },
    }
    
    const result = filterPlaces(places, filters)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Place A')
  })

  it('returns empty array when no matches', () => {
    const filters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      neighborhood: { ...DEFAULT_FILTER_CONFIG.neighborhood, value: 'Dilworth' },
    }
    
    const result = filterPlaces(places, filters)
    expect(result).toHaveLength(0)
  })

  it('does not mutate the original array', () => {
    const original = [...places]
    const filters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      neighborhood: { ...DEFAULT_FILTER_CONFIG.neighborhood, value: 'NoDa' },
    }
    
    filterPlaces(places, filters)
    expect(places).toEqual(original)
  })
})
