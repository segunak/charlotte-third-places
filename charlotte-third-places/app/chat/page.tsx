"use client"

import { ChatContent } from "@/components/ChatContent"

export default function ChatPage() {
    // Mobile: 100dvh - 4rem (header h-16) - 4rem (bottom nav h-16) = 8rem
    // Desktop: auto height, natural flow
    return (
        <div className="flex flex-col h-[calc(100dvh-8rem)] sm:h-auto max-w-3xl mx-auto overflow-hidden pb-safe">
            <ChatContent variant="page" showStarterPrompts />
        </div>
    )
}
