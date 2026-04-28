"use client"

import { Place } from "@/lib/types"
import { Icons } from "@/components/Icons"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { useModalActions } from "@/contexts/ModalContext"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { useEffect, useCallback, useState, useRef, useMemo } from "react"
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
    Message,
    MessageContent,
    MessageActions,
    MessageAction,
    MessageResponse,
} from "@/components/ai-elements/message"
import {
    PromptInput,
    PromptInputTextarea,
    PromptInputFooter,
    PromptInputTools,
    PromptInputSubmit,
} from "@/components/ai-elements/prompt-input"
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion"
import { Loader } from "@/components/ai-elements/loader"
import { PromptLibrary } from "@/components/PromptLibrary"
import { CopyIcon, CheckIcon, Trash2Icon } from "lucide-react"

export interface ChatContentProps {
    /** Optional place context for place-specific chats */
    place?: Place | null
    /** Optional initial message to send automatically */
    initialMessage?: string
    /** Variant affects sizing and styling */
    variant?: "dialog" | "page"
    /** Show starter prompts in empty state (only for page variant) */
    showStarterPrompts?: boolean
}

// Starter prompts for empty chat (general)
const starterPrompts = [
    "What are some good spots for groups?",
    "What places are great for remote work?",
    "What are some hidden gem third places?",
    "Where can I find a quiet spot to read with a view?",
];

// Place-specific prompts for dialog variant
const placePrompts = [
    "How's access to outlets and Wi-Fi?",
    "What's the vibe and aesthetic like here?",
    "What are some fun facts about this place?",
    "What are the best times to visit to avoid crowds?"
];

// Helper to extract text content from UIMessage parts
function getMessageText(message: UIMessage): string {
    if (!message.parts) return "";
    return message.parts
        .filter((part): part is { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text)
        .join("");
}

export function ChatContent({
    place,
    initialMessage,
    variant = "dialog",
    showStarterPrompts = false,
}: ChatContentProps) {
    const isMobile = useIsMobile()
    const { pushPlace } = useModalActions()
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [initialMessageSent, setInitialMessageSent] = useState(false)
    const [input, setInput] = useState("")
    const conversationRef = useRef<HTMLDivElement>(null)
    const placeCacheRef = useRef<Map<string, Promise<Place> | Place>>(new Map())

    const placeId = place?.googleMapsPlaceId
    const placeRecordId = place?.recordId
    const isDialog = variant === "dialog"
    const isPage = variant === "page"

    // Render-layer override for Streamdown links. In a place-scoped chat,
    // any link pointing to the SAME place the user is already chatting about
    // is rendered as <strong> instead of <a> — deterministically eliminates
    // the no-op self-reference click. The AI's output is irrelevant; this
    // renderer is the gatekeeper.
    const messageComponents = useMemo(() => {
        if (!placeRecordId) return undefined;
        return {
            a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
                const matchedId = href?.match(/(?:charlottethirdplaces\.com)?\/places\/([^/?#]+)/i)?.[1];
                if (matchedId && matchedId === placeRecordId) {
                    return <strong>{children}</strong>;
                }
                // Re-apply Streamdown's default link classes since custom
                // components fully replace defaults (including built-in styles).
                return (
                    <a
                        href={href}
                        className="text-primary underline wrap-anywhere font-medium"
                        {...props}
                    >
                        {children}
                    </a>
                );
            },
        };
    }, [placeRecordId]);

    // Stable transport that only rebuilds when placeId changes.
    const transport = useMemo(
        () => new DefaultChatTransport({
            api: "/api/chat",
            body: { placeId },
        }),
        [placeId]
    )

    // Use the Vercel AI SDK v5 useChat hook
    const {
        messages,
        sendMessage,
        stop,
        status,
        error,
        setMessages,
    } = useChat({
        transport,
        onError: (err) => {
            console.error("Chat error:", err)
        },
    })

    // Reset state when place changes (transport itself is rebuilt by useMemo above).
    useEffect(() => {
        setInitialMessageSent(false)
        setInput("")
    }, [placeId])

    // Intercept clicks on internal place links in AI responses so the chat
    // session is preserved instead of navigating away.
    //
    // Implementation: document-level click delegation, scoped via the chat
    // root element id. This is bulletproof against:
    // - Streamdown's `components.a` override being ignored
    // - StickToBottom not forwarding React onClick events
    // - Ref/render-timing races (the document is always there)
    // - Streaming content being inserted after the listener attached
    //
    // Lookup: fetch /api/places/[id] on demand, with a client-side Map cache
    // so repeat clicks on the same place are instant. On miss, render an
    // inline error so the chat session is never silently destroyed.
    useEffect(() => {
        const handleClick = async (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;

            const anchor = target.closest('a');
            if (!anchor) return;

            // Only intercept clicks INSIDE this chat instance.
            const root = conversationRef.current;
            if (!root || !root.contains(anchor)) return;

            const href = anchor.getAttribute('href');
            if (!href) return;

            // Anything pointing to /places/<id> on our domain (or relative) is
            // an internal place link — open it in the modal instead of navigating.
            const match = href.match(/(?:charlottethirdplaces\.com)?\/places\/([^/?#]+)/i)?.[1];
            if (!match) return; // Not an internal place link — let browser handle it.

            e.preventDefault();
            // stopPropagation in capture phase intentionally suppresses any
            // nested handlers (e.g. Streamdown's hardcoded <a> behaviors) so
            // only this delegate processes the click.
            e.stopPropagation();

            // Check cache first. Entries may be either a resolved Place or an
            // in-flight Promise<Place> (dedupes concurrent clicks on the same id).
            const cached = placeCacheRef.current.get(match);
            if (cached) {
                try {
                    const place = await cached;
                    pushPlace(place, { hideAskAI: true });
                    return;
                } catch {
                    // Fall through to fetch retry below.
                }
            }

            // Fetch single place by ID. Store the promise in the cache BEFORE
            // awaiting so concurrent clicks reuse it.
            const pending = (async (): Promise<Place> => {
                const res = await fetch(`/api/places/${encodeURIComponent(match)}`);
                if (!res.ok) throw new Error(`status ${res.status}`);
                return res.json() as Promise<Place>;
            })();
            placeCacheRef.current.set(match, pending);

            try {
                const fetched = await pending;
                placeCacheRef.current.set(match, fetched);
                pushPlace(fetched, { hideAskAI: true });
                return;
            } catch {
                // Drop failed entry so a future click can retry.
                placeCacheRef.current.delete(match);
            }

            // Last resort: render an inline error chip into the chat so the
            // user sees what went wrong without losing the chat session.
            console.warn('[ChatContent] place not found for', match);
            setMessages(prev => [
                ...prev,
                {
                    id: `place-error-${Date.now()}`,
                    role: 'assistant',
                    parts: [
                        {
                            type: 'text',
                            text: `Sorry — I couldn’t open that place. It may have been removed or is temporarily unavailable.`,
                        },
                    ],
                } as UIMessage,
            ]);
        };

        // Capture phase so we run before any nested handlers (e.g. Streamdown's).
        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, [pushPlace, setMessages]);

    // Send initial message if provided
    useEffect(() => {
        if (initialMessage && !initialMessageSent && messages.length === 0 && status === "ready") {
            setInitialMessageSent(true)
            sendMessage({ text: initialMessage })
        }
    }, [initialMessage, messages.length, sendMessage, initialMessageSent, status])

    const handleSuggestionClick = useCallback((suggestion: string) => {
        sendMessage({ text: suggestion })
    }, [sendMessage])

    const handleClearHistory = useCallback(() => {
        setMessages([])
        setInput("")
    }, [setMessages])

    const handleCopy = async (content: string, messageId: string) => {
        await navigator.clipboard.writeText(content)
        setCopiedId(messageId)
        setTimeout(() => setCopiedId(null), 2000)
    }

    // handleSubmit matches the PromptInput expected signature
    const handleSubmit = useCallback((message: { text: string; files: unknown[] }, _event: React.FormEvent) => {
        if (!message.text.trim() || status !== "ready") return
        sendMessage({ text: message.text })
        setInput("")
    }, [sendMessage, status])

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value)
    }, [])

    // Derive loading state from status
    const isLoading = status === "submitted" || status === "streaming"

    // Convert status to PromptInputSubmit format
    const chatStatus = isLoading ? "streaming" : "ready"

    const placeholder = place
        ? "Ask a question..."
        : "What kind of place are you looking for?"

    // Welcome message for empty chat
    const welcomeMessage = place
        ? "Ask about the vibe, amenities, hours, or anything else!"
        : "Looking for the perfect spot to work, study, read, or hang out? Ask me anything!"

    // Empty state content differs between dialog and page
    const emptyStateContent = isPage && showStarterPrompts ? (
        <div className="flex flex-col items-center justify-center flex-1 p-6 sm:p-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Icons.logo className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-center">Charlotte Third Places</h2>
            <p className="text-muted-foreground text-center max-w-md mb-8 text-sm sm:text-base">
                {welcomeMessage}
            </p>
            {/* 
              Using a plain div instead of <Suggestions> here for proper centering.
              The Suggestions component wraps content in a ScrollArea with internal 
              styles (display: table, w-max, flex-nowrap) that prevent flex centering.
              Since we don't need horizontal scrolling, a simple flexbox works better.
            */}
            <div className="flex flex-wrap gap-3 justify-center w-full">
                {starterPrompts.map((prompt) => (
                    <Suggestion
                        key={prompt}
                        suggestion={prompt}
                        onClick={handleSuggestionClick}
                        className="whitespace-normal text-center h-auto py-3 px-5 rounded-full justify-center text-sm"
                    />
                ))}
            </div>
            <div className="mt-6">
                <PromptLibrary onSelectPrompt={handleSuggestionClick} />
            </div>
        </div>
    ) : (
        <div className="flex flex-col items-center justify-center flex-1 min-h-[320px] p-3 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Icons.logo className="h-5 w-5 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm max-w-sm mb-4">
                {welcomeMessage}
            </p>
            {/* 
              Using a plain div instead of <Suggestions> here for proper centering.
              The Suggestions component wraps content in a ScrollArea with internal 
              styles (display: table, w-max, flex-nowrap) that prevent flex centering.
              Since we don't need horizontal scrolling in the dialog, a simple flexbox works better.
            */}
            {place && (
                <div className="flex flex-wrap gap-2 justify-center max-w-full">
                    {placePrompts.map((prompt) => (
                        <Suggestion
                            key={prompt}
                            suggestion={prompt}
                            onClick={handleSuggestionClick}
                            className="whitespace-normal text-center h-auto py-2.5 px-4 rounded-full justify-center text-sm"
                        />
                    ))}
                </div>
            )}
        </div>
    )

    return (
        <div className="flex flex-col h-full">
            {/* Empty state */}
            {messages.length === 0 && !isLoading ? (
                emptyStateContent
            ) : (
                /* Conversation area */
                <Conversation className="flex-1 min-h-0">
                    <ConversationContent className={isPage ? "px-4 sm:px-6" : "px-4"}>
                        <div ref={conversationRef} data-testid="conversation-links">
                        {messages.map((message) => {
                            const textContent = getMessageText(message)
                            return (
                                <Message key={message.id} from={message.role}>
                                    <MessageContent>
                                        {message.role === "assistant" ? (
                                            <MessageResponse linkSafety={{ enabled: false }} components={messageComponents}>{textContent}</MessageResponse>
                                        ) : (
                                            textContent
                                        )}
                                        {/* Actions for assistant messages */}
                                        {message.role === "assistant" && textContent && (
                                            <MessageActions className="mt-2 -ml-1">
                                                <MessageAction
                                                    tooltip="Copy"
                                                    label="Copy message"
                                                    onClick={() => handleCopy(textContent, message.id)}
                                                >
                                                    {copiedId === message.id ? (
                                                        <CheckIcon className="size-4" />
                                                    ) : (
                                                        <CopyIcon className="size-4" />
                                                    )}
                                                </MessageAction>
                                            </MessageActions>
                                        )}
                                    </MessageContent>
                                </Message>
                            )
                        })}

                        {/* Loading state */}
                        {isLoading && messages[messages.length - 1]?.role === "user" && (
                            <Message from="assistant">
                                <MessageContent>
                                    <Loader />
                                </MessageContent>
                            </Message>
                        )}

                        {/* Error state */}
                        {error && (
                            <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                                {error.message || "Something went wrong. Please try again."}
                            </div>
                        )}
                        </div>
                    </ConversationContent>
                    <ConversationScrollButton />
                </Conversation>
            )}

            {/* Input area */}
            <div className={isPage ? "shrink-0 p-4 sm:p-6" : "shrink-0 p-3"}>
                <PromptInput
                    onSubmit={handleSubmit}
                    className={isPage ? "shadow-lg rounded-3xl" : "rounded-3xl"}
                >
                    <PromptInputTextarea
                        value={input}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        disabled={isLoading}
                        className={isPage ? "min-h-8 sm:min-h-12 max-h-12" : "min-h-12 max-h-32"}
                    />
                    <PromptInputFooter className="p-2">
                        <PromptInputTools className="gap-0">
                            {messages.length > 0 && (
                                <>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearHistory}
                                        className="text-muted-foreground hover:bg-primary h-8 px-2 text-xs inline-flex items-center"
                                    >
                                        <Trash2Icon className="size-3.5 mr-1 shrink-0" />
                                        <span className="leading-none">New Chat</span>
                                    </Button>
                                    <PromptLibrary 
                                        onSelectPrompt={handleSuggestionClick} 
                                        variant="toolbar" 
                                    />
                                </>
                            )}
                        </PromptInputTools>
                        <PromptInputSubmit
                            disabled={!isLoading && !input.trim()}
                            status={chatStatus}
                            onClick={isLoading ? stop : undefined}
                            className="h-9 w-9 rounded-full"
                        />
                    </PromptInputFooter>
                </PromptInput>
            </div>
        </div>
    )
}
