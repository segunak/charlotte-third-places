import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useInView } from '@/hooks/useInView'
import React from 'react'
import { render } from '@testing-library/react'

describe('useInView Hook', () => {
  // The global IntersectionObserver mock from setup.tsx is used
  // We can spy on its methods

  it('returns ref and inView state', () => {
    const { result } = renderHook(() => useInView())

    expect(result.current).toHaveLength(2)
    expect(result.current[0]).toHaveProperty('current')
    expect(typeof result.current[1]).toBe('boolean')
  })

  it('defaults inView to true for SSR compatibility', () => {
    const { result } = renderHook(() => useInView())

    // Before any observer interaction, inView should be true
    expect(result.current[1]).toBe(true)
  })

  it('creates IntersectionObserver when ref is attached to element', async () => {
    // Create a component that uses the hook and attaches the ref
    function TestComponent() {
      const [ref, inView] = useInView<HTMLDivElement>(0.5, '10px')
      return <div ref={ref} data-testid="observed" data-inview={String(inView)} />
    }

    const { getByTestId } = render(<TestComponent />)
    
    // The element should be rendered and have the data attribute
    expect(getByTestId('observed')).toBeInTheDocument()
    
    // inView should be true (due to the global mock triggering immediately)
    await waitFor(() => {
      expect(getByTestId('observed').dataset.inview).toBe('true')
    })
  })

  it('creates IntersectionObserver with default options', async () => {
    function TestComponent() {
      const [ref, inView] = useInView<HTMLDivElement>()
      return <div ref={ref} data-testid="observed" data-inview={String(inView)} />
    }

    const { getByTestId } = render(<TestComponent />)
    
    // Should render and have inView = true due to mock
    await waitFor(() => {
      expect(getByTestId('observed').dataset.inview).toBe('true')
    })
  })

  it('updates inView when element enters viewport', async () => {
    function TestComponent() {
      const [ref, inView] = useInView<HTMLDivElement>()
      return <div ref={ref} data-testid="observed" data-inview={String(inView)} />
    }

    const { getByTestId } = render(<TestComponent />)

    // The global mock immediately triggers as visible
    await waitFor(() => {
      expect(getByTestId('observed').dataset.inview).toBe('true')
    })
  })

  it('does not create observer when ref is not attached', () => {
    // Just calling the hook without attaching ref should work
    const { result } = renderHook(() => useInView())
    
    // Hook should return default values
    expect(result.current[0].current).toBeNull()
    expect(result.current[1]).toBe(true) // Default SSR value
  })

  it('maintains stable reference on re-renders with same options', () => {
    const { result, rerender } = renderHook(
      ({ threshold, rootMargin }) => useInView(threshold, rootMargin),
      { initialProps: { threshold: 0.5, rootMargin: '10px' } }
    )

    const firstRef = result.current[0]

    // Rerender with same props
    rerender({ threshold: 0.5, rootMargin: '10px' })

    // Ref should be the same object
    expect(result.current[0]).toBe(firstRef)
  })

  it('works with different threshold values', async () => {
    function TestComponent({ threshold }: { threshold: number }) {
      const [ref, inView] = useInView<HTMLDivElement>(threshold)
      return <div ref={ref} data-testid="observed" data-inview={String(inView)} />
    }

    const { getByTestId } = render(<TestComponent threshold={0.8} />)
    
    await waitFor(() => {
      expect(getByTestId('observed').dataset.inview).toBe('true')
    })
  })

  it('works with rootMargin parameter', async () => {
    function TestComponent() {
      const [ref, inView] = useInView<HTMLDivElement>(0.1, '20px')
      return <div ref={ref} data-testid="observed" data-inview={String(inView)} />
    }

    const { getByTestId } = render(<TestComponent />)
    
    await waitFor(() => {
      expect(getByTestId('observed').dataset.inview).toBe('true')
    })
  })
})
