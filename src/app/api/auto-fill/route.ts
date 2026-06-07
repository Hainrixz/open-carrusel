import { NextRequest, NextResponse } from 'next/server'
import { runClaude } from '@/lib/claude-cli'
import { hookPrompt } from '@/lib/templates/hook-prompt'
import { contentPrompt } from '@/lib/templates/content-prompt'
import { ctaPrompt } from '@/lib/templates/cta-prompt'

interface SlideOutline {
  type: 'hook' | 'content' | 'cta'
  headline?: string
  subtitle?: string
  text?: string
  detail?: string
  question?: string
}

async function generateSlideHtml(prompt: string): Promise<string> {
  const raw = await runClaude(prompt, 120_000)
  return raw.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '').trim()
}

export async function POST(req: NextRequest) {
  let body: {
    postId: string
    game: string
    format: string
    streamingDays?: string
    slides: SlideOutline[]
    screenshotUrl?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { postId, game, format, streamingDays = 'Mo, Mi, Sa & So', slides, screenshotUrl } = body

  if (!postId || !game || !format || !Array.isArray(slides) || slides.length === 0) {
    return NextResponse.json(
      { error: 'postId, game, format, and slides are required' },
      { status: 400 }
    )
  }

  const origin = req.nextUrl.origin

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

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]
    const slideNum = i + 1

    let prompt: string
    if (slide.type === 'hook') {
      prompt = hookPrompt(game, slide.headline ?? '', slide.subtitle ?? '', total, screenshotUrl)
    } else if (slide.type === 'cta') {
      prompt = ctaPrompt(streamingDays, slide.question ?? '')
    } else {
      prompt = contentPrompt(game, format, slideNum, total, slide.text ?? '', slide.detail ?? '', screenshotUrl)
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
