import { execFile } from 'child_process'
import fs from 'fs'
import path from 'path'

async function transcribeViaServer(serverUrl: string, videoPath: string): Promise<string> {
  const fileBytes = fs.readFileSync(videoPath)
  const form = new FormData()
  form.append('file', new Blob([fileBytes]), path.basename(videoPath))

  const res = await fetch(`${serverUrl}/transcribe`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    throw new Error(`Whisper server returned ${res.status}`)
  }

  const data = await res.json() as { text: string }
  return data.text
}

function transcribeViaCLI(videoPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      'whisper',
      [videoPath, '--model', 'medium', '--language', 'de', '--output-format', 'txt', '--output-dir', '/tmp'],
      { timeout: 300_000 },
      (err, stdout) => {
        if (err) return reject(err)
        if (stdout.trim()) return resolve(stdout.trim())
        const txtFile = path.join('/tmp', path.basename(videoPath, path.extname(videoPath)) + '.txt')
        try {
          resolve(fs.readFileSync(txtFile, 'utf-8').trim())
        } catch {
          reject(new Error('Whisper CLI produced no output'))
        }
      }
    )
  })
}

export async function transcribeVideo(videoPath: string): Promise<string> {
  const serverUrl = process.env.WHISPER_SERVER_URL

  if (serverUrl) {
    try {
      return await transcribeViaServer(serverUrl, videoPath)
    } catch (err) {
      console.warn('[whisper] Gaming-PC server unreachable, falling back to local CLI:', err)
    }
  }

  return transcribeViaCLI(videoPath)
}
