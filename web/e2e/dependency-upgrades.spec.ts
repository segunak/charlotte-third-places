import { expect, test } from '@playwright/test'

test('chat reads the UI message stream and retains conversation history', async ({ page }) => {
  await page.route('**/api/chat', async (route) => {
    const parts = [
      { type: 'start', messageId: 'assistant-test' },
      { type: 'text-start', id: 'text-test' },
      { type: 'text-delta', id: 'text-test', delta: 'Test recommendation.' },
      { type: 'text-end', id: 'text-test' },
      { type: 'finish' },
    ]
    await route.fulfill({
      contentType: 'text/event-stream',
      headers: { 'x-vercel-ai-ui-message-stream': 'v1' },
      body: `${parts.map((part) => `data: ${JSON.stringify(part)}\n\n`).join('')}data: [DONE]\n\n`,
    })
  })

  await page.goto('/chat')
  const input = page.getByPlaceholder('What kind of place are you looking for?')
  await input.fill('Where can I read?')
  const firstRequest = page.waitForRequest('**/api/chat')
  await page.getByRole('button', { name: 'Submit', exact: true }).click()
  await firstRequest
  await expect(page.getByText('Test recommendation.', { exact: true })).toBeVisible()

  await input.fill('Which place is quiet?')
  const nextRequest = page.waitForRequest('**/api/chat')
  await page.getByRole('button', { name: 'Submit', exact: true }).click()
  const body = (await nextRequest).postDataJSON()
  expect(body.messages).toEqual([
    expect.objectContaining({ role: 'user' }),
    expect.objectContaining({ role: 'assistant' }),
    expect.objectContaining({ role: 'user' }),
  ])
})

test('the preview serves the generated PWA worker', async ({ request }) => {
  const response = await request.get('/serwist/sw.js')
  expect(response.ok()).toBe(true)
  expect(response.headers()['service-worker-allowed']).toBe('/')
  expect(response.headers()['content-type']).toContain('javascript')
  expect(await response.text()).toContain('/~offline')
})
