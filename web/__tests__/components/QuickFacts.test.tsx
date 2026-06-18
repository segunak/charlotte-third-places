/**
 * QuickFacts Component Tests
 *
 * Tests for the QuickFacts component which displays place attributes
 * like address, neighborhood, parking, WiFi, etc.
 *
 * Key functionality tested:
 * - YesNoBadge rendering for Yes/No/Unsure values
 * - InfoTag rendering
 * - Social media links
 * - Tags display
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuickFacts } from '@/components/QuickFacts'

// Mock window.matchMedia for useIsMobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}))

describe('QuickFacts', () => {
  const defaultProps = {
    address: '123 Main St, Charlotte, NC',
    neighborhood: 'South End',
    size: 'Medium',
    purchaseRequired: 'Yes',
    parking: ['Street Parking', 'Private Lot'],
    freeWiFi: 'Yes',
    hasCinnamonRolls: 'No',
  }

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<QuickFacts {...defaultProps} />)
      expect(container).toBeInTheDocument()
    })

    it('displays the address', () => {
      render(<QuickFacts {...defaultProps} />)
      expect(screen.getByText('123 Main St, Charlotte, NC')).toBeInTheDocument()
    })

    it('displays the neighborhood', () => {
      render(<QuickFacts {...defaultProps} />)
      expect(screen.getByText('South End')).toBeInTheDocument()
    })

    it('displays the size', () => {
      render(<QuickFacts {...defaultProps} />)
      expect(screen.getByText('Medium')).toBeInTheDocument()
    })
  })

  describe('Parking Display', () => {
    it('displays parking options', () => {
      render(<QuickFacts {...defaultProps} />)
      expect(screen.getByText('Street Parking')).toBeInTheDocument()
      expect(screen.getByText('Private Lot')).toBeInTheDocument()
    })

    it('handles single parking option', () => {
      render(<QuickFacts {...defaultProps} parking={['Garage']} />)
      expect(screen.getByText('Garage')).toBeInTheDocument()
    })

    it('handles empty parking array', () => {
      render(<QuickFacts {...defaultProps} parking={[]} />)
      // Should still render without errors
      expect(screen.getByText('123 Main St, Charlotte, NC')).toBeInTheDocument()
    })
  })

  describe('Yes/No Badges', () => {
    it('displays Yes badge for freeWiFi=Yes', () => {
      render(<QuickFacts {...defaultProps} freeWiFi="Yes" />)
      // Multiple "Yes" badges may exist, just verify the component renders
      const yesBadges = screen.getAllByText('Yes')
      expect(yesBadges.length).toBeGreaterThan(0)
    })

    it('displays No badge for hasCinnamonRolls=No', () => {
      render(<QuickFacts {...defaultProps} hasCinnamonRolls="No" />)
      const noBadges = screen.getAllByText('No')
      expect(noBadges.length).toBeGreaterThan(0)
    })

    it('displays Unsure badge when value is Unsure', () => {
      render(<QuickFacts {...defaultProps} freeWiFi="Unsure" />)
      expect(screen.getByText('Unsure')).toBeInTheDocument()
    })

    it('displays custom value for non-Yes/No/Unsure values', () => {
      render(<QuickFacts {...defaultProps} purchaseRequired="Sometimes" />)
      expect(screen.getByText('Sometimes')).toBeInTheDocument()
    })
  })

  describe('Tags Display', () => {
    it('displays tags when provided', () => {
      render(<QuickFacts {...defaultProps} tags={['Good for Groups', 'Has Outlets']} />)
      expect(screen.getByText('Good for Groups')).toBeInTheDocument()
      expect(screen.getByText('Has Outlets')).toBeInTheDocument()
    })

    it('handles empty tags array', () => {
      render(<QuickFacts {...defaultProps} tags={[]} />)
      // Should render without errors
      expect(screen.getByText('123 Main St, Charlotte, NC')).toBeInTheDocument()
    })
  })

  describe('Social Media Links', () => {
    it('displays social media links when provided', () => {
      render(
        <QuickFacts
          {...defaultProps}
          instagram="https://instagram.com/testplace"
          tiktok="https://tiktok.com/@testplace"
        />
      )

      // Social links are rendered as aria-labeled links
      expect(screen.getByLabelText('Instagram')).toBeInTheDocument()
      expect(screen.getByLabelText('TikTok')).toBeInTheDocument()
    })

    it('does not display social section when no socials provided', () => {
      render(<QuickFacts {...defaultProps} />)

      expect(screen.queryByLabelText('Instagram')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('TikTok')).not.toBeInTheDocument()
    })

    it('displays YouTube link when provided', () => {
      render(<QuickFacts {...defaultProps} youtube="https://youtube.com/@testplace" />)
      expect(screen.getByLabelText('YouTube')).toBeInTheDocument()
    })

    it('displays Facebook link when provided', () => {
      render(<QuickFacts {...defaultProps} facebook="https://facebook.com/testplace" />)
      expect(screen.getByLabelText('Facebook')).toBeInTheDocument()
    })

    it('displays LinkedIn link when provided', () => {
      render(<QuickFacts {...defaultProps} linkedIn="https://linkedin.com/company/testplace" />)
      expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument()
    })

    it('displays Twitter link when provided', () => {
      render(<QuickFacts {...defaultProps} twitter="https://twitter.com/testplace" />)
      expect(screen.getByLabelText('Twitter')).toBeInTheDocument()
    })
  })

  describe('Size Icons', () => {
    it('renders Small size correctly', () => {
      render(<QuickFacts {...defaultProps} size="Small" />)
      expect(screen.getByText('Small')).toBeInTheDocument()
    })

    it('renders Large size correctly', () => {
      render(<QuickFacts {...defaultProps} size="Large" />)
      expect(screen.getByText('Large')).toBeInTheDocument()
    })
  })
})
