import { NextRequest, NextResponse } from 'next/server'
import { addPost, updatePost, readQueue } from '@/lib/queue'
import type { QueuePost } from '@/lib/queue'

export async function POST(req: NextRequest) {
  let body: {
    postId: string
    game?: string
    topic?: string
    format?: string
    caption?: string
    caption_variants?: string[]
    hashtags?: string[]
    publish_at?: string
    status?: QueuePost['status']
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }

  const posts = await readQueue()
  const existing = posts.find(p => p.id === body.postId)

  if (existing) {
    // Update: schedule an existing draft
    await updatePost(body.postId, {
      status: body.publish_at ? 'scheduled' : existing.status,
      publish_at: body.publish_at ?? existing.publish_at,
      caption: body.caption ?? existing.caption,
      hashtags: body.hashtags ?? existing.hashtags,
    })
  } else {
    // Create: save new draft
    if (!body.game || !body.topic || !body.format) {
      return NextResponse.json({ error: 'game, topic, format required for new post' }, { status: 400 })
    }
    const post: QueuePost = {
      id: body.postId,
      game: body.game,
      topic: body.topic,
      format: body.format,
      status: 'draft',
      draft_dir: `data/drafts/${body.postId}/`,
      caption: body.caption ?? '',
      caption_variants: body.caption_variants ?? [],
      hashtags: body.hashtags ?? [],
      publish_at: null,
      created_at: new Date().toISOString(),
    }
    await addPost(post)
  }

  return NextResponse.json({ success: true })
}
