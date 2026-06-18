import type React from 'react'
import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Place } from '@/lib/types'

const mockState = vi.hoisted(() => ({
  isNativeApp: false,
  places: [] as Place[],
}))

vi.mock('@/hooks/useIsNativeApp', () => ({
  useIsNativeApp: () => mockState.isNativeApp,
}))

vi.mock('@/contexts/FilterContext', () => ({
  FilterProvider: ({ children }: { children: React.ReactNode }) => children,
  usePlaces: () => ({ places: mockState.places }),
}))

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}))

import HomePageClient from '@/components/HomePageClient'

function createMockPlace(overrides: Partial<Place> = {}): Place {
  return {
    recordId: 'rec123456',
    name: 'Test Coffee Shop',
    description: 'A cozy coffee shop in the heart of Charlotte.',
    address: '123 Main St, Charlotte, NC 28202',
    neighborhood: 'Uptown',
    latitude: 35.2271,
    longitude: -80.8431,
    type: ['Coffee Shop', 'Cafe'],
    size: 'Medium',
    purchaseRequired: 'Yes',
    parking: ['Street Parking'],
    freeWiFi: 'Yes',
    hasCinnamonRolls: 'No',
    hasReviews: 'No',
    googleMapsPlaceId: '',
    googleMapsProfileURL: 'https://maps.google.com/?cid=123',
    appleMapsProfileURL: 'https://maps.apple.com/?address=123',
    website: 'https://testcoffee.com',
    tiktok: '',
    instagram: '',
    youtube: '',
    facebook: '',
    twitter: '',
    linkedIn: '',
    tags: [],
    photos: [],
    comments: '',
    operatingHours: [],
    featured: false,
    operational: 'Open',
    createdDate: new Date('2024-01-01T00:00:00.000Z'),
    lastModifiedDate: new Date('2024-01-15T00:00:00.000Z'),
    ...overrides,
  }
}

describe('HomePageClient', () => {
  beforeEach(() => {
    mockState.isNativeApp = false
    mockState.places = [createMockPlace()]
  })

  it('renders a desktop app banner with store badges in regular browsers', () => {
    render(<HomePageClient places={mockState.places} />)

    expect(screen.getByText('Not sure where to go?')).toBeInTheDocument()

    const banner = screen.getByTestId('desktop-app-banner')
    expect(banner).toHaveClass('hidden')
    expect(banner).toHaveClass('sm:block')
    expect(banner).toHaveClass('hide-in-native-app')
    expect(within(banner).getByRole('heading', { name: /get the mobile app/i })).toBeInTheDocument()
    expect(within(banner).getByText(/take charlotte's third places with you/i)).toBeInTheDocument()
    expect(within(banner).getByRole('link', { name: /download on the app store/i })).toHaveAttribute(
      'href',
      'https://apps.apple.com/app/id6762573563'
    )
    expect(within(banner).getByRole('link', { name: /get it on google play/i })).toHaveAttribute(
      'href',
      'https://play.google.com/store/apps/details?id=com.charlottethirdplaces.app'
    )

    const googlePlayGradientIds = Array.from(
      document.querySelectorAll('linearGradient[id^="gp-badge-"]')
    ).map(gradient => gradient.id)
    expect(googlePlayGradientIds).toHaveLength(8)
    expect(new Set(googlePlayGradientIds).size).toBe(googlePlayGradientIds.length)
  })

  it('does not render app promotion inside native app contexts', () => {
    mockState.isNativeApp = true

    render(<HomePageClient places={mockState.places} />)

    expect(screen.queryByTestId('desktop-app-banner')).not.toBeInTheDocument()
    expect(screen.queryByText('Get the App')).not.toBeInTheDocument()
  })
})