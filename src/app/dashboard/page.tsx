'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { QueuePost } from '@/lib/queue'

type PostWithFiles = QueuePost & { slideFiles: string[] }

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  scheduled: 'Geplant',
  published: '✓ Live',
  failed: 'Fehler',
}

const STATUS_CLASS: Record<string, string> = {
  draft: 'bg-gray-700 text-gray-300',
  scheduled: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  published: 'bg-green-500/20 text-green-400 border border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

export default function DashboardPage() {
  const [posts, setPosts] = useState<PostWithFiles[]>([])
  const [tokenWarning, setTokenWarning] = useState<{ daysLeft: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/queue').then(r => r.json() as Promise<PostWithFiles[]>),
      fetch('/api/token-status').then(r => r.json()).catch(() => null),
    ]).then(([queuePosts, tokenData]) => {
      setPosts(queuePosts)
      if (tokenData && typeof tokenData.daysLeft === 'number' && tokenData.daysLeft < 14) {
        setTokenWarning({ daysLeft: tokenData.daysLeft })
      }
      setLoading(false)
    })
  }, [])

  const scheduled = posts.filter(p => p.status === 'scheduled')
  const drafts = posts.filter(p => p.status === 'draft')
  const history = posts.filter(p => p.status === 'published' || p.status === 'failed')

  if (loading) return <p className="p-8 text-gray-400">Lade…</p>

  return (
    <main className="max-w-2xl mx-auto p-8">
      {tokenWarning && (
        <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-3 text-orange-400 text-sm">
          ⚠ Instagram Access Token läuft in{' '}
          <strong>{tokenWarning.daysLeft} Tagen</strong> ab. Erneuere ihn im{' '}
          <a
            href="https://developers.facebook.com/tools/explorer/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Meta Developer Dashboard
          </a>{' '}
          und trage den neuen Token in <code className="text-xs">.env.local</code> ein.
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}
        >
          Carousel Queue
        </h1>
        <Link
          href="/new-post"
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2 px-4 rounded transition-colors"
          style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}
        >
          + Neuer Post
        </Link>
      </div>

      {scheduled.length > 0 && (
        <Section title="Geplant" posts={scheduled} />
      )}
      {drafts.length > 0 && (
        <Section title="Drafts" posts={drafts} />
      )}
      {history.length > 0 && (
        <Section title="Verlauf" posts={history} />
      )}

      {posts.length === 0 && (
        <p className="text-gray-500 text-center py-16">
          Noch keine Posts.{' '}
          <Link href="/new-post" className="text-orange-400 hover:underline">
            Ersten Post erstellen →
          </Link>
        </p>
      )}
    </main>
  )
}

function Section({ title, posts }: { title: string; posts: PostWithFiles[] }) {
  return (
    <section className="mb-6">
      <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">{title}</h2>
      <div className="flex flex-col gap-2">
        {posts.map(post => <PostRow key={post.id} post={post} />)}
      </div>
    </section>
  )
}

function PostRow({ post }: { post: PostWithFiles }) {
  const isClickable = post.status === 'draft' || post.status === 'scheduled'
  const publishDate = post.publish_at
    ? new Date(post.publish_at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })
    : null
  const createdDate = new Date(post.created_at).toLocaleDateString('de-DE')

  const inner = (
    <div className="flex items-center gap-3 bg-gray-800/60 rounded-lg px-4 py-3 hover:bg-gray-800 transition-colors">
      {post.slideFiles[0] ? (
        <img
          src={post.slideFiles[0]}
          alt=""
          className="w-8 h-10 rounded object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-8 h-10 rounded bg-gray-700 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {post.game} · {post.topic}
        </p>
        <p className="text-xs text-gray-500">
          {publishDate ?? createdDate}
        </p>
        {post.status === 'failed' && post.error && (
          <p className="text-xs text-red-400 truncate mt-0.5" title={post.error}>
            {post.error}
          </p>
        )}
      </div>
      <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${STATUS_CLASS[post.status] ?? ''}`}>
        {STATUS_LABEL[post.status] ?? post.status}
      </span>
    </div>
  )

  return isClickable
    ? <Link href={`/review/${post.id}`}>{inner}</Link>
    : <div>{inner}</div>
}
