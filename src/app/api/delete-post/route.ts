import { NextRequest, NextResponse } from 'next/server'
import { deletePost } from '@/lib/queue'
import fs from 'fs/promises'
import path from 'path'

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  await deletePost(id)

  const dir = path.join(process.cwd(), 'data', 'drafts', id)
  await fs.rm(dir, { recursive: true, force: true })

  return NextResponse.json({ success: true })
}
