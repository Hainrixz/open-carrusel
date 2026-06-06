import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { hookPrompt } from '@/lib/templates/hook-prompt'
import { contentPrompt } from '@/lib/templates/content-prompt'
import { ctaPrompt } from '@/lib/templates/cta-prompt'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface SlideOutline {
  type: 'hook' | 'content' | 'cta'
  headline?: string
  subtitle?: string
  text?: string
  detail?: string
  question?: string
}

async function generateSlideHtml(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  if (!message.content.length || message.content[0].type !== 'text') {
    throw new Error('Claude returned no text response for slide')
  }

  const raw = message.content[0].text
  // Strip markdown code fences if Claude wraps HTML
  return raw.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim()
}

export async function POST(req: NextRequest) {
  let body: {
    postId: string
    game: string
    format: string
    streamingDays?: string
    slides: SlideOutline[]
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { postId, game, format, streamingDays = 'Mo, Mi, Sa & So', slides } = body

  if (!postId || !game || !format || !Array.isArray(slides) || slides.length === 0) {
    return NextResponse.json(
      { error: 'postId, game, format, and slides are required' },
      { status: 400 }
    )
  }

  const origin = req.nextUrl.origin

  // Create a new carousel in open-carrusel
  // POST /api/carousels returns the carousel object directly (no nesting)
  const carouselRes = await fetch(`${origin}/api/carousels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `${game} — ${postId}`, aspectRatio: '4:5' }),
  })

  if (!carouselRes.ok) {
    const text = await carouselRes.text()
    return NextResponse.json({ error: `Failed to create carousel: ${text}` }, { status: 500 })
  }

  const carousel = (await carouselRes.json()) as { id: string }
  const carouselId = carousel.id

  const total = slides.length
  const results: { slideNumber: number; slideId: string }[] = []

  // Generate HTML for each slide and write to carousel
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]
    const slideNum = i + 1

    let prompt: string
    if (slide.type === 'hook') {
      prompt = hookPrompt(game, slide.headline ?? '', slide.subtitle ?? '', total)
    } else if (slide.type === 'cta') {
      prompt = ctaPrompt(streamingDays, slide.question ?? '')
    } else {
      prompt = contentPrompt(game, format, slideNum, total, slide.text ?? '', slide.detail ?? '')
    }

    let html: string
    try {
      html = await generateSlideHtml(prompt)
    } catch (err) {
      return NextResponse.json(
        {
          error: `Slide ${slideNum} HTML generation failed: ${err instanceof Error ? err.message : String(err)}`,
        },
        { status: 502 }
      )
    }

    // Write slide to carousel
    // POST /api/carousels/[id]/slides returns the slide object directly (no nesting)
    const slideRes = await fetch(`${origin}/api/carousels/${carouselId}/slides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, notes: `Slide ${slideNum}: ${slide.type}` }),
    })

    if (!slideRes.ok) {
      const text = await slideRes.text()
      return NextResponse.json(
        { error: `Failed to write slide ${slideNum}: ${text}` },
        { status: 500 }
      )
    }

    const savedSlide = (await slideRes.json()) as { id: string }
    results.push({ slideNumber: slideNum, slideId: savedSlide.id })
  }

  return NextResponse.json({
    success: true,
    carouselId,
    slides: results,
  })
}
