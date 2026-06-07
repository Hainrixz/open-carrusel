import { NextRequest, NextResponse } from 'next/server'
import { addPost } from '@/lib/queue'
import type { QueuePost } from '@/lib/queue'

const VALID_FORMATS = ['tipps', 'fehler-beichte', 'quick-review', 'mechanik-erklaerung', 'schoenbau-unfall'] as const

interface NewsInput {
  game: string
  headline: string
  summary: string
  format?: string
  source_url?: string
  tags?: string[]
}

export async function POST(req: NextRequest) {
  let body: NewsInput
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { game, headline, summary, format = 'tipps', source_url } = body

  if (!game || !headline || !summary) {
    return NextResponse.json(
      { error: 'game, headline und summary sind Pflichtfelder' },
      { status: 400 }
    )
  }

  if (!VALID_FORMATS.includes(format as typeof VALID_FORMATS[number])) {
    return NextResponse.json(
      { error: `format muss eines von: ${VALID_FORMATS.join(', ')} sein` },
      { status: 400 }
    )
  }

  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30).replace(/-$/, '')
  const postId = `${new Date().toISOString().slice(0, 10)}-${slug(game)}-${slug(headline)}-news`
  const topic = headline + (source_url ? ` (Quelle: ${source_url})` : '')

  // Fire-and-forget pipeline — caller gets postId immediately
  triggerFullPipeline({ postId, game, topic, summary, format }).catch(err => {
    console.error(`[intake-news] Pipeline failed for ${postId}:`, err)
  })

  return NextResponse.json({ postId, status: 'processing' }, { status: 202 })
}

async function triggerFullPipeline({
  postId, game, topic, summary, format,
}: {
  postId: string; game: string; topic: string; summary: string; format: string
}) {
  const base = `http://localhost:${process.env.PORT ?? 3000}`

  // Step 1: Generate outline
  const outlineRes = await fetch(`${base}/api/generate-outline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ game, topic, format, transcript: summary }),
  })
  if (!outlineRes.ok) throw new Error(`Outline failed: ${outlineRes.status}`)
  const outline = await outlineRes.json() as {
    slides: unknown[]; caption: string; caption_variants: string[]
  }

  // Step 2: Auto-fill slides
  const fillRes = await fetch(`${base}/api/auto-fill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId, game, format, slides: outline.slides }),
  })
  if (!fillRes.ok) throw new Error(`Auto-fill failed: ${fillRes.status}`)
  const { carouselId } = await fillRes.json() as { carouselId: string }

  // Step 3: Export JPEG
  const exportRes = await fetch(`${base}/api/export-jpeg`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      carouselId,
      postId,
      caption: outline.caption,
      caption_variants: outline.caption_variants,
    }),
  })
  if (!exportRes.ok) throw new Error(`Export failed: ${exportRes.status}`)

  // Step 4: Write draft to queue
  const post: QueuePost = {
    id: postId,
    game,
    topic,
    format,
    status: 'draft',
    draft_dir: `data/drafts/${postId}/`,
    caption: outline.caption,
    caption_variants: outline.caption_variants,
    hashtags: [],
    publish_at: null,
    created_at: new Date().toISOString(),
  }
  await addPost(post)
  console.log(`[intake-news] Draft created: ${postId}`)
}
