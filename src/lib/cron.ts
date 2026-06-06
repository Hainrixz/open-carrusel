// src/lib/cron.ts
import cron from 'node-cron'
import { getDuePosts, updatePost } from './queue'
import { publishPost } from './publisher'

export function startCronWorker(): void {
  cron.schedule('* * * * *', async () => {
    let due
    try {
      due = await getDuePosts()
    } catch (err) {
      console.error('[cron] Failed to read queue:', err)
      return
    }

    for (const post of due) {
      console.log(`[cron] Publishing post: ${post.id}`)
      try {
        const mediaId = await publishPost(post)
        console.log(`[cron] Published ${post.id} → Instagram media ${mediaId}`)
      } catch (err) {
        console.error(`[cron] Failed to publish ${post.id}:`, err)
        await updatePost(post.id, {
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
        }).catch(e => console.error('[cron] Could not update failure status:', e))
      }
    }
  })
  console.log('[cron] Queue worker started — checking every minute')
}
