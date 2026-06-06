import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'

// Override queue file paths for tests (env vars read by queue.ts)
process.env.QUEUE_FILE_OVERRIDE = path.join(import.meta.dirname, '__test_queue__.json')
process.env.PUBLISHED_FILE_OVERRIDE = path.join(import.meta.dirname, '__test_published__.json')

import { addPost, readQueue, updatePost, deletePost, getDuePosts, appendPublished } from './queue'
import type { QueuePost } from './queue'

const TEST_POST: QueuePost = {
  id: 'test-2026-01-01-rimworld-tips',
  game: 'RimWorld',
  topic: 'Colony Tips',
  format: 'tipps',
  status: 'draft',
  draft_dir: 'data/drafts/test-post/',
  caption: 'Test caption',
  caption_variants: ['v1', 'v2', 'v3'],
  hashtags: ['#rimworld'],
  publish_at: null,
  created_at: new Date().toISOString(),
}

beforeEach(async () => {
  await fs.writeFile(process.env.QUEUE_FILE_OVERRIDE!, '[]')
  await fs.writeFile(process.env.PUBLISHED_FILE_OVERRIDE!, '[]')
})

afterEach(async () => {
  await fs.unlink(process.env.QUEUE_FILE_OVERRIDE!).catch(() => {})
  await fs.unlink(process.env.PUBLISHED_FILE_OVERRIDE!).catch(() => {})
})

describe('queue', () => {
  it('starts empty', async () => {
    expect(await readQueue()).toEqual([])
  })

  it('adds and reads a post', async () => {
    await addPost(TEST_POST)
    const queue = await readQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0].id).toBe(TEST_POST.id)
  })

  it('updates post status', async () => {
    await addPost(TEST_POST)
    await updatePost(TEST_POST.id, { status: 'scheduled', publish_at: '2026-12-01T10:00:00+01:00' })
    const queue = await readQueue()
    expect(queue[0].status).toBe('scheduled')
    expect(queue[0].publish_at).toBe('2026-12-01T10:00:00+01:00')
  })

  it('deletes a post', async () => {
    await addPost(TEST_POST)
    await deletePost(TEST_POST.id)
    expect(await readQueue()).toHaveLength(0)
  })

  it('getDuePosts returns only overdue scheduled posts', async () => {
    const past = { ...TEST_POST, id: 'past', status: 'scheduled' as const, publish_at: '2020-01-01T00:00:00Z' }
    const future = { ...TEST_POST, id: 'future', status: 'scheduled' as const, publish_at: '2099-01-01T00:00:00Z' }
    const draft = { ...TEST_POST, id: 'draft', status: 'draft' as const, publish_at: null }
    await addPost(past)
    await addPost(future)
    await addPost(draft)
    const due = await getDuePosts()
    expect(due).toHaveLength(1)
    expect(due[0].id).toBe('past')
  })

  it('appendPublished moves post to published file', async () => {
    const post = { ...TEST_POST, status: 'published' as const }
    await appendPublished(post)
    // published.json should have the post
    const raw = await fs.readFile(process.env.PUBLISHED_FILE_OVERRIDE!, 'utf-8')
    const published = JSON.parse(raw) as QueuePost[]
    expect(published).toHaveLength(1)
    expect(published[0].id).toBe(TEST_POST.id)
  })

  it('throws when updating non-existent post', async () => {
    await expect(updatePost('nonexistent-id', { status: 'published' })).rejects.toThrow()
  })
})
