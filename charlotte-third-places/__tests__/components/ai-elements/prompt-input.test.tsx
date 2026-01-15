/**
 * Prompt Input Component Tests
 *
 * Tests for the PromptInput component and its sub-components used for the chat interface.
 * This is a complex component with multiple features:
 * - Text input with keyboard handling (Enter to submit, Shift+Enter for newline)
 * - File attachments (paste, drag & drop, file dialog)
 * - Controlled and uncontrolled modes via PromptInputProvider
 *
 * Key functionality tested:
 * - Text input and clearing
 * - Form submission on Enter key
 * - Shift+Enter for newlines (should NOT submit)
 * - Provider context for lifting state
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  PromptInput,
  PromptInputProvider,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  usePromptInputController,
} from '@/components/ai-elements/prompt-input'

// Mock the UI components to simplify testing
vi.mock('@/components/ui/input-group', () => ({
  InputGroup: ({ children, ...props }: React.PropsWithChildren<any>) => (
    <div data-testid="input-group" {...props}>{children}</div>
  ),
  InputGroupAddon: ({ children, ...props }: React.PropsWithChildren<any>) => (
    <div data-testid="input-group-addon" {...props}>{children}</div>
  ),
  InputGroupButton: ({ children, ...props }: React.PropsWithChildren<any>) => (
    <button data-testid="input-group-button" {...props}>{children}</button>
  ),
  InputGroupTextarea: React.forwardRef<HTMLTextAreaElement, any>(
    ({ className, ...props }, ref) => (
      <textarea ref={ref} data-testid="prompt-textarea" className={className} {...props} />
    )
  ),
}))

// Mock lucide icons
vi.mock('lucide-react', () => ({
  ArrowUpIcon: () => <span data-testid="arrow-up-icon" />,
  ImageIcon: () => <span data-testid="image-icon" />,
  Loader2Icon: () => <span data-testid="loader-icon" />,
  MicIcon: () => <span data-testid="mic-icon" />,
  PaperclipIcon: () => <span data-testid="paperclip-icon" />,
  PlusIcon: () => <span data-testid="plus-icon" />,
  SquareIcon: () => <span data-testid="square-icon" />,
  XIcon: () => <span data-testid="x-icon" />,
}))

describe('PromptInput', () => {
  describe('Basic Rendering', () => {
    it('renders the prompt input form', () => {
      const handleSubmit = vi.fn()
      render(
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea />
        </PromptInput>
      )

      expect(screen.getByTestId('prompt-textarea')).toBeInTheDocument()
    })

    it('renders with default placeholder text', () => {
      const handleSubmit = vi.fn()
      render(
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea />
        </PromptInput>
      )

      expect(screen.getByPlaceholderText('What would you like to know?')).toBeInTheDocument()
    })

    it('renders with custom placeholder text', () => {
      const handleSubmit = vi.fn()
      render(
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea placeholder="Ask about Charlotte..." />
        </PromptInput>
      )

      expect(screen.getByPlaceholderText('Ask about Charlotte...')).toBeInTheDocument()
    })
  })

  describe('Text Input', () => {
    it('allows typing in the textarea', async () => {
      const handleSubmit = vi.fn()
      render(
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea />
        </PromptInput>
      )

      const textarea = screen.getByTestId('prompt-textarea')
      await userEvent.type(textarea, 'Hello world')

      expect(textarea).toHaveValue('Hello world')
    })

    it('calls onChange when text is entered', async () => {
      const handleSubmit = vi.fn()
      const handleChange = vi.fn()
      render(
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea onChange={handleChange} />
        </PromptInput>
      )

      const textarea = screen.getByTestId('prompt-textarea')
      await userEvent.type(textarea, 'a')

      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('Form Submission', () => {
    it('submits form with text content', async () => {
      const handleSubmit = vi.fn()
      render(
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea />
          <PromptInputFooter>
            <PromptInputSubmit />
          </PromptInputFooter>
        </PromptInput>
      )

      const textarea = screen.getByTestId('prompt-textarea')
      await userEvent.type(textarea, 'Test message')

      const form = textarea.closest('form')
      expect(form).toBeInTheDocument()
      
      // Submit the form
      fireEvent.submit(form!)

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            text: 'Test message',
          }),
          expect.any(Object)
        )
      })
    })
  })

  describe('Keyboard Handling', () => {
    it('submits on Enter key press', async () => {
      const handleSubmit = vi.fn()
      render(
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea />
          <PromptInputFooter>
            <PromptInputSubmit />
          </PromptInputFooter>
        </PromptInput>
      )

      const textarea = screen.getByTestId('prompt-textarea')
      await userEvent.type(textarea, 'Test message')
      
      // Press Enter (should submit)
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' })

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled()
      })
    })

    it('does NOT submit on Shift+Enter (allows newline)', async () => {
      const handleSubmit = vi.fn()
      render(
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea />
          <PromptInputFooter>
            <PromptInputSubmit />
          </PromptInputFooter>
        </PromptInput>
      )

      const textarea = screen.getByTestId('prompt-textarea')
      await userEvent.type(textarea, 'Line 1')
      
      // Press Shift+Enter (should NOT submit, just add newline)
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true })

      expect(handleSubmit).not.toHaveBeenCalled()
    })
  })
})

describe('PromptInputProvider', () => {
  /**
   * Test component that exposes controller methods for testing
   */
  function TestConsumer({ onValue }: { onValue?: (value: string) => void }) {
    const controller = usePromptInputController()
    
    React.useEffect(() => {
      onValue?.(controller.textInput.value)
    }, [controller.textInput.value, onValue])

    return (
      <div>
        <span data-testid="current-value">{controller.textInput.value}</span>
        <button 
          data-testid="set-input"
          onClick={() => controller.textInput.setInput('Provider set value')}
        >
          Set Input
        </button>
        <button 
          data-testid="clear-input"
          onClick={() => controller.textInput.clear()}
        >
          Clear
        </button>
      </div>
    )
  }

  it('provides initial input value', () => {
    render(
      <PromptInputProvider initialInput="Initial text">
        <TestConsumer />
      </PromptInputProvider>
    )

    expect(screen.getByTestId('current-value')).toHaveTextContent('Initial text')
  })

  it('allows setting input via controller', async () => {
    render(
      <PromptInputProvider>
        <TestConsumer />
      </PromptInputProvider>
    )

    const setButton = screen.getByTestId('set-input')
    await userEvent.click(setButton)

    expect(screen.getByTestId('current-value')).toHaveTextContent('Provider set value')
  })

  it('allows clearing input via controller', async () => {
    render(
      <PromptInputProvider initialInput="Some text">
        <TestConsumer />
      </PromptInputProvider>
    )

    expect(screen.getByTestId('current-value')).toHaveTextContent('Some text')

    const clearButton = screen.getByTestId('clear-input')
    await userEvent.click(clearButton)

    expect(screen.getByTestId('current-value')).toHaveTextContent('')
  })

  it('throws error when usePromptInputController is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestConsumer />)
    }).toThrow('Wrap your component inside <PromptInputProvider>')

    consoleSpy.mockRestore()
  })
})

describe('PromptInputTextarea Debouncing', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /**
   * Test component that tracks when the controller's value actually changes
   */
  function TestControllerValue({ onValueChange }: { onValueChange: (value: string) => void }) {
    const controller = usePromptInputController()
    
    React.useEffect(() => {
      onValueChange(controller.textInput.value)
    }, [controller.textInput.value, onValueChange])

    return <span data-testid="controller-value">{controller.textInput.value}</span>
  }

  it('updates local textarea value immediately', async () => {
    const handleSubmit = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    
    render(
      <PromptInputProvider>
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea />
        </PromptInput>
      </PromptInputProvider>
    )

    const textarea = screen.getByTestId('prompt-textarea')
    await user.type(textarea, 'fast typing')

    // Textarea should show value immediately (local state)
    expect(textarea).toHaveValue('fast typing')
  })

  it('debounces controller update by 150ms', async () => {
    const handleSubmit = vi.fn()
    const onValueChange = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    
    render(
      <PromptInputProvider>
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea />
          <TestControllerValue onValueChange={onValueChange} />
        </PromptInput>
      </PromptInputProvider>
    )

    const textarea = screen.getByTestId('prompt-textarea')
    
    // Reset mock to track calls after initial render
    onValueChange.mockClear()
    
    await user.type(textarea, 'abc')

    // Controller should NOT be updated immediately (within debounce window)
    expect(onValueChange).not.toHaveBeenCalled()

    // Advance past debounce threshold
    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    // Now controller should have been updated
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith('abc')
    })
  })

  it('flushes debounced input before Enter key submission', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    
    /**
     * Component that tracks controller value changes
     */
    function ValueTracker({ onValueChange }: { onValueChange: (value: string) => void }) {
      const controller = usePromptInputController()
      
      React.useEffect(() => {
        onValueChange(controller.textInput.value)
      }, [controller.textInput.value, onValueChange])

      return null
    }
    
    render(
      <PromptInputProvider>
        <PromptInput onSubmit={() => {}}>
          <PromptInputTextarea />
          <PromptInputFooter>
            <PromptInputSubmit />
          </PromptInputFooter>
        </PromptInput>
        <ValueTracker onValueChange={onValueChange} />
      </PromptInputProvider>
    )

    const textarea = screen.getByTestId('prompt-textarea')
    
    // Clear initial call from render
    onValueChange.mockClear()
    
    await user.type(textarea, 'Submit me')

    // Controller should NOT be updated yet (still within debounce window)
    expect(onValueChange).not.toHaveBeenCalled()

    // Press Enter immediately (before debounce would normally complete)
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' })

    // The controller value should be flushed immediately due to debouncedSetInput.flush()
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith('Submit me')
    })
  })

  it('syncs local state when controller value changes externally', async () => {
    const handleSubmit = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    
    /**
     * Component that lets us externally change the controller value
     */
    function ExternalController() {
      const controller = usePromptInputController()
      return (
        <button 
          data-testid="external-set"
          onClick={() => controller.textInput.setInput('external value')}
        >
          Set External
        </button>
      )
    }
    
    render(
      <PromptInputProvider>
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea />
          <ExternalController />
        </PromptInput>
      </PromptInputProvider>
    )

    const textarea = screen.getByTestId('prompt-textarea')
    await user.type(textarea, 'typed value')
    
    // Wait for debounce
    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    expect(textarea).toHaveValue('typed value')

    // Externally set a new value (simulating form clear after submit)
    const externalButton = screen.getByTestId('external-set')
    await user.click(externalButton)

    // Textarea should sync to the new external value
    await waitFor(() => {
      expect(textarea).toHaveValue('external value')
    })
  })
})
