"use client"

import { ChatContent } from "@/components/ChatContent"

export default function ChatPage() {
    return (
        <div className="flex flex-col h-full max-w-3xl mx-auto overflow-y-auto mb-4 sm:pb-0">
            <ChatContent variant="page" showStarterPrompts />
        </div>
    )
}
