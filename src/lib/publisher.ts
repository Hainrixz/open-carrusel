// src/lib/publisher.ts
import path from 'path'
import fs from 'fs/promises'
import { uploadFiles, deleteFiles } from './sftp'
import { publishCarousel } from './instagram'
import { updatePost, appendPublished } from './queue'
import type { QueuePost } from './queue'

export async function publishPost(post: QueuePost): Promise<string> {
  const draftDir = path.join(process.cwd(), post.draft_dir)

  // Collect JPEG files in order
  const files = (await fs.readdir(draftDir))
    .filter(f => f.endsWith('.jpg'))
    .sort()
    .map(f => path.join(draftDir, f))

  if (files.length === 0) {
    throw new Error(`No JPEG files found in ${draftDir}`)
  }

  // Upload to SFTP
  const imageUrls = await uploadFiles(post.id, files)

  // Publish to Instagram
  const mediaId = await publishCarousel({
    imageUrls,
    caption: post.caption,
  })

  // Cleanup SFTP files
  const filenames = files.map(f => path.basename(f))
  await deleteFiles(post.id, filenames)

  // Update queue and write to published log
  await updatePost(post.id, { status: 'published', instagram_media_id: mediaId })
  await appendPublished({ ...post, status: 'published', instagram_media_id: mediaId })

  return mediaId
}
