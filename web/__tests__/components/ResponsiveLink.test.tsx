import { ResponsiveLink } from '@/components/ResponsiveLink'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

describe('ResponsiveLink image previews', () => {
  it('opens a direct image URL in the website preview and closes it', () => {
    const imageUrl = 'https://www.charlottethirdplaces.com/images/sterotypical-coffee-shop-metal-chair.webp'

    render(<ResponsiveLink href={imageUrl}>View the chair</ResponsiveLink>)

    const link = screen.getByRole('link', { name: 'View the chair' })
    expect(link).toHaveAttribute('target', '_blank')

    expect(fireEvent.click(link)).toBe(false)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Linked image' })).toHaveAttribute('src', imageUrl)

    fireEvent.click(screen.getByRole('button', { name: 'Close image preview' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(link).toBeInTheDocument()
  })

  it('recognizes relative image paths with uppercase extensions, queries, and fragments', () => {
    const imageUrl = '/images/CHAIR.JFIF?size=large#preview'

    render(<ResponsiveLink href={imageUrl}>Open image</ResponsiveLink>)
    fireEvent.click(screen.getByRole('link', { name: 'Open image' }))

    expect(screen.getByRole('img', { name: 'Linked image' })).toHaveAttribute('src', imageUrl)
  })

  it('closes above an existing dialog without closing the underlying dialog', () => {
    const parentOnOpenChange = vi.fn()

    render(
      <Dialog open onOpenChange={parentOnOpenChange}>
        <DialogContent>
          <DialogTitle>Place details</DialogTitle>
          <DialogDescription>Details for a place</DialogDescription>
          <ResponsiveLink href="https://example.com/place-photo.jpg">
            Open place photo
          </ResponsiveLink>
        </DialogContent>
      </Dialog>
    )

    fireEvent.click(screen.getByRole('link', { name: 'Open place photo' }))
    expect(screen.getAllByRole('dialog', { hidden: true })).toHaveLength(2)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('img', { name: 'Linked image' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Place details' })).toBeInTheDocument()
    expect(parentOnOpenChange).not.toHaveBeenCalled()
  })

  it('leaves ordinary webpage links unchanged', () => {
    render(
      <ResponsiveLink href="https://example.com/article" target="_blank">
        Read article
      </ResponsiveLink>
    )

    const link = screen.getByRole('link', { name: 'Read article' })
    expect(fireEvent.click(link)).toBe(true)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
