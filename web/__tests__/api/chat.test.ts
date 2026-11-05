import { AI_CONFIG } from '@/lib/ai/config'
import { performRAG } from '@/lib/ai/rag'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/ai/rag', () => ({
  performRAG: vi.fn(),
}))

describe('chat API compatibility', () => {
  beforeEach(() => {
    vi.stubEnv('FOUNDRY_API_KEY', 'test-key')
    vi.mocked(performRAG).mockResolvedValue({
      context: 'Test place context.',
      placesCount: 1,
      chunksCount: 0,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('keeps Azure chat completions and returns a UI message stream', async () => {
    const chunk = {
      id: 'chatcmpl-test',
      object: 'chat.completion.chunk',
      created: 0,
      model: AI_CONFIG.chatModel,
      choices: [
        {
          index: 0,
          delta: { role: 'assistant', content: 'Test answer.' },
          finish_reason: null,
        },
      ],
    }
    const finish = {
      ...chunk,
      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 3, total_tokens: 13 },
    }
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        `data: ${JSON.stringify(chunk)}\n\ndata: ${JSON.stringify(finish)}\n\ndata: [DONE]\n\n`,
        { headers: { 'Content-Type': 'text/event-stream' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { POST } = await import('@/app/api/chat/route')

    const response = await POST(
      new Request('https://example.test/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            {
              id: 'user-1',
              role: 'user',
              parts: [{ type: 'text', text: 'Where can I read?' }],
            },
          ],
          placeId: 'test-place',
        }),
      }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('x-vercel-ai-ui-message-stream')).toBe('v1')
    const stream = await response.text()
    expect(stream).toContain('"type":"text-delta"')
    expect(stream).toContain('"delta":"Test answer."')
    expect(stream).not.toContain('"type":"error"')
    expect(performRAG).toHaveBeenCalledWith({
      query: 'Where can I read?',
      placeId: 'test-place',
    })
    expect(fetchMock).toHaveBeenCalledOnce()

    const [url, options] = fetchMock.mock.calls[0]
    const target = new URL(String(url))
    expect(target.origin).toBe(new URL(AI_CONFIG.endpoint).origin)
    expect(target.pathname).toBe(
      `/openai/deployments/${AI_CONFIG.chatModel}/chat/completions`,
    )
    expect(target.searchParams.get('api-version')).toBe(AI_CONFIG.apiVersion)
    expect(JSON.parse(String(options?.body))).toMatchObject({
      stream: true,
      temperature: AI_CONFIG.temperature,
      messages: [
        { role: 'system', content: expect.any(String) },
        { role: 'system', content: expect.stringContaining('Test place context.') },
        { role: 'user', content: 'Where can I read?' },
      ],
    })
  })

  it('rejects invalid messages before it calls Azure or RAG', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    const { POST } = await import('@/app/api/chat/route')
    const response = await POST(
      new Request('https://example.test/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [] }),
      }),
    )

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(performRAG).not.toHaveBeenCalled()
  })
})
