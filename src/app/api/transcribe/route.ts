import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import os from 'os'
import { transcribeVideo } from '@/lib/whisper'

export const maxDuration = 300 // 5 minutes for large video files

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Keine Video-Datei übergeben' }, { status: 400 })
  }

  const bytes = await (file as File).arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Validate extension
  const ext = path.extname((file as File).name).toLowerCase()
  const allowed = ['.mp4', '.mov', '.mkv', '.webm', '.avi', '.m4v']
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: `Dateityp ${ext} nicht unterstützt` }, { status: 400 })
  }

  const tmpPath = path.join(os.tmpdir(), `whisper-${Date.now()}${ext}`)

  try {
    await writeFile(tmpPath, buffer)
    const transcript = await transcribeVideo(tmpPath)
    return NextResponse.json({ transcript })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Transkription fehlgeschlagen' },
      { status: 500 }
    )
  } finally {
    await unlink(tmpPath).catch(() => {})
  }
}
