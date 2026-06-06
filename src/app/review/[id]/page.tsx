'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { QueuePost } from '@/lib/queue'

type PostWithFiles = QueuePost & { slideFiles: string[] }

// Next Tuesday/Wednesday/Thursday at given hour
function nextWeekday(day: number, hour: number): string {
  const d = new Date()
  const diff = ((day - d.getDay() + 7) % 7) || 7
  d.setDate(d.getDate() + diff)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

const SUGGESTED_SLOTS = [
  { label: 'Di 10:00', iso: () => nextWeekday(2, 10) },
  { label: 'Di 11:00', iso: () => nextWeekday(2, 11) },
  { label: 'Mi 10:00', iso: () => nextWeekday(3, 10) },
  { label: 'Do 10:00', iso: () => nextWeekday(4, 10) },
  { label: 'Do 12:00', iso: () => nextWeekday(4, 12) },
]

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [post, setPost] = useState<PostWithFiles | null>(null)
  const [caption, setCaption] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [customDate, setCustomDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    fetch('/api/queue')
      .then(r => r.json())
      .then((posts: PostWithFiles[]) => {
        const p = posts.find(p => p.id === id)
        if (p) {
          setPost(p)
          setCaption(p.caption)
        }
        setLoading(false)
      })
  }, [id])

  if (loading) return <p className="p-8 text-gray-400">Lade…</p>
  if (!post) return (
    <div className="p-8">
      <p className="text-gray-400 mb-4">Post nicht gefunden.</p>
      <Link href="/dashboard" className="text-orange-400 hover:underline">← Dashboard</Link>
    </div>
  )

  const publishAt = selectedSlot || (customDate ? new Date(customDate).toISOString() : '')

  async function handleSchedule() {
    if (!publishAt) {
      alert('Bitte einen Zeitslot wählen.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id, caption, publish_at: publishAt, hashtags: [] }),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      router.push('/dashboard')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fehler beim Speichern')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Post wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return
    await fetch(`/api/delete-post?id=${id}`, { method: 'DELETE' })
    router.push('/dashboard')
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="mb-4">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">← Dashboard</Link>
      </div>

      <h1
        className="text-2xl font-bold text-white mb-1"
        style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}
      >
        {post.game} · {post.topic}
      </h1>
      <p className="text-gray-500 text-sm mb-6">{post.format}</p>

      {/* Slide preview */}
      {post.slideFiles.length > 0 && (
        <section className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-3 mb-3">
            {post.slideFiles.map((src, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                className={`flex-shrink-0 rounded overflow-hidden border-2 transition-colors ${
                  i === slideIndex ? 'border-orange-500' : 'border-transparent'
                }`}
              >
                <img src={src} alt={`Slide ${i + 1}`} className="h-24 w-auto" />
              </button>
            ))}
          </div>
          {/* Larger preview of selected slide */}
          <div className="flex justify-center">
            <img
              src={post.slideFiles[slideIndex]}
              alt={`Slide ${slideIndex + 1} preview`}
              className="max-h-80 rounded shadow-lg"
            />
          </div>
        </section>
      )}

      {/* Caption */}
      <section className="mb-6">
        <label className="block text-sm text-gray-400 mb-1">Caption</label>
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm h-24 resize-y"
        />
        <p className="text-xs text-gray-500 mt-1">{caption.length} Zeichen</p>

        {post.caption_variants.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Varianten</p>
            <div className="flex flex-col gap-2">
              {post.caption_variants.map((v, i) => (
                <button
                  key={i}
                  onClick={() => setCaption(v)}
                  className="text-left text-xs bg-gray-900 border border-gray-700 hover:border-orange-500 rounded px-3 py-2 text-gray-300 transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Time slot */}
      <section className="mb-8">
        <label className="block text-sm text-gray-400 mb-2">Zeitslot</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTED_SLOTS.map(s => {
            const iso = s.iso()
            return (
              <button
                key={s.label}
                onClick={() => { setSelectedSlot(iso); setCustomDate('') }}
                className={`px-3 py-1 rounded text-sm border transition-colors ${
                  selectedSlot === iso
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-gray-700 text-gray-300 hover:border-orange-500'
                }`}
              >
                {s.label}
              </button>
            )
          })}
        </div>
        <input
          type="datetime-local"
          value={customDate}
          onChange={e => { setCustomDate(e.target.value); setSelectedSlot('') }}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
        />
      </section>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSchedule}
          disabled={!publishAt || saving}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded transition-colors"
          style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}
        >
          {saving ? 'Wird gespeichert…' : 'Freigeben & Einplanen'}
        </button>
        <button
          onClick={handleDelete}
          className="text-red-400 hover:text-red-300 text-sm transition-colors"
        >
          Post löschen
        </button>
      </div>
    </main>
  )
}
