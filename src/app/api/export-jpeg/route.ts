import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  let body: { carouselId: string; postId: string; caption?: string; caption_variants?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { carouselId, postId, caption, caption_variants } = body

  if (!carouselId || !postId) {
    return NextResponse.json({ error: 'carouselId and postId are required' }, { status: 400 })
  }

  // Call existing export route internally
  const origin = req.nextUrl.origin
  const exportRes = await fetch(`${origin}/api/carousels/${carouselId}/export`, {
    method: 'POST',
  })

  if (!exportRes.ok) {
    const text = await exportRes.text()
    return NextResponse.json({ error: `Export failed: ${text}` }, { status: 500 })
  }

  // Extract PNGs from ZIP
  const zipBuffer = Buffer.from(await exportRes.arrayBuffer())
  const zip = await JSZip.loadAsync(zipBuffer)

  // Sort files by name so slide order is preserved
  const pngFiles = Object.keys(zip.files)
    .filter(name => name.endsWith('.png'))
    .sort()

  if (pngFiles.length === 0) {
    return NextResponse.json({ error: 'No PNG files found in export ZIP' }, { status: 500 })
  }

  const outDir = path.join(process.cwd(), 'data', 'drafts', postId)
  await fs.mkdir(outDir, { recursive: true })

  const jpegPaths: string[] = []

  for (let i = 0; i < pngFiles.length; i++) {
    const pngName = pngFiles[i]
    const pngData = await zip.files[pngName].async('nodebuffer')

    const jpegFilename = `slide-${String(i + 1).padStart(2, '0')}.jpg`
    const jpegPath = path.join(outDir, jpegFilename)

    await sharp(pngData)
      .resize(1080, 1350, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 95 })
      .toFile(jpegPath)

    jpegPaths.push(jpegPath)
  }

  // Write caption.md if caption provided
  if (caption) {
    const variants = caption_variants ?? []
    const captionContent = [
      '# Caption',
      '',
      caption,
      '',
      variants.length > 0 ? '## Varianten' : null,
      ...variants.map((v, i) => `${i + 1}. ${v}`),
    ]
      .filter(line => line !== null)
      .join('\n')

    await fs.writeFile(path.join(outDir, 'caption.md'), captionContent + '\n')
  }

  return NextResponse.json({
    success: true,
    dir: outDir,
    files: jpegPaths,
    slideCount: jpegPaths.length,
  })
}
