/**
 * Embedding service for generating vector embeddings using Azure OpenAI.
 * Uses text-embedding-3-small model for 1536-dimensional embeddings.
 *
 * Azure OpenAI REST API Reference:
 * @see https://learn.microsoft.com/en-us/azure/ai-foundry/openai/reference?view=foundry-classic
 *
 * URL Format (deployment-based):
 * POST https://{endpoint}/openai/deployments/{deployment-id}/embeddings?api-version={version}
 * Example: https://foundry-third-places.cognitiveservices.azure.com/openai/deployments/text-embedding-3-small/embeddings?api-version=2024-05-01-preview
 */

import { AI_CONFIG } from "./config";

/**
 * Generate an embedding vector for a single text string.
 * Uses Azure OpenAI's text-embedding-3-small model via Foundry.
 * 
 * @param text - The text to embed
 * @returns 1536-dimensional embedding vector
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.FOUNDRY_API_KEY;
  if (!apiKey) {
    throw new Error("FOUNDRY_API_KEY environment variable is required");
  }

  if (!text || !text.trim()) {
    throw new Error("Text cannot be empty");
  }

  // Azure OpenAI embeddings endpoint
  // Format: {endpoint}/openai/deployments/{deployment}/embeddings?api-version={version}
  const url = `${AI_CONFIG.endpoint}openai/deployments/${AI_CONFIG.embeddingModel}/embeddings?api-version=${AI_CONFIG.apiVersion}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      input: text.trim(),
      dimensions: AI_CONFIG.embeddingDimensions,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embedding API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.data?.[0]?.embedding) {
    throw new Error("Invalid embedding response format");
  }

  return data.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in a single batch.
 * 
 * @param texts - Array of texts to embed (max 16)
 * @returns Array of 1536-dimensional embedding vectors
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.FOUNDRY_API_KEY;
  if (!apiKey) {
    throw new Error("FOUNDRY_API_KEY environment variable is required");
  }

  if (!texts || texts.length === 0) {
    throw new Error("Texts array cannot be empty");
  }

  if (texts.length > 16) {
    throw new Error("Maximum batch size is 16 texts");
  }

  // Filter out empty strings
  const validTexts = texts.filter(t => t && t.trim());
  if (validTexts.length === 0) {
    throw new Error("All texts are empty after filtering");
  }

  const url = `${AI_CONFIG.endpoint}openai/deployments/${AI_CONFIG.embeddingModel}/embeddings?api-version=${AI_CONFIG.apiVersion}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      input: validTexts.map(t => t.trim()),
      dimensions: AI_CONFIG.embeddingDimensions,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embedding API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.data || !Array.isArray(data.data)) {
    throw new Error("Invalid embedding response format");
  }

  return data.data.map((item: { embedding: number[] }) => item.embedding);
}
