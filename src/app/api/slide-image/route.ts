import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get('postId')
  const file = req.nextUrl.searchParams.get('file')

  if (!postId || !file) {
    return new NextResponse('Missing postId or file', { status: 400 })
  }

  // Prevent path traversal
  const safeName = path.basename(file)
  if (safeName !== file || !safeName.endsWith('.jpg')) {
    return new NextResponse('Invalid file name', { status: 400 })
  }

  const filepath = path.join(process.cwd(), 'data', 'drafts', postId, safeName)

  try {
    const bytes = await fs.readFile(filepath)
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
