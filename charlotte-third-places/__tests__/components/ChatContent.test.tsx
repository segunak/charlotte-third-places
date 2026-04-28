import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { ChatContent } from '@/components/ChatContent'
import type { Place } from '@/lib/types'

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

// Mock ModalContext — capture pushPlace calls
const mockPushPlace = vi.fn()
vi.mock('@/contexts/ModalContext', () => ({
    useModalActions: () => ({
        pushPlace: mockPushPlace,
        pushPhotos: vi.fn(),
        pushChat: vi.fn(),
        pop: vi.fn(),
        popTo: vi.fn(),
        closeAll: vi.fn(),
    }),
}))

// Helper to create a mock place for link interception tests
function createMockPlace(overrides: Partial<Place> = {}): Place {
    return {
        recordId: 'recABCDEFGHIJKLMN',
        name: 'Test Coffee Shop',
        operational: 'Yes',
        type: ['Coffee Shop'],
        size: 'Medium',
        tags: [],
        neighborhood: 'NoDa',
        address: '123 Test St',
        purchaseRequired: 'Yes',
        parking: ['Street Parking'],
        freeWiFi: 'Yes',
        hasCinnamonRolls: 'No',
        hasReviews: 'Yes',
        featured: false,
        description: 'A test place',
        website: '',
        tiktok: '',
        instagram: '',
        youtube: '',
        facebook: '',
        twitter: '',
        linkedIn: '',
        googleMapsPlaceId: 'abc123',
        googleMapsProfileURL: 'https://maps.google.com',
        appleMapsProfileURL: 'https://maps.apple.com',
        photos: [],
        curatorPhotos: [],
        comments: '',
        latitude: 35.2271,
        longitude: -80.8431,
        operatingHours: [],
        createdDate: new Date(),
        lastModifiedDate: new Date(),
        ...overrides,
    }
}

describe('ChatContent', () => {
    beforeEach(() => {
        capturedStreamdownProps = {}
        mockMessages = []
        mockStatus = 'ready'
        vi.clearAllMocks()
        mockPushPlace.mockReset()
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

    describe('place link interception', () => {
        const assistantMessages = [
            {
                id: 'msg-1',
                role: 'user',
                parts: [{ type: 'text', text: 'Where can I get coffee?' }],
            },
            {
                id: 'msg-2',
                role: 'assistant',
                parts: [{ type: 'text', text: 'Check out a place' }],
            },
        ]

        let originalFetch: typeof fetch
        let windowOpenSpy: ReturnType<typeof vi.fn>
        let originalWindowOpen: typeof window.open

        beforeEach(() => {
            originalFetch = global.fetch
            originalWindowOpen = window.open
            windowOpenSpy = vi.fn()
            window.open = windowOpenSpy as unknown as typeof window.open
        })

        afterEach(() => {
            global.fetch = originalFetch
            window.open = originalWindowOpen
        })

        async function dispatchClickOn(href: string) {
            const refDiv = screen.getByTestId('conversation-links')
            const link = document.createElement('a')
            link.setAttribute('href', href)
            link.textContent = 'A Link'
            refDiv.appendChild(link)
            await act(async () => {
                link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
            })
        }

        it('opens PlaceModal when link matches a place returned by /api/places/[id]', async () => {
            const place = createMockPlace({ recordId: 'recABCDEFGHIJKLMN', name: 'Found Place' })
            mockMessages = assistantMessages
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => place,
            }) as unknown as typeof fetch

            render(<ChatContent variant="page" />)
            await dispatchClickOn('https://www.charlottethirdplaces.com/places/recABCDEFGHIJKLMN')

            await waitFor(() => {
                expect(mockPushPlace).toHaveBeenCalledWith(place, { hideAskAI: true })
            })
            expect(global.fetch).toHaveBeenCalledWith('/api/places/recABCDEFGHIJKLMN')
            expect(windowOpenSpy).not.toHaveBeenCalled()
        })

        it('matches relative /places/recXXX URLs', async () => {
            const place = createMockPlace({ recordId: 'recABCDEFGHIJKLMN' })
            mockMessages = assistantMessages
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => place,
            }) as unknown as typeof fetch

            render(<ChatContent variant="page" />)
            await dispatchClickOn('/places/recABCDEFGHIJKLMN')

            await waitFor(() => {
                expect(mockPushPlace).toHaveBeenCalledWith(place, { hideAskAI: true })
            })
        })

        it('matches URLs with trailing slash, query string, and hash', async () => {
            const place = createMockPlace({ recordId: 'recABCDEFGHIJKLMN' })
            mockMessages = assistantMessages
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => place,
            }) as unknown as typeof fetch

            for (const href of [
                'https://charlottethirdplaces.com/places/recABCDEFGHIJKLMN/',
                'https://www.charlottethirdplaces.com/places/recABCDEFGHIJKLMN?from=chat',
                'https://charlottethirdplaces.com/places/recABCDEFGHIJKLMN#hours',
            ]) {
                mockPushPlace.mockClear()
                const { unmount } = render(<ChatContent variant="page" />)
                await dispatchClickOn(href)
                await waitFor(() => expect(mockPushPlace).toHaveBeenCalledWith(place, { hideAskAI: true }))
                unmount()
            }
        })

        it('fetches single place by ID from /api/places/[id]', async () => {
            const place = createMockPlace({ recordId: 'recABCDEFGHIJKLMN' })
            mockMessages = assistantMessages
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => place,
            }) as unknown as typeof fetch

            render(<ChatContent variant="dialog" />)
            await dispatchClickOn('/places/recABCDEFGHIJKLMN')

            await waitFor(() => {
                expect(mockPushPlace).toHaveBeenCalledWith(place, { hideAskAI: true })
            })
            expect(global.fetch).toHaveBeenCalledWith('/api/places/recABCDEFGHIJKLMN')
            expect(windowOpenSpy).not.toHaveBeenCalled()
        })

        it('renders inline error when place is not found', async () => {
            mockMessages = assistantMessages
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 404,
            }) as unknown as typeof fetch

            render(<ChatContent variant="page" />)
            await dispatchClickOn('/places/recABCDEFGHIJKLMN')

            await waitFor(() => {
                expect(mockSetMessages).toHaveBeenCalled()
                const lastCallArg = mockSetMessages.mock.calls.at(-1)?.[0]
                const updater = typeof lastCallArg === 'function' ? lastCallArg : null
                expect(updater).toBeTypeOf('function')
                const next = updater!([])
                expect(next.at(-1)?.parts[0]?.text).toMatch(/couldn’t open that place/i)
            })
            expect(windowOpenSpy).not.toHaveBeenCalled()
            expect(mockPushPlace).not.toHaveBeenCalled()
        })

        it('renders inline error chip when fetch fails', async () => {
            mockMessages = assistantMessages
            global.fetch = vi.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch

            render(<ChatContent variant="dialog" />)
            await dispatchClickOn('/places/recABCDEFGHIJKLMN')

            await waitFor(() => {
                expect(mockSetMessages).toHaveBeenCalled()
                const lastCallArg = mockSetMessages.mock.calls.at(-1)?.[0]
                const updater = typeof lastCallArg === 'function' ? lastCallArg : null
                expect(updater).toBeTypeOf('function')
                const next = updater!([])
                expect(next.at(-1)?.parts[0]?.text).toMatch(/couldn’t open that place/i)
            })
            expect(windowOpenSpy).not.toHaveBeenCalled()
        })

        it('does not intercept external links', async () => {
            mockMessages = assistantMessages

            render(<ChatContent variant="page" />)
            await dispatchClickOn('https://maps.google.com/?cid=123')

            expect(mockPushPlace).not.toHaveBeenCalled()
            expect(windowOpenSpy).not.toHaveBeenCalled()
        })

        it('does not intercept other internal app links', async () => {
            mockMessages = assistantMessages

            render(<ChatContent variant="page" />)
            await dispatchClickOn('/about')

            expect(mockPushPlace).not.toHaveBeenCalled()
            expect(windowOpenSpy).not.toHaveBeenCalled()
        })
    })
})
