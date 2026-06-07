// src/lib/whisper.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock child_process.execFile
const mockExecFile = vi.fn()
vi.mock('child_process', () => ({
  execFile: (cmd: string, args: string[], opts: unknown, cb: (err: Error | null, stdout: string) => void) => {
    mockExecFile(cmd, args, opts, cb)
    return {} as ReturnType<typeof import('child_process').execFile>
  },
}))

// Mock fs so readFileSync doesn't throw ENOENT in tests
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn((filePath: string, encoding?: string) => {
      if (encoding === 'utf-8') return 'Fake transcript from file'
      return Buffer.from('fake-video-bytes')
    }),
  },
}))

// Mock os.tmpdir()
vi.mock('os', () => ({
  default: {
    tmpdir: () => '/tmp',
  },
}))

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { transcribeVideo } from './whisper'

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.WHISPER_SERVER_URL
})

describe('transcribeVideo', () => {
  it('calls Gaming-PC server when WHISPER_SERVER_URL is set', async () => {
    process.env.WHISPER_SERVER_URL = 'http://gaming-pc:8765'
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ text: 'Das ist ein Test-Transcript.' }),
    })

    const result = await transcribeVideo('/tmp/test.mp4')

    expect(result).toBe('Das ist ein Test-Transcript.')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://gaming-pc:8765/transcribe',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('falls back to local whisper CLI when server is unreachable', async () => {
    process.env.WHISPER_SERVER_URL = 'http://gaming-pc:8765'
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))

    mockExecFile.mockImplementationOnce(
      (_cmd: string, _args: string[], _opts: unknown, cb: (err: Error | null, stdout: string) => void) => {
        cb(null, 'Fallback-Transcript über CPU.')
      }
    )

    const result = await transcribeVideo('/tmp/test.mp4')
    expect(result).toBe('Fallback-Transcript über CPU.')
  })

  it('uses local whisper CLI when WHISPER_SERVER_URL is not set', async () => {
    mockExecFile.mockImplementationOnce(
      (_cmd: string, _args: string[], _opts: unknown, cb: (err: Error | null, stdout: string) => void) => {
        cb(null, 'Lokaler Whisper Output.')
      }
    )

    const result = await transcribeVideo('/tmp/test.mp4')
    expect(result).toBe('Lokaler Whisper Output.')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('throws when local whisper CLI fails', async () => {
    mockExecFile.mockImplementationOnce(
      (_cmd: string, _args: string[], _opts: unknown, cb: (err: Error | null, stdout: string) => void) => {
        cb(new Error('whisper: command not found'), '')
      }
    )

    await expect(transcribeVideo('/tmp/test.mp4')).rejects.toThrow('whisper: command not found')
  })
})
