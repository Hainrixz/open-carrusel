import { describe, it, expect, vi } from 'vitest'

global.fetch = vi.fn()

import { publishCarousel, checkTokenExpiry } from './instagram'

function mockFetch(responses: object[]) {
  let call = 0
  ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
    const r = responses[call++]
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(r),
    })
  })
}

describe('publishCarousel', () => {
  it('calls Graph API in correct order and returns media id', async () => {
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = 'acc123'
    process.env.INSTAGRAM_ACCESS_TOKEN = 'tok456'

    // 2 image containers + 1 carousel container + 1 publish = 4 calls
    mockFetch([
      { id: 'img1' },
      { id: 'img2' },
      { id: 'carousel1' },
      { id: 'published1' },
    ])

    const mediaId = await publishCarousel({
      imageUrls: [
        'https://example.de/tmp/post/slide-01.jpg',
        'https://example.de/tmp/post/slide-02.jpg',
      ],
      caption: 'Test caption #gaming',
    })

    expect(mediaId).toBe('published1')
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(4)
  })

  it('throws on API error response', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Invalid token' } }),
    })

    await expect(
      publishCarousel({ imageUrls: ['https://x.de/a.jpg'], caption: 'x' })
    ).rejects.toThrow()
  })
})

describe('checkTokenExpiry', () => {
  it('returns daysLeft and expiresAt', async () => {
    const futureTs = Math.floor(Date.now() / 1000) + 86400 * 30 // 30 days from now
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { expires_at: futureTs } }),
    })

    const result = await checkTokenExpiry()
    expect(result.daysLeft).toBeGreaterThan(20)
    expect(result.expiresAt).toBeInstanceOf(Date)
  })
})
