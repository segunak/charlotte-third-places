/**
 * Tests for ShareButton component ref forwarding after React 19 migration.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { ShareButton } from '@/components/ShareButton'

// Helper to create a ref that matches the expected type
function createTestRef<T>(): React.RefObject<T> {
  return { current: null } as React.RefObject<T>
}

describe('ShareButton', () => {
  beforeEach(() => {
    // Mock navigator.share
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockResolvedValue(undefined),
      writable: true,
      configurable: true,
    })
    
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    })
  })

  describe('Ref Forwarding', () => {
    it('forwards ref to the underlying button element', () => {
      const ref = createTestRef<HTMLButtonElement>()
      render(<ShareButton ref={ref} url="https://example.com" />)
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
      expect(ref.current?.tagName).toBe('BUTTON')
    })

    it('allows programmatic focus via ref', () => {
      const ref = createTestRef<HTMLButtonElement>()
      render(<ShareButton ref={ref} url="https://example.com" />)
      
      ref.current?.focus()
      expect(document.activeElement).toBe(ref.current)
    })

    it('allows programmatic click via ref', async () => {
      const ref = createTestRef<HTMLButtonElement>()
      render(<ShareButton ref={ref} url="https://example.com" placeName="Test Place" />)
      
      ref.current?.click()
      
      // Should have attempted to share
      expect(navigator.share).toHaveBeenCalledWith({
        title: 'Test Place',
        text: 'Charlotte Third Places: Test Place',
        url: 'https://example.com',
      })
    })
  })

  describe('Props', () => {
    it('renders with text display type by default', () => {
      render(<ShareButton url="https://example.com" />)
      
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
    })

    it('renders with icon display type', () => {
      render(<ShareButton url="https://example.com" displayType="icon" />)
      
      const button = screen.getByRole('button', { name: /share/i })
      expect(button).toBeInTheDocument()
      // Icon should be present
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    it('passes variant prop to underlying Button', () => {
      render(<ShareButton url="https://example.com" variant="outline" />)
      
      const button = screen.getByRole('button')
      // Outline variant should have border styling
      expect(button.className).toMatch(/border/)
    })

    it('passes size prop to underlying Button', () => {
      render(<ShareButton url="https://example.com" size="sm" />)
      
      const button = screen.getByRole('button')
      // Small size should have h-8 class
      expect(button.className).toMatch(/h-8/)
    })
  })

  describe('Share Functionality', () => {
    it('uses Web Share API when available', async () => {
      const user = userEvent.setup()
      render(<ShareButton url="https://example.com" placeName="Coffee Shop" />)
      
      await user.click(screen.getByRole('button'))
      
      expect(navigator.share).toHaveBeenCalledWith({
        title: 'Coffee Shop',
        text: 'Charlotte Third Places: Coffee Shop',
        url: 'https://example.com',
      })
    })

    // Note: Clipboard fallback test is skipped because mocking navigator.clipboard
    // in jsdom is unreliable. The clipboard fallback behavior should be tested 
    // in E2E tests instead.
  })
})
