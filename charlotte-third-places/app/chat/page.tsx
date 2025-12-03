"use client"

import { ChatContent } from "@/components/ChatContent"

export default function ChatPage() {
    return (
        <div className="flex flex-col h-[85dvh] max-w-3xl mx-auto overflow-y-auto pb-2">
            <ChatContent variant="page" showStarterPrompts />
        </div>
    )
}
