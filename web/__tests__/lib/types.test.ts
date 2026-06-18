import { describe, it, expect } from 'vitest'
import {
  SortField,
  SortDirection,
  DEFAULT_SORT_OPTION,
  type SortOption
} from '@/lib/types'

describe('SortField enum', () => {
  it('has Name field', () => {
    expect(SortField.Name).toBe('name')
  })

  it('has DateAdded field', () => {
    expect(SortField.DateAdded).toBe('createdDate')
  })

  it('has LastModified field', () => {
    expect(SortField.LastModified).toBe('lastModifiedDate')
  })

  it('has exactly 3 sort fields', () => {
    const fields = Object.values(SortField)
    expect(fields).toHaveLength(3)
  })
})

describe('SortDirection enum', () => {
  it('has Ascending direction', () => {
    expect(SortDirection.Ascending).toBe('asc')
  })

  it('has Descending direction', () => {
    expect(SortDirection.Descending).toBe('desc')
  })

  it('has exactly 2 directions', () => {
    const directions = Object.values(SortDirection)
    expect(directions).toHaveLength(2)
  })
})

describe('DEFAULT_SORT_OPTION', () => {
  it('sorts by DateAdded by default', () => {
    expect(DEFAULT_SORT_OPTION.field).toBe(SortField.DateAdded)
  })

  it('uses Descending direction by default (newest first)', () => {
    expect(DEFAULT_SORT_OPTION.direction).toBe(SortDirection.Descending)
  })

  it('has valid structure as SortOption', () => {
    const option: SortOption = DEFAULT_SORT_OPTION
    expect(option).toHaveProperty('field')
    expect(option).toHaveProperty('direction')
  })
})

describe('SortOption type usage', () => {
  it('can create valid sort options for all fields', () => {
    const options: SortOption[] = [
      { field: SortField.Name, direction: SortDirection.Ascending },
      { field: SortField.Name, direction: SortDirection.Descending },
      { field: SortField.DateAdded, direction: SortDirection.Ascending },
      { field: SortField.DateAdded, direction: SortDirection.Descending },
      { field: SortField.LastModified, direction: SortDirection.Ascending },
      { field: SortField.LastModified, direction: SortDirection.Descending }
    ]

    options.forEach(opt => {
      expect(Object.values(SortField)).toContain(opt.field)
      expect(Object.values(SortDirection)).toContain(opt.direction)
    })
  })
})
