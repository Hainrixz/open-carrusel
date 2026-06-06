// src/app/api/generate-outline/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildBrandVoiceConstraint, checkBrandVoice } from '@/lib/brand-voice'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FORMATS = ['tipps', 'fehler-beichte', 'quick-review', 'mechanik-erklaerung', 'schoenbau-unfall'] as const
type Format = typeof FORMATS[number]

const FORMAT_LABELS: Record<Format, string> = {
  tipps: 'Tipps & Tricks',
  'fehler-beichte': 'Fehler-Beichte',
  'quick-review': 'Quick-Review',
  'mechanik-erklaerung': 'Mechanik-Erklärung',
  'schoenbau-unfall': 'Schönbau-Unfall',
}

export async function POST(req: NextRequest) {
  let body: { game?: string; topic?: string; format?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { game, topic, format } = body

  if (!game || !topic || !format || !FORMATS.includes(format as Format)) {
    return NextResponse.json(
      { error: 'game, topic und format sind Pflichtfelder. Erlaubte formats: ' + FORMATS.join(', ') },
      { status: 400 }
    )
  }

  const typedFormat = format as Format
  const formatLabel = FORMAT_LABELS[typedFormat]
  const brandVoice = buildBrandVoiceConstraint()

  const prompt = `Du erstellst Instagram-Carousel-Inhalte für den Gaming-Creator Tiduin (DACH, 18+, Aufbaustrategie/Survival-Nische).

Spiel: ${game}
Thema: ${topic}
Format: ${formatLabel}

${brandVoice}

Erstelle eine 8-Slide Carousel-Outline auf DEUTSCH mit diesen exakten Regeln:
- Slide 1 (Hook): Fesselnde Überschrift (max. 10 Wörter) + optionaler Subtitel (max. 12 Wörter)
- Slides 2–7 (Content): Je max. 14 Wörter Haupttext + 1 optionaler Detail-Satz (max. 20 Wörter). Konkret, direkt, kein Fülltext.
- Slide 8 (CTA): Eine spezifische Kommentar-Frage die Zuschauer zum Antworten bringt (KEIN "Was denkst du?")

Erstelle außerdem:
- 1 Caption (150–300 Zeichen, mit Emoji, endet mit der Kommentar-Frage)
- 3 Caption-Varianten (unterschiedlicher Ton: direkt / humorvoll / neugierig)

Antworte NUR mit diesem JSON-Format, ohne Erklärung:
{
  "slides": [
    { "type": "hook", "headline": "...", "subtitle": "..." },
    { "type": "content", "text": "...", "detail": "..." },
    { "type": "content", "text": "...", "detail": "..." },
    { "type": "content", "text": "...", "detail": "..." },
    { "type": "content", "text": "...", "detail": "..." },
    { "type": "content", "text": "...", "detail": "..." },
    { "type": "content", "text": "...", "detail": "..." },
    { "type": "cta", "question": "..." }
  ],
  "caption": "...",
  "caption_variants": ["...", "...", "..."]
}`

  let message: Awaited<ReturnType<typeof client.messages.create>>
  try {
    message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Anthropic API error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  if (!message.content.length || message.content[0].type !== 'text') {
    return NextResponse.json({ error: 'Claude hat keine Textantwort zurückgegeben' }, { status: 502 })
  }
  const raw = message.content[0].text

  let parsed: { slides: unknown[]; caption: string; caption_variants: string[] }
  try {
    const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    parsed = JSON.parse(json)
  } catch {
    return NextResponse.json({ error: 'Claude hat kein gültiges JSON geliefert', raw }, { status: 500 })
  }

  // Validate structure
  if (
    !Array.isArray(parsed.slides) ||
    parsed.slides.length !== 8 ||
    typeof parsed.caption !== 'string' ||
    !Array.isArray(parsed.caption_variants) ||
    parsed.caption_variants.length !== 3
  ) {
    return NextResponse.json(
      { error: 'Claude hat eine ungültige Outline-Struktur zurückgegeben', raw },
      { status: 500 }
    )
  }

  const { violations } = checkBrandVoice(JSON.stringify(parsed))
  if (violations.length > 0) {
    console.warn('[generate-outline] Brand voice violations:', violations)
  }

  return NextResponse.json({ ...parsed, violations })
}
