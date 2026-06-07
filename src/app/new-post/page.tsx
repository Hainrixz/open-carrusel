'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const GAMES = ['Timberborn', 'Satisfactory', 'RimWorld', 'Enshrouded', 'Modulus', 'Shapez 2']
const FORMATS = [
  { value: 'tipps', label: 'Tipps & Tricks' },
  { value: 'fehler-beichte', label: 'Fehler-Beichte' },
  { value: 'quick-review', label: 'Quick-Review' },
  { value: 'mechanik-erklaerung', label: 'Mechanik-Erklärung' },
  { value: 'schoenbau-unfall', label: 'Schönbau-Unfall' },
]

type Status = 'idle' | 'generating' | 'filling' | 'exporting' | 'saving' | 'error'

const STATUS_MSG: Record<Status, string> = {
  idle: '',
  generating: 'Outline wird generiert…',
  filling: 'Slides werden erstellt (dauert ~60s)…',
  exporting: 'JPEG-Export läuft…',
  saving: 'Draft wird gespeichert…',
  error: '',
}

export default function NewPostPage() {
  const router = useRouter()
  const [game, setGame] = useState('')
  const [customGame, setCustomGame] = useState('')
  const [topic, setTopic] = useState('')
  const [format, setFormat] = useState('tipps')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const effectiveGame = game === '__custom__' ? customGame : game
  const isWorking = status !== 'idle' && status !== 'error'

  function makePostId(g: string, t: string) {
    const date = new Date().toISOString().slice(0, 10)
    const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30).replace(/-$/, '')
    return `${date}-${slug(g)}-${slug(t)}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!effectiveGame || !topic) return
    setError('')

    const postId = makePostId(effectiveGame, topic)

    try {
      // Step 1: Generate outline
      setStatus('generating')
      const outlineRes = await fetch('/api/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game: effectiveGame, topic, format }),
      })
      if (!outlineRes.ok) {
        const { error: e } = await outlineRes.json()
        throw new Error(e ?? 'Outline-Generierung fehlgeschlagen')
      }
      const outline = await outlineRes.json()

      // Step 2: Auto-fill slides
      setStatus('filling')
      const fillRes = await fetch('/api/auto-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          game: effectiveGame,
          format,
          slides: outline.slides,
        }),
      })
      if (!fillRes.ok) {
        const { error: e } = await fillRes.json()
        throw new Error(e ?? 'Slide-Erstellung fehlgeschlagen')
      }
      const fillResult = await fillRes.json()

      // Step 3: Export to JPEG
      setStatus('exporting')
      const exportRes = await fetch('/api/export-jpeg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carouselId: fillResult.carouselId,
          postId,
          caption: outline.caption,
          caption_variants: outline.caption_variants,
        }),
      })
      if (!exportRes.ok) {
        const { error: e } = await exportRes.json()
        throw new Error(e ?? 'JPEG-Export fehlgeschlagen')
      }

      // Step 4: Save draft
      setStatus('saving')
      const saveRes = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          game: effectiveGame,
          topic,
          format,
          caption: outline.caption,
          caption_variants: outline.caption_variants,
          hashtags: [],
        }),
      })
      if (!saveRes.ok) throw new Error('Speichern fehlgeschlagen')

      router.push(`/review/${postId}`)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    }
  }

  return (
    <main className="min-h-screen bg-gray-900">
      <div className="max-w-lg mx-auto p-8">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">← Dashboard</Link>
      </div>

      <h1
        className="text-2xl font-bold mb-6 text-white"
        style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}
      >
        Neuer Carousel-Post
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Spiel</label>
          <select
            value={game}
            onChange={e => setGame(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            required
          >
            <option value="">Spiel wählen…</option>
            {GAMES.map(g => <option key={g} value={g}>{g}</option>)}
            <option value="__custom__">Anderes Spiel…</option>
          </select>
          {game === '__custom__' && (
            <input
              type="text"
              placeholder="Spielname eingeben"
              value={customGame}
              onChange={e => setCustomGame(e.target.value)}
              className="w-full mt-2 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              required
            />
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Thema</label>
          <input
            type="text"
            placeholder="z.B. Wasserfluss-Tipps für Anfänger"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Format</label>
          <select
            value={format}
            onChange={e => setFormat(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
          >
            {FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        {isWorking && (
          <p className="text-orange-400 text-sm">⏳ {STATUS_MSG[status]}</p>
        )}

        {status === 'error' && (
          <p className="text-red-400 text-sm">Fehler: {error}</p>
        )}

        <button
          type="submit"
          disabled={isWorking}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
          style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}
        >
          {isWorking ? 'Wird erstellt…' : 'Post erstellen'}
        </button>
      </form>
      </div>
    </main>
  )
}
