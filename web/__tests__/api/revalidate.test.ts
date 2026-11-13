import { revalidatePath } from 'next/cache'
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { GET } from '@/app/api/revalidate/route'

function createRevalidateRequest(query = '', token = 'test-revalidate-token') {
  return new NextRequest(`https://www.charlottethirdplaces.com/api/revalidate${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
}

describe('GET /api/revalidate', () => {
  beforeEach(() => {
    vi.stubEnv('REVALIDATE_TOKEN', 'test-revalidate-token')
    vi.mocked(revalidatePath).mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('rejects requests without a valid bearer token', async () => {
    const response = await GET(createRevalidateRequest('', 'wrong-token'))

    expect(response.status).toBe(401)
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('revalidates only the record and aggregate paths when recordId is provided', async () => {
    const recordId = 'recaL7X6xJLneVt4d'
    const response = await GET(createRevalidateRequest(`?recordId=${recordId}`))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      scope: 'record',
      recordId,
      revalidatedPaths: [
        '/',
        '/map',
        '/api/places',
        '/sitemap.xml',
        `/places/${recordId}`,
        `/api/places/${recordId}`,
      ],
    })
    expect(vi.mocked(revalidatePath).mock.calls).toEqual([
      ['/'],
      ['/map'],
      ['/api/places'],
      ['/sitemap.xml'],
      [`/places/${recordId}`],
      [`/api/places/${recordId}`],
    ])
  })

  it.each(['', 'invalid', '../secret', 'rec123'])('rejects invalid recordId %j with 400', async (badId) => {
    const response = await GET(createRevalidateRequest(`?recordId=${encodeURIComponent(badId)}`))

    expect(response.status).toBe(400)
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('revalidates the full site when recordId is omitted', async () => {
    const response = await GET(createRevalidateRequest())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      success: true,
      scope: 'site',
    })
    expect(vi.mocked(revalidatePath).mock.calls).toEqual([['/', 'layout']])
  })
})
