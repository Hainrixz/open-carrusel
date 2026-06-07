import { spawn } from 'child_process'
import crossSpawn from 'cross-spawn'
import { getClaudePath, isClaudeAvailable } from './claude-path'

const DEFAULT_TIMEOUT_MS = 120_000

export async function runClaude(prompt: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<string> {
  if (!isClaudeAvailable()) {
    throw new Error(
      'Claude CLI nicht gefunden. Installation: https://docs.anthropic.com/en/docs/claude-code oder CLAUDE_CLI_PATH in .env.local setzen'
    )
  }

  const claudePath = getClaudePath()
  const isWindowsShim = process.platform === 'win32' && /\.(cmd|bat)$/i.test(claudePath)
  const spawner = isWindowsShim ? crossSpawn : spawn

  return new Promise((resolve, reject) => {
    const child = spawner(claudePath, ['-p', prompt], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    child.stdin?.end()

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
    child.stderr?.on('data', (chunk: Buffer) => { stderr = (stderr + chunk.toString()).slice(-4096) })

    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`Claude CLI Timeout nach ${timeoutMs}ms`))
    }, timeoutMs)

    child.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })

    child.on('exit', (code) => {
      clearTimeout(timer)
      if (code !== 0) {
        const detail = (stderr || stdout).slice(0, 500)
        reject(new Error(`Claude CLI exit code ${code}: ${detail}`))
        return
      }
      resolve(stdout.trim())
    })
  })
}
