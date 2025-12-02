"use client"

import { Place } from "@/lib/types"
import { Icons } from "@/components/Icons"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { useChat, type UseChatHelpers } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { useEffect, useCallback, useState, useRef } from "react"
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
    /** Callback when dialog should be opened (triggered by state changes) */
    onOpenChange?: (open: boolean) => void
}

// Starter prompts for empty chat (general)
const starterPrompts = [
    "What are some hidden gem cafes?",
    "What are some good spots for groups?",
    "What places are great for remote work?",
    "Where can I find a quiet spot to study?",
];

// Place-specific prompts for dialog variant
const placePrompts = [
    "What's the vibe like here?",
    "What are the best times to visit?",
    "What amenities does this spot offer?",
    "Is this a good spot to work remotely?"
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
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [initialMessageSent, setInitialMessageSent] = useState(false)
    const [input, setInput] = useState("")

    const placeId = place?.googleMapsPlaceId
    const isDialog = variant === "dialog"
    const isPage = variant === "page"

    // Create a stable transport reference that includes placeId in the body
    const transportRef = useRef<DefaultChatTransport<UIMessage> | null>(null)
    if (!transportRef.current || transportRef.current !== null) {
        transportRef.current = new DefaultChatTransport({
            api: "/api/chat",
            body: { placeId },
        })
    }

    // Use the Vercel AI SDK v5 useChat hook
    const {
        messages,
        sendMessage,
        status,
        error,
        setMessages,
    } = useChat({
        transport: transportRef.current,
        onError: (err) => {
            console.error("Chat error:", err)
        },
    })

    // Reset state when place changes
    useEffect(() => {
        setMessages([])
        setInitialMessageSent(false)
        setInput("")
        // Recreate transport with new placeId
        transportRef.current = new DefaultChatTransport({
            api: "/api/chat",
            body: { placeId },
        })
    }, [placeId, setMessages])

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
            <Suggestions className="!w-full !flex-wrap gap-3 max-w-2xl justify-center [&>div]:w-full [&>div]:flex-wrap [&>div]:justify-center">
                {starterPrompts.map((prompt) => (
                    <Suggestion
                        key={prompt}
                        suggestion={prompt}
                        onClick={handleSuggestionClick}
                        className="whitespace-normal text-center h-auto py-3 px-5 rounded-full justify-center text-sm"
                    />
                ))}
            </Suggestions>
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
                <div className="flex flex-wrap gap-2 justify-center max-w-xl">
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
                        {messages.map((message) => {
                            const textContent = getMessageText(message)
                            return (
                                <Message key={message.id} from={message.role}>
                                    <MessageContent>
                                        {message.role === "assistant" ? (
                                            <MessageResponse>{textContent}</MessageResponse>
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
                        className="min-h-12 max-h-32"
                    />
                    <PromptInputFooter className="p-2">
                        <PromptInputTools>
                            {messages.length > 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearHistory}
                                    className="text-muted-foreground hover:text-foreground h-8 text-xs"
                                >
                                    <Trash2Icon className="size-3.5 mr-1" />
                                    New chat
                                </Button>
                            )}
                        </PromptInputTools>
                        <PromptInputSubmit
                            disabled={isLoading || !input.trim()}
                            status={chatStatus}
                            className="h-9 w-9 rounded-full"
                        />
                    </PromptInputFooter>
                </PromptInput>
            </div>
        </div>
    )
}
