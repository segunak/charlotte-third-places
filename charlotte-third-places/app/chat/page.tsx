"use client"

import { ChatContent } from "@/components/ChatContent"

export default function ChatPage() {
    return (
        <div className="flex flex-col h-[calc(100dvh-8rem)] sm:h-auto max-w-3xl mx-auto">
            <ChatContent variant="page" showStarterPrompts />
        </div>
    )
}
