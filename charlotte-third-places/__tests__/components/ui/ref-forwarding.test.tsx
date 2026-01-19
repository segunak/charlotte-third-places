/**
 * Tests to verify that refs are properly forwarded after the React 19 forwardRef migration.
 * These components previously used React.forwardRef but now use the ref-as-prop pattern.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

// Helper to create a ref that matches the expected type (workaround for React 19 ref types)
function createTestRef<T>(): React.RefObject<T> {
  return { current: null } as React.RefObject<T>
}

// Mock ResizeObserver for dialog tests
vi.mock('@radix-ui/react-dialog', async () => {
  const actual = await vi.importActual('@radix-ui/react-dialog')
  return {
    ...actual,
  }
})

describe('Ref Forwarding - React 19 Migration', () => {
  describe('Button', () => {
    it('forwards ref to the underlying button element', () => {
      const ref = createTestRef<HTMLButtonElement>()
      render(<Button ref={ref}>Click me</Button>)
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
      expect(ref.current?.tagName).toBe('BUTTON')
    })

    it('forwards ref with asChild prop', () => {
      const ref = createTestRef<HTMLAnchorElement>()
      render(
        <Button ref={ref as unknown as React.RefObject<HTMLButtonElement>} asChild>
          <a href="#">Link Button</a>
        </Button>
      )
      
      // When asChild is used, the ref goes to the child element
      expect(ref.current).toBeInstanceOf(HTMLAnchorElement)
    })
  })

  describe('Input', () => {
    it('forwards ref to the underlying input element', () => {
      const ref = createTestRef<HTMLInputElement>()
      render(<Input ref={ref} placeholder="Test input" />)
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement)
      expect(ref.current?.tagName).toBe('INPUT')
    })

    it('allows programmatic focus via ref', () => {
      const ref = createTestRef<HTMLInputElement>()
      render(<Input ref={ref} placeholder="Focus me" />)
      
      ref.current?.focus()
      expect(document.activeElement).toBe(ref.current)
    })
  })

  describe('Textarea', () => {
    it('forwards ref to the underlying textarea element', () => {
      const ref = createTestRef<HTMLTextAreaElement>()
      render(<Textarea ref={ref} placeholder="Test textarea" />)
      
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
      expect(ref.current?.tagName).toBe('TEXTAREA')
    })
  })

  describe('Card Components', () => {
    it('forwards ref to Card container', () => {
      const ref = createTestRef<HTMLDivElement>()
      render(<Card ref={ref}>Card content</Card>)
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
      expect(ref.current).toHaveAttribute('data-slot', 'card')
    })

    it('forwards ref to CardHeader', () => {
      const ref = createTestRef<HTMLDivElement>()
      render(<CardHeader ref={ref}>Header</CardHeader>)
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
      expect(ref.current).toHaveAttribute('data-slot', 'card-header')
    })

    it('forwards ref to CardTitle', () => {
      const ref = createTestRef<HTMLDivElement>()
      render(<CardTitle ref={ref}>Title</CardTitle>)
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
      expect(ref.current).toHaveAttribute('data-slot', 'card-title')
    })

    it('forwards ref to CardDescription', () => {
      const ref = createTestRef<HTMLDivElement>()
      render(<CardDescription ref={ref}>Description</CardDescription>)
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
      expect(ref.current).toHaveAttribute('data-slot', 'card-description')
    })

    it('forwards ref to CardContent', () => {
      const ref = createTestRef<HTMLDivElement>()
      render(<CardContent ref={ref}>Content</CardContent>)
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
      expect(ref.current).toHaveAttribute('data-slot', 'card-content')
    })

    it('forwards ref to CardFooter', () => {
      const ref = createTestRef<HTMLDivElement>()
      render(<CardFooter ref={ref}>Footer</CardFooter>)
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
      expect(ref.current).toHaveAttribute('data-slot', 'card-footer')
    })
  })

  describe('Dialog Components', () => {
    it('forwards ref to DialogContent', () => {
      const ref = createTestRef<HTMLDivElement>()
      
      render(
        <Dialog open>
          <DialogContent ref={ref}>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
              <DialogDescription>Test description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )
      
      // DialogContent should be in the document when open
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
      expect(ref.current).toHaveAttribute('data-slot', 'dialog-content')
    })

    it('forwards ref to DialogTitle', () => {
      const ref = createTestRef<HTMLHeadingElement>()
      
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle ref={ref}>Test Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )
      
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement)
      expect(ref.current).toHaveAttribute('data-slot', 'dialog-title')
    })

    it('preserves custom crossCloseIconSize prop', () => {
      render(
        <Dialog open>
          <DialogContent crossCloseIconSize="h-8 w-8">
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      )
      
      // The close button should contain an icon with the custom size class
      const closeButton = screen.getByRole('button', { name: /close/i })
      const icon = closeButton.querySelector('svg')
      expect(icon).toHaveClass('h-8', 'w-8')
    })
  })
})
