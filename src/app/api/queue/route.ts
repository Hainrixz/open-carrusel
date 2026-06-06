import { NextResponse } from 'next/server'
import { readQueue } from '@/lib/queue'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  const posts = await readQueue()

  const withFiles = await Promise.all(
    posts.map(async post => {
      const dir = path.join(process.cwd(), post.draft_dir)
      let slideFiles: string[] = []
      try {
        slideFiles = (await fs.readdir(dir))
          .filter(f => f.endsWith('.jpg'))
          .sort()
          .map(f => `/api/slide-image?postId=${post.id}&file=${encodeURIComponent(f)}`)
      } catch {
        // draft_dir may not exist yet for failed posts
      }
      return { ...post, slideFiles }
    })
  )

  return NextResponse.json(withFiles)
}
