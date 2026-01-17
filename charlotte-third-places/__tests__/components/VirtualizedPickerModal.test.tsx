import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VirtualizedPickerModal } from '@/components/VirtualizedPickerModal'

/**
 * VirtualizedPickerModal tests
 *
 * This component uses TanStack Virtual for virtualization and renders items
 * as buttons within a listbox container. The virtualization works in jsdom
 * because the Dialog provides proper container dimensions.
 *
 * Tests focus on:
 * - Dialog rendering and visibility
 * - Option rendering (items are buttons with text)
 * - Selection behavior
 * - Keyboard navigation
 * - Accessibility structure
 */

const defaultOptions = ['Option A', 'Option B', 'Option C', 'Option D', 'Option E']

describe('VirtualizedPickerModal', () => {
  describe('Dialog Behavior', () => {
    it('renders dialog when open is true', () => {
      render(
        <VirtualizedPickerModal
          open={true}
          onOpenChange={vi.fn()}
          options={defaultOptions}
          value="all"
          label="Test Label"
          onSelect={vi.fn()}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Select Test Label')).toBeInTheDocument()
    })

    it('does not render dialog when open is false', () => {
      render(
        <VirtualizedPickerModal
          open={false}
          onOpenChange={vi.fn()}
          options={defaultOptions}
          value="all"
          label="Test Label"
          onSelect={vi.fn()}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders "All" option and regular options', () => {
      render(
        <VirtualizedPickerModal
          open={true}
          onOpenChange={vi.fn()}
          options={defaultOptions}
          value="all"
          label="Test Label"
          onSelect={vi.fn()}
        />
      )

      // "All" is shown with label context
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
      // Regular options
      for (const option of defaultOptions) {
        expect(screen.getByRole('button', { name: option })).toBeInTheDocument()
      }
    })
  })

  describe('Selection', () => {
    it('calls onSelect when option is clicked', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(
        <VirtualizedPickerModal
          open={true}
          onOpenChange={vi.fn()}
          options={defaultOptions}
          value="all"
          label="Test Label"
          onSelect={onSelect}
        />
      )

      await user.click(screen.getByRole('button', { name: 'Option B' }))

      expect(onSelect).toHaveBeenCalledWith('Option B')
    })

    it('calls onSelect with "all" when All option is clicked', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(
        <VirtualizedPickerModal
          open={true}
          onOpenChange={vi.fn()}
          options={defaultOptions}
          value="Option A"
          label="Test Label"
          onSelect={onSelect}
        />
      )

      await user.click(screen.getByRole('button', { name: 'All' }))

      expect(onSelect).toHaveBeenCalledWith('all')
    })

    it('shows checkmark on selected option', () => {
      render(
        <VirtualizedPickerModal
          open={true}
          onOpenChange={vi.fn()}
          options={defaultOptions}
          value="Option B"
          label="Test Label"
          onSelect={vi.fn()}
        />
      )

      // The selected option's button should have active styling (bg-primary)
      const selectedButton = screen.getByRole('button', { name: 'Option B' })
      expect(selectedButton).toHaveClass('bg-primary')
    })

    it('shows checkmark on All when value is "all"', () => {
      render(
        <VirtualizedPickerModal
          open={true}
          onOpenChange={vi.fn()}
          options={defaultOptions}
          value="all"
          label="Test Label"
          onSelect={vi.fn()}
        />
      )

      const allButton = screen.getByRole('button', { name: 'All' })
      expect(allButton).toHaveClass('bg-primary')
    })
  })

  describe('Accessibility', () => {
    it('has proper dialog role', () => {
      render(
        <VirtualizedPickerModal
          open={true}
          onOpenChange={vi.fn()}
          options={defaultOptions}
          value="all"
          label="Test Label"
          onSelect={vi.fn()}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('listbox has proper role and aria-label', () => {
      render(
        <VirtualizedPickerModal
          open={true}
          onOpenChange={vi.fn()}
          options={defaultOptions}
          value="all"
          label="Test Label"
          onSelect={vi.fn()}
        />
      )

      const listbox = screen.getByRole('listbox')
      expect(listbox).toBeInTheDocument()
      expect(listbox).toHaveAttribute('aria-label', 'Test Label')
    })

    it('dialog has title for screen readers', () => {
      render(
        <VirtualizedPickerModal
          open={true}
          onOpenChange={vi.fn()}
          options={defaultOptions}
          value="all"
          label="Test Label"
          onSelect={vi.fn()}
        />
      )

      expect(screen.getByRole('heading', { name: /Select Test Label/i })).toBeInTheDocument()
    })

    it('has close button', () => {
      render(
        <VirtualizedPickerModal
          open={true}
          onOpenChange={vi.fn()}
          options={defaultOptions}
          value="all"
          label="Test Label"
          onSelect={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    })
  })

  describe('Close Behavior', () => {
    it('calls onOpenChange when close button is clicked', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      render(
        <VirtualizedPickerModal
          open={true}
          onOpenChange={onOpenChange}
          options={defaultOptions}
          value="all"
          label="Test Label"
          onSelect={vi.fn()}
        />
      )

      await user.click(screen.getByRole('button', { name: 'Close' }))

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Option Counts', () => {
    it('renders correct number of options', () => {
      render(
        <VirtualizedPickerModal
          open={true}
          onOpenChange={vi.fn()}
          options={defaultOptions}
          value="all"
          label="Test Label"
          onSelect={vi.fn()}
        />
      )

      // Should have All button + each option button (excluding Close)
      const optionButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent !== 'Close' && !btn.querySelector('.sr-only')
      )
      expect(optionButtons.length).toBe(defaultOptions.length + 1) // +1 for "All"
    })
  })
})
