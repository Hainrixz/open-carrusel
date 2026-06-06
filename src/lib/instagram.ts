const BASE = 'https://graph.facebook.com/v25.0'

function accountId() { return process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID! }
function token() { return process.env.INSTAGRAM_ACCESS_TOKEN! }

async function graphPost(endpoint: string, params: Record<string, string>): Promise<{ id: string }> {
  const url = new URL(`${BASE}/${endpoint}`)
  url.searchParams.set('access_token', token())
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url.toString(), { method: 'POST' })
  const data = await res.json() as { id?: string; error?: unknown }
  if (!res.ok || !data.id) throw new Error(`Graph API error: ${JSON.stringify(data)}`)
  return data as { id: string }
}

export async function publishCarousel({
  imageUrls,
  caption,
}: {
  imageUrls: string[]
  caption: string
}): Promise<string> {
  // Step 1: Create one container per image
  const containerIds: string[] = []
  for (const url of imageUrls) {
    const { id } = await graphPost(`${accountId()}/media`, {
      image_url: url,
      is_carousel_item: 'true',
    })
    containerIds.push(id)
  }

  // Step 2: Create carousel container
  const { id: carouselId } = await graphPost(`${accountId()}/media`, {
    media_type: 'CAROUSEL',
    children: containerIds.join(','),
    caption,
  })

  // Step 3: Publish
  const { id: mediaId } = await graphPost(`${accountId()}/media_publish`, {
    creation_id: carouselId,
  })

  return mediaId
}

export async function checkTokenExpiry(): Promise<{ daysLeft: number; expiresAt: Date }> {
  const url = new URL(`${BASE}/debug_token`)
  url.searchParams.set('input_token', token())
  url.searchParams.set('access_token', token())

  const res = await fetch(url.toString())
  const body = await res.json() as { data?: { expires_at: number }; error?: unknown }
  if (!res.ok || !body.data) throw new Error(`Token check failed: ${JSON.stringify(body)}`)
  const { data } = body

  const expiresAt = new Date(data.expires_at * 1000)
  const daysLeft = Math.floor((expiresAt.getTime() - Date.now()) / 86_400_000)

  return { daysLeft, expiresAt }
}
