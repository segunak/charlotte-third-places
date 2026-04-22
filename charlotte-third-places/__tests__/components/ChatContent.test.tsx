import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatContent } from '@/components/ChatContent'

// Track the props passed to Streamdown so we can assert linkSafety config
let capturedStreamdownProps: Record<string, unknown> = {}

// Mock streamdown to capture props passed to Streamdown
vi.mock('streamdown', () => ({
    Streamdown: vi.fn((props: Record<string, unknown>) => {
        capturedStreamdownProps = props
        return <div data-testid="streamdown">{props.children as React.ReactNode}</div>
    }),
}))

// Mock useChat to control messages and status
const mockSendMessage = vi.fn()
const mockSetMessages = vi.fn()
const mockStop = vi.fn()

let mockMessages: Array<{ id: string; role: string; parts: Array<{ type: string; text: string }> }> = []
let mockStatus = 'ready'

vi.mock('@ai-sdk/react', () => ({
    useChat: vi.fn(() => ({
        messages: mockMessages,
        sendMessage: mockSendMessage,
        stop: mockStop,
        status: mockStatus,
        error: null,
        setMessages: mockSetMessages,
    })),
}))

// Mock ai SDK transport
vi.mock('ai', () => ({
    DefaultChatTransport: vi.fn(),
}))

// Mock useIsMobile
vi.mock('@/hooks/use-mobile', () => ({
    useIsMobile: vi.fn(() => false),
}))

// Mock PromptLibrary (avoids complex nested rendering)
vi.mock('@/components/PromptLibrary', () => ({
    PromptLibrary: () => <div data-testid="prompt-library" />,
}))

describe('ChatContent', () => {
    beforeEach(() => {
        capturedStreamdownProps = {}
        mockMessages = []
        mockStatus = 'ready'
        vi.clearAllMocks()
    })

    describe('empty state', () => {
        it('renders welcome message and starter prompts for page variant', () => {
            render(<ChatContent variant="page" showStarterPrompts />)

            expect(screen.getByText('Charlotte Third Places')).toBeInTheDocument()
            expect(screen.getByText(/Looking for the perfect spot/)).toBeInTheDocument()
            expect(screen.getByText('What are some good spots for groups?')).toBeInTheDocument()
            expect(screen.getByText('What places are great for remote work?')).toBeInTheDocument()
        })

        it('renders dialog welcome message without place context', () => {
            render(<ChatContent variant="dialog" />)

            expect(screen.getByText(/Looking for the perfect spot/)).toBeInTheDocument()
        })

        it('renders place-specific prompts in dialog variant with place', () => {
            const mockPlace = {
                googleMapsPlaceId: 'test-id',
                name: 'Test Cafe',
            } as Parameters<typeof ChatContent>[0]['place']

            render(<ChatContent variant="dialog" place={mockPlace} />)

            expect(screen.getByText("How's access to outlets and Wi-Fi?")).toBeInTheDocument()
            expect(screen.getByText("What's the vibe and aesthetic like here?")).toBeInTheDocument()
        })
    })

    describe('linkSafety', () => {
        it('passes linkSafety={{ enabled: false }} to MessageResponse (Streamdown)', () => {
            // Set up messages so the conversation area renders with an assistant message
            mockMessages = [
                {
                    id: 'msg-1',
                    role: 'user',
                    parts: [{ type: 'text', text: 'Where can I get coffee?' }],
                },
                {
                    id: 'msg-2',
                    role: 'assistant',
                    parts: [{ type: 'text', text: 'Check out [Not Just Coffee](https://maps.google.com/?cid=123)' }],
                },
            ]

            render(<ChatContent variant="page" />)

            // Streamdown should have been called with linkSafety disabled
            expect(capturedStreamdownProps.linkSafety).toEqual({ enabled: false })
        })

        it('does not show a link confirmation modal for external links', () => {
            mockMessages = [
                {
                    id: 'msg-1',
                    role: 'user',
                    parts: [{ type: 'text', text: 'Tell me about a place' }],
                },
                {
                    id: 'msg-2',
                    role: 'assistant',
                    parts: [{ type: 'text', text: 'Visit https://maps.google.com/?cid=123' }],
                },
            ]

            render(<ChatContent variant="page" />)

            // No modal should exist in the DOM
            expect(screen.queryByText('Open external link?')).not.toBeInTheDocument()
            expect(screen.queryByText("You're about to visit an external website.")).not.toBeInTheDocument()
        })
    })

    describe('conversation rendering', () => {
        it('renders user and assistant messages', () => {
            mockMessages = [
                {
                    id: 'msg-1',
                    role: 'user',
                    parts: [{ type: 'text', text: 'Hello' }],
                },
                {
                    id: 'msg-2',
                    role: 'assistant',
                    parts: [{ type: 'text', text: 'Hi! How can I help?' }],
                },
            ]

            render(<ChatContent variant="page" />)

            expect(screen.getByText('Hello')).toBeInTheDocument()
            // Assistant text is rendered inside the mocked Streamdown
            expect(screen.getByText('Hi! How can I help?')).toBeInTheDocument()
        })

        it('shows copy button for assistant messages', () => {
            mockMessages = [
                {
                    id: 'msg-1',
                    role: 'user',
                    parts: [{ type: 'text', text: 'Hi' }],
                },
                {
                    id: 'msg-2',
                    role: 'assistant',
                    parts: [{ type: 'text', text: 'Hello!' }],
                },
            ]

            render(<ChatContent variant="page" />)

            expect(screen.getByText('Copy message')).toBeInTheDocument()
        })
    })
})
