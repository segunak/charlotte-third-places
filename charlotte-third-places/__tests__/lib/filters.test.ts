import { describe, it, expect } from 'vitest'
import {
  FILTER_SENTINEL,
  FILTER_DEFS,
  DEFAULT_FILTER_CONFIG,
  placeMatchesFilters,
  filterPlaces,
  sortPlaces,
  MOBILE_PICKER_FIELDS,
  MOBILE_CHIP_FIELDS,
  SORT_DEFS,
  type FilterConfig,
} from '@/lib/filters'
import type { Place } from '@/lib/types'
import { SortField, SortDirection } from '@/lib/types'

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

describe('DESKTOP_PICKER_FIELDS', () => {
  it('includes name, neighborhood, type, and tags', () => {
    const nameDef = FILTER_DEFS.find(d => d.key === 'name')
    const neighborhoodDef = FILTER_DEFS.find(d => d.key === 'neighborhood')
    const typeDef = FILTER_DEFS.find(d => d.key === 'type')
    const tagsDef = FILTER_DEFS.find(d => d.key === 'tags')
    
    expect(nameDef?.desktopPicker).toBe(true)
    expect(neighborhoodDef?.desktopPicker).toBe(true)
    expect(typeDef?.desktopPicker).toBe(true)
    expect(tagsDef?.desktopPicker).toBe(true)
  })

  it('does not include chip fields', () => {
    const parkingDef = FILTER_DEFS.find(d => d.key === 'parking')
    const wifiDef = FILTER_DEFS.find(d => d.key === 'freeWiFi')
    const sizeDef = FILTER_DEFS.find(d => d.key === 'size')
    
    expect(parkingDef?.desktopPicker).toBe(false)
    expect(wifiDef?.desktopPicker).toBe(false)
    expect(sizeDef?.desktopPicker).toBe(false)
  })
})

describe('MULTI_SELECT_FIELDS', () => {
  it('includes tags', () => {
    const tagsDef = FILTER_DEFS.find(d => d.key === 'tags')
    expect(tagsDef?.multiSelect).toBe(true)
  })

  it('does not include name, neighborhood, type, or chip fields', () => {
    const nameDef = FILTER_DEFS.find(d => d.key === 'name')
    const neighborhoodDef = FILTER_DEFS.find(d => d.key === 'neighborhood')
    const typeDef = FILTER_DEFS.find(d => d.key === 'type')
    const parkingDef = FILTER_DEFS.find(d => d.key === 'parking')
    
    expect(nameDef?.multiSelect).toBeFalsy()
    expect(neighborhoodDef?.multiSelect).toBeFalsy()
    expect(typeDef?.multiSelect).toBeFalsy()
    expect(parkingDef?.multiSelect).toBeFalsy()
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

  it('all default values are set correctly (FILTER_SENTINEL or empty array for multi-select)', () => {
    for (const def of FILTER_DEFS) {
      const config = DEFAULT_FILTER_CONFIG[def.key as keyof FilterConfig]
      if (def.multiSelect) {
        expect(config.value).toEqual([])
      } else {
        expect(config.value).toBe(FILTER_SENTINEL)
      }
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

  it('filters by tags array with multi-select AND logic', () => {
    const place = createTestPlace({ tags: ['Has Fireplace', 'Good for Groups'] })
    
    // Single tag match - place has this tag
    const singleMatchingFilters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      tags: { ...DEFAULT_FILTER_CONFIG.tags, value: ['Has Fireplace'] },
    }
    
    // Multiple tags - place must have ALL (AND logic)
    const allMatchingFilters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      tags: { ...DEFAULT_FILTER_CONFIG.tags, value: ['Has Fireplace', 'Good for Groups'] },
    }
    
    // Place only has one of these - should NOT match with AND logic
    const partialMatchFilters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      tags: { ...DEFAULT_FILTER_CONFIG.tags, value: ['Has Fireplace', 'Outdoor Seating'] },
    }
    
    // No matching tags at all
    const nonMatchingFilters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      tags: { ...DEFAULT_FILTER_CONFIG.tags, value: ['Outdoor Seating', 'Pet Friendly'] },
    }
    
    // Empty array means no constraint (show all)
    const noConstraintFilters: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      tags: { ...DEFAULT_FILTER_CONFIG.tags, value: [] },
    }
    
    expect(placeMatchesFilters(place, singleMatchingFilters)).toBe(true)
    expect(placeMatchesFilters(place, allMatchingFilters)).toBe(true)
    expect(placeMatchesFilters(place, partialMatchFilters)).toBe(false) // AND logic: must have ALL
    expect(placeMatchesFilters(place, nonMatchingFilters)).toBe(false)
    expect(placeMatchesFilters(place, noConstraintFilters)).toBe(true)
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

describe('sortPlaces', () => {
  const basePlaces: Place[] = [
    createTestPlace({ recordId: '1', name: 'Zebra Cafe', featured: false, createdDate: new Date('2024-01-01') }),
    createTestPlace({ recordId: '2', name: 'Alpha Coffee', featured: false, createdDate: new Date('2024-03-01') }),
    createTestPlace({ recordId: '3', name: 'Beta Bakery', featured: true, createdDate: new Date('2024-02-01') }),
  ]

  describe('featured-first priority', () => {
    it('puts featured places first regardless of sort field', () => {
      const result = sortPlaces(basePlaces, { field: SortField.Name, direction: SortDirection.Ascending })
      
      expect(result[0].name).toBe('Beta Bakery')
      expect(result[0].featured).toBe(true)
    })

    it('maintains featured-first with date sort', () => {
      const result = sortPlaces(basePlaces, { field: SortField.DateAdded, direction: SortDirection.Ascending })
      
      expect(result[0].featured).toBe(true)
    })
  })

  describe('name sorting', () => {
    it('sorts by name ascending after featured', () => {
      const result = sortPlaces(basePlaces, { field: SortField.Name, direction: SortDirection.Ascending })
      
      // First is featured
      expect(result[0].name).toBe('Beta Bakery')
      // Then alphabetical
      expect(result[1].name).toBe('Alpha Coffee')
      expect(result[2].name).toBe('Zebra Cafe')
    })

    it('sorts by name descending after featured', () => {
      const result = sortPlaces(basePlaces, { field: SortField.Name, direction: SortDirection.Descending })
      
      // First is featured
      expect(result[0].name).toBe('Beta Bakery')
      // Then reverse alphabetical
      expect(result[1].name).toBe('Zebra Cafe')
      expect(result[2].name).toBe('Alpha Coffee')
    })
  })

  describe('date sorting', () => {
    it('sorts by createdDate ascending after featured', () => {
      const result = sortPlaces(basePlaces, { field: SortField.DateAdded, direction: SortDirection.Ascending })
      
      // First is featured (Feb 2024)
      expect(result[0].name).toBe('Beta Bakery')
      // Then oldest first
      expect(result[1].name).toBe('Zebra Cafe') // Jan 2024
      expect(result[2].name).toBe('Alpha Coffee') // Mar 2024
    })

    it('sorts by createdDate descending after featured', () => {
      const result = sortPlaces(basePlaces, { field: SortField.DateAdded, direction: SortDirection.Descending })
      
      // First is featured
      expect(result[0].name).toBe('Beta Bakery')
      // Then newest first
      expect(result[1].name).toBe('Alpha Coffee') // Mar 2024
      expect(result[2].name).toBe('Zebra Cafe') // Jan 2024
    })
  })

  describe('immutability', () => {
    it('does not mutate the original array', () => {
      const original = [...basePlaces]
      sortPlaces(basePlaces, { field: SortField.Name, direction: SortDirection.Ascending })
      
      expect(basePlaces).toEqual(original)
    })

    it('returns a new array', () => {
      const result = sortPlaces(basePlaces, { field: SortField.Name, direction: SortDirection.Ascending })
      
      expect(result).not.toBe(basePlaces)
    })
  })

  describe('edge cases', () => {
    it('handles empty array', () => {
      const result = sortPlaces([], { field: SortField.Name, direction: SortDirection.Ascending })
      
      expect(result).toEqual([])
    })

    it('handles single item array', () => {
      const single = [createTestPlace({ name: 'Only Place' })]
      const result = sortPlaces(single, { field: SortField.Name, direction: SortDirection.Ascending })
      
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Only Place')
    })

    it('handles all featured places', () => {
      const allFeatured = [
        createTestPlace({ name: 'Zebra', featured: true }),
        createTestPlace({ name: 'Alpha', featured: true }),
      ]
      const result = sortPlaces(allFeatured, { field: SortField.Name, direction: SortDirection.Ascending })
      
      expect(result[0].name).toBe('Alpha')
      expect(result[1].name).toBe('Zebra')
    })

    it('handles no featured places', () => {
      const noFeatured = [
        createTestPlace({ name: 'Zebra', featured: false }),
        createTestPlace({ name: 'Alpha', featured: false }),
      ]
      const result = sortPlaces(noFeatured, { field: SortField.Name, direction: SortDirection.Ascending })
      
      expect(result[0].name).toBe('Alpha')
      expect(result[1].name).toBe('Zebra')
    })
  })
})
