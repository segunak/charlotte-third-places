/**
 * Chat API route with Vercel AI SDK streaming.
 * Uses RAG to retrieve relevant places and reviews from Cosmos DB,
 * then streams responses from Azure OpenAI via Foundry.
 */

import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createAzure } from "@ai-sdk/azure";
import { performRAG } from "@/lib/ai/rag";
import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { AI_CONFIG } from "@/lib/ai/config";

/**
 * Create Azure OpenAI provider configured for Foundry.
 *
 * Azure OpenAI REST API Reference:
 * @see https://learn.microsoft.com/en-us/azure/ai-foundry/openai/reference?view=foundry-classic
 *
 * Microsoft Foundry SDKs and Endpoints:
 * @see https://learn.microsoft.com/en-us/azure/ai-foundry/how-to/develop/sdk-overview?view=foundry&pivots=programming-language-javascript
 *
 * Vercel AI SDK Azure Provider:
 * @see https://ai-sdk.dev/providers/ai-sdk-providers/azure
 *
 * Configuration:
 * - useDeploymentBasedUrls: true - Uses deployment-based URL format required by Azure AI Foundry
 * - URL format: {baseURL}/deployments/{deploymentId}{path}?api-version={version}
 * - Model configuration defined in lib/ai/config.ts
 */
const azure = createAzure({
  apiKey: process.env.FOUNDRY_API_KEY,
  baseURL: `${AI_CONFIG.endpoint}openai`,
  apiVersion: AI_CONFIG.apiVersion,
  useDeploymentBasedUrls: true,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, placeId } = body;

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role) {
        return new Response(
          JSON.stringify({ error: "Each message must have a role" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      if (!["user", "assistant"].includes(msg.role)) {
        return new Response(
          JSON.stringify({ error: "Message role must be 'user' or 'assistant'" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Get the latest user message for RAG retrieval
    const userMessages = messages.filter((m: { role: string }) => m.role === "user");
    if (userMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one user message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract text from the latest user message (parts array contains text parts)
    const lastUserMessage = userMessages[userMessages.length - 1];
    const textParts = lastUserMessage.parts?.filter((p: { type: string }) => p.type === "text") || [];
    const latestQuery = textParts.map((p: { text: string }) => p.text).join(" ") || "";

    // Perform RAG retrieval
    const ragResult = await performRAG({
      query: latestQuery,
      placeId: placeId || undefined,
    });

    console.log(
      `RAG completed: ${ragResult.placesCount} places, ${ragResult.chunksCount} chunks${
        placeId ? ` (place-specific: ${placeId})` : ""
      }`
    );

    // Build system messages with RAG context
    const systemMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      {
        role: "system" as const,
        content: `Here is relevant information about Charlotte third places to help answer the user's question:\n\n${ragResult.context}`,
      },
    ];

    // Convert UIMessages (parts-based) to model messages (content-based)
    const modelMessages = convertToModelMessages(messages as UIMessage[]);

    // Stream response from Azure OpenAI
    // AbortSignal.timeout ensures we fail gracefully before Vercel's 30s maxDuration limit
    const result = streamText({
      model: azure(AI_CONFIG.chatModel),
      messages: [...systemMessages, ...modelMessages],
      maxOutputTokens: AI_CONFIG.maxOutputTokens,
      temperature: AI_CONFIG.temperature,
      abortSignal: AbortSignal.timeout(28000),
    });

    // Return streaming response for AI SDK UI integration
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
