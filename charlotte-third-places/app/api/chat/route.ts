import { type NextRequest, NextResponse } from "next/server"

// Azure Function base URL
const AZURE_FUNCTION_URL = "https://third-places-data.azurewebsites.net"
const AZURE_FUNCTION_KEY = process.env.AZURE_FUNCTION_KEY

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        
        const { messages, placeId } = body
        
        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: "messages array is required" },
                { status: 400 }
            )
        }

        // Validate messages format
        for (const msg of messages) {
            if (!msg.role || !msg.content) {
                return NextResponse.json(
                    { error: "Each message must have role and content" },
                    { status: 400 }
                )
            }
            if (!["user", "assistant"].includes(msg.role)) {
                return NextResponse.json(
                    { error: "Message role must be 'user' or 'assistant'" },
                    { status: 400 }
                )
            }
        }

        // Build Azure Function URL
        const functionUrl = new URL("/api/chat", AZURE_FUNCTION_URL)
        
        // Add function key if available
        if (AZURE_FUNCTION_KEY) {
            functionUrl.searchParams.set("code", AZURE_FUNCTION_KEY)
        }

        // Forward request to Azure Function
        const azureResponse = await fetch(functionUrl.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages,
                placeId,
                stream: false
            }),
        })

        if (!azureResponse.ok) {
            const errorData = await azureResponse.json().catch(() => ({}))
            console.error("Azure Function error:", errorData)
            
            return NextResponse.json(
                { 
                    error: errorData.error || "Failed to get AI response",
                    message: errorData.message || "The AI service is temporarily unavailable"
                },
                { status: azureResponse.status }
            )
        }

        const data = await azureResponse.json()

        // Return the response content
        return NextResponse.json({
            content: data.data?.content || data.content,
            context: data.data?.context || data.context
        })

    } catch (error) {
        console.error("Chat API error:", error)
        
        return NextResponse.json(
            { 
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        )
    }
}
