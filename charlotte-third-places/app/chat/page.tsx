"use client"

import { ChatContent } from "@/components/ChatContent"

export default function ChatPage() {
    return (
        <div className="flex flex-col h-auto max-w-3xl mx-auto overflow-y-auto pb-safe">
            <ChatContent variant="page" showStarterPrompts />
        </div>
    )
}
