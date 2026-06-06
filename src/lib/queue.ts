import fs from 'fs/promises'
import path from 'path'
import { Mutex } from 'async-mutex'

export interface QueuePost {
  id: string
  game: string
  topic: string
  format: string
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  draft_dir: string
  caption: string
  caption_variants: string[]
  hashtags: string[]
  publish_at: string | null
  created_at: string
  error?: string
  instagram_media_id?: string
}

const queueFile = () =>
  process.env.QUEUE_FILE_OVERRIDE ??
  path.join(process.cwd(), 'data', 'queue.json')

const publishedFile = () =>
  process.env.PUBLISHED_FILE_OVERRIDE ??
  path.join(process.cwd(), 'data', 'published.json')

const mutex = new Mutex()

export async function readQueue(): Promise<QueuePost[]> {
  try {
    return JSON.parse(await fs.readFile(queueFile(), 'utf-8'))
  } catch {
    return []
  }
}

async function writeQueue(posts: QueuePost[]): Promise<void> {
  await mutex.runExclusive(() =>
    fs.writeFile(queueFile(), JSON.stringify(posts, null, 2))
  )
}

export async function addPost(post: QueuePost): Promise<void> {
  const posts = await readQueue()
  posts.push(post)
  await writeQueue(posts)
}

export async function updatePost(id: string, updates: Partial<QueuePost>): Promise<void> {
  const posts = await readQueue()
  const idx = posts.findIndex(p => p.id === id)
  if (idx === -1) throw new Error(`Post not found: ${id}`)
  posts[idx] = { ...posts[idx], ...updates }
  await writeQueue(posts)
}

export async function deletePost(id: string): Promise<void> {
  const posts = await readQueue()
  await writeQueue(posts.filter(p => p.id !== id))
}

export async function getDuePosts(): Promise<QueuePost[]> {
  const posts = await readQueue()
  const now = new Date()
  return posts.filter(
    p => p.status === 'scheduled' && p.publish_at && new Date(p.publish_at) <= now
  )
}

export async function appendPublished(post: QueuePost): Promise<void> {
  let published: QueuePost[] = []
  try {
    published = JSON.parse(await fs.readFile(publishedFile(), 'utf-8'))
  } catch {}
  published.push(post)
  await fs.writeFile(publishedFile(), JSON.stringify(published, null, 2))
}
