import { NextRequest, NextResponse } from 'next/server'
import { deletePost } from '@/lib/queue'
import fs from 'fs/promises'
import path from 'path'

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  // Prevent path traversal in postId
  if (path.basename(id) !== id) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  try {
    await deletePost(id)
  } catch (err) {
    return NextResponse.json({ error: `Queue error: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 })
  }

  const dir = path.join(process.cwd(), 'data', 'drafts', id)
  await fs.rm(dir, { recursive: true, force: true })

  return NextResponse.json({ success: true })
}
