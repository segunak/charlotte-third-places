"use client"

import { Place } from "@/lib/types"
import { Icons } from "@/components/Icons"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { useState, useEffect, useCallback } from "react"
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from "@/components/ui/shadcn-io/ai/conversation"
import {
    Message,
    MessageContent,
} from "@/components/ui/shadcn-io/ai/message"
import {
    PromptInput,
    PromptInputTextarea,
    PromptInputActions,
    PromptInputSubmit,
} from "@/components/ui/shadcn-io/ai/prompt-input"
import { Suggestions, Suggestion } from "@/components/ui/shadcn-io/ai/suggestion"
import { Actions, Action } from "@/components/ui/shadcn-io/ai/actions"
import { Loader } from "@/components/ui/shadcn-io/ai/loader"
import { Response } from "@/components/ui/shadcn-io/ai/response"
import { PromptLibrary } from "@/components/PromptLibrary"
import { CopyIcon, CheckIcon, Trash2Icon } from "lucide-react"

interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
}

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

// Generate unique ID for messages
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
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

export function ChatContent({
    place,
    initialMessage,
    variant = "dialog",
    showStarterPrompts = false,
}: ChatContentProps) {
    const isMobile = useIsMobile()
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [initialMessageSent, setInitialMessageSent] = useState(false)
    const [isInputOverflowing, setIsInputOverflowing] = useState(false)

    const placeId = place?.googleMapsPlaceId
    const isDialog = variant === "dialog"
    const isPage = variant === "page"

    // Reset state when place changes
    useEffect(() => {
        setMessages([])
        setInitialMessageSent(false)
    }, [placeId])

    const handleSendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isLoading) return

        setError(null)
        setInput("")

        // Add user message
        const userMessage: ChatMessage = {
            id: generateId(),
            role: "user",
            content: content.trim()
        }

        setMessages(prev => [...prev, userMessage])
        setIsLoading(true)

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    placeId: placeId
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || "Failed to get response")
            }

            const data = await response.json()

            // Add assistant message
            const assistantMessage: ChatMessage = {
                id: generateId(),
                role: "assistant",
                content: data.content
            }

            setMessages(prev => [...prev, assistantMessage])
        } catch (e) {
            console.error("Chat error:", e)
            setError(e instanceof Error ? e.message : "Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }, [messages, placeId, isLoading])

    // Send initial message if provided
    useEffect(() => {
        if (initialMessage && !initialMessageSent && messages.length === 0) {
            setInitialMessageSent(true)
            handleSendMessage(initialMessage)
        }
    }, [initialMessage, messages.length, handleSendMessage, initialMessageSent])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (input.trim()) {
            handleSendMessage(input)
        }
    }

    const handleSuggestionClick = (suggestion: string) => {
        handleSendMessage(suggestion)
    }

    const handleClearHistory = useCallback(() => {
        setMessages([])
    }, [])

    const handleCopy = async (content: string, messageId: string) => {
        await navigator.clipboard.writeText(content)
        setCopiedId(messageId)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const placeholder = place
        ? "Ask a question..."
        : "What kind of place are you looking for?"

    // Welcome message for empty chat
    const welcomeMessage = place
        ? "Ask about the vibe, amenities, hours, or anything else!"
        : "Looking for the perfect spot to work, study, read, or hang out? Ask me anything!"

    // Sizing based on variant
    const maxHeight = isMobile ? 80 : 120
    const minHeight = 47

    // Empty state content differs between dialog and page
    const emptyStateContent = isPage && showStarterPrompts ? (
        <div className="flex flex-col items-center justify-center flex-1 p-6 sm:p-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Icons.mapPin className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-center">Charlotte Third Places</h2>
            <p className="text-muted-foreground text-center max-w-md mb-8 text-sm sm:text-base">
                {welcomeMessage}
            </p>
            <Suggestions className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
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
        <div className="flex flex-col items-center justify-center flex-1 p-3 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Icons.mapPin className="h-5 w-5 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm max-w-sm mb-4">
                {welcomeMessage}
            </p>
            {place && (
                <Suggestions className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                    {placePrompts.map((prompt) => (
                        <Suggestion
                            key={prompt}
                            suggestion={prompt}
                            onClick={handleSuggestionClick}
                            className="whitespace-normal text-center h-auto py-2.5 px-4 rounded-full justify-center text-sm"
                        />
                    ))}
                </Suggestions>
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
                        {messages.map((message) => (
                            <Message key={message.id} from={message.role}>
                                <MessageContent>
                                    {message.role === "assistant" ? (
                                        <Response>{message.content}</Response>
                                    ) : (
                                        message.content
                                    )}
                                    {/* Actions for assistant messages */}
                                    {message.role === "assistant" && (
                                        <Actions className="mt-2 -ml-1">
                                            <Action
                                                tooltip="Copy"
                                                label="Copy message"
                                                onClick={() => handleCopy(message.content, message.id)}
                                                className="text-secondary-foreground hover:text-secondary-foreground/80"
                                            >
                                                {copiedId === message.id ? (
                                                    <CheckIcon className="size-4" />
                                                ) : (
                                                    <CopyIcon className="size-4" />
                                                )}
                                            </Action>
                                        </Actions>
                                    )}
                                </MessageContent>
                            </Message>
                        ))}

                        {/* Loading state */}
                        {isLoading && (
                            <Message from="assistant">
                                <MessageContent>
                                    <Loader />
                                </MessageContent>
                            </Message>
                        )}

                        {/* Error state */}
                        {error && (
                            <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                    </ConversationContent>
                    <ConversationScrollButton />
                </Conversation>
            )}

            {/* Input area */}
            <div className={isPage ? "shrink p-4 sm:p-6" : "shrink p-3"}>
                <PromptInput
                    onSubmit={handleSubmit}
                    className={isPage ? "shadow-lg rounded-3xl relative" : "rounded-3xl relative"}
                >
                    <PromptInputTextarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={placeholder}
                        disabled={isLoading}
                        className={(messages.length > 0 || isInputOverflowing) ? "" : "pr-14"}
                        minHeight={minHeight}
                        maxHeight={maxHeight}
                        onOverflowChange={setIsInputOverflowing}
                    />
                    {(messages.length > 0 || isInputOverflowing) ? (
                        <PromptInputActions className={isDialog ? "pt-0" : ""}>
                            {messages.length > 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearHistory}
                                    className={isDialog
                                        ? "text-muted-foreground hover:bg-primary h-7 text-xs mr-auto"
                                        : "text-muted-foreground hover:bg-muted h-8 text-xs mr-auto"
                                    }
                                >
                                    <Trash2Icon className={isDialog ? "size-3 mr-1" : "size-3.5 mr-1"} />
                                    New chat
                                </Button>
                            )}
                            <PromptInputSubmit
                                disabled={isLoading || !input.trim()}
                                status={isLoading ? "submitted" : undefined}
                                className={isDialog ? "h-8 w-8 rounded-full" : "h-9 w-9 rounded-full"}
                            />
                        </PromptInputActions>
                    ) : (
                        <div className="absolute right-2 bottom-2.5">
                            <PromptInputSubmit
                                disabled={isLoading || !input.trim()}
                                status={isLoading ? "submitted" : undefined}
                                className={isDialog ? "h-8 w-8 rounded-full" : "h-9 w-9 rounded-full"}
                            />
                        </div>
                    )}
                </PromptInput>
            </div>
        </div>
    )
}
