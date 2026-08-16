import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import crossSpawn from "cross-spawn";
import { getClaudePath, isClaudeAvailable } from "@/lib/claude-path";
import { buildSystemPrompt } from "@/lib/chat-system-prompt";
import { getBrand } from "@/lib/brand";
import { getCarousel } from "@/lib/carousels";
import { getPreset } from "@/lib/style-presets";
import { isMagnificConfigured } from "@/lib/magnific";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (!isClaudeAvailable()) {
    return NextResponse.json(
      {
        error:
          "Claude CLI not found. Install from https://docs.anthropic.com/en/docs/claude-code or set CLAUDE_CLI_PATH in .env.local",
      },
      { status: 503 }
    );
  }

  let body: {
    message?: string;
    sessionId?: string;
    carouselId?: string;
    stylePresetId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, sessionId, carouselId, stylePresetId } = body;

  if (
    !message ||
    typeof message !== "string" ||
    !message.trim() ||
    message.length > 10000
  ) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  // Build dynamic system prompt with current brand + carousel + style preset context
  const brand = await getBrand();
  const carousel = carouselId ? await getCarousel(carouselId) : null;
  const stylePreset = stylePresetId ? await getPreset(stylePresetId) : null;
  // The agent curls the app's own API — point it at the origin this request came in on,
  // so the dev-server port is never hardcoded in the prompt.
  const host = request.headers.get("host") ?? "localhost:3100";
  const systemPrompt = buildSystemPrompt(
    brand,
    carousel,
    stylePreset,
    `http://${host}`,
    isMagnificConfigured()
  );

  const claudePath = getClaudePath();
  const abortController = new AbortController();

  const args = [
    "-p",
    message,
    "--output-format",
    "stream-json",
    "--include-partial-messages",
    "--verbose",
    "--append-system-prompt",
    systemPrompt,
    "--allowedTools",
    "Bash",
    "--allowedTools",
    "WebFetch",
    "--allowedTools",
    "Read",
    "--max-budget-usd",
    "1.00",
    "--name",
    "carrusel-chat",
  ];

  if (sessionId) {
    args.push("--resume", sessionId);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let childProcess: ReturnType<typeof spawn>;

      const isWindowsShim =
        process.platform === "win32" && /\.(cmd|bat)$/i.test(claudePath);
      const spawner = isWindowsShim ? crossSpawn : spawn;

      try {
        childProcess = spawner(claudePath, args, {
          cwd: process.cwd(),
          signal: abortController.signal,
          stdio: ["pipe", "pipe", "pipe"],
        });
        // Close stdin — we don't send input to the subprocess
        childProcess.stdin?.end();
      } catch (err) {
        const e = err as NodeJS.ErrnoException;
        console.error("[chat] failed to spawn Claude CLI", {
          claudePath,
          platform: process.platform,
          code: e?.code,
          message: e?.message,
        });
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({
              error: "Failed to start Claude CLI",
              code: e?.code,
              path: claudePath,
              message: e?.message,
            })}\n\n`
          )
        );
        controller.close();
        return;
      }

      let buffer = "";
      let resolvedSessionId = sessionId ?? "";

      childProcess.stdout?.on("data", (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            handleEvent(event, controller, encoder, (id) => {
              resolvedSessionId = id;
            });
          } catch {
            // skip unparseable lines
          }
        }
      });

      let stderrBuf = "";
      const STDERR_CAP = 8192;
      childProcess.stderr?.on("data", (chunk: Buffer) => {
        if (stderrBuf.length < STDERR_CAP) {
          stderrBuf = (stderrBuf + chunk.toString()).slice(-STDERR_CAP);
        }
      });

      // Timeout: kill subprocess after 8 minutes (autonomous mode creates many slides)
      const timeout = setTimeout(() => {
        childProcess.kill();
      }, 480_000);

      childProcess.on("error", (err) => {
        clearTimeout(timeout);
        const e = err as NodeJS.ErrnoException;
        console.error("[chat] Claude subprocess error", {
          claudePath,
          platform: process.platform,
          code: e?.code,
          syscall: e?.syscall,
          path: e?.path,
          message: e?.message,
          stderr: stderrBuf,
        });
        try {
          childProcess.kill();
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({
                error: err.message,
                code: e?.code,
                syscall: e?.syscall,
                path: e?.path,
                stderr: stderrBuf || undefined,
              })}\n\n`
            )
          );
          controller.close();
        } catch {
          // stream already closed
        }
      });

      childProcess.on("exit", (code) => {
        clearTimeout(timeout);
        // process remaining buffer
        if (buffer.trim()) {
          try {
            const event = JSON.parse(buffer);
            handleEvent(event, controller, encoder, (id) => {
              resolvedSessionId = id;
            });
          } catch {
            // skip
          }
        }

        if (code && code !== 0) {
          console.error("[chat] Claude subprocess exited non-zero", {
            claudePath,
            platform: process.platform,
            exitCode: code,
            stderr: stderrBuf,
          });
          try {
            controller.enqueue(
              encoder.encode(
                `event: error\ndata: ${JSON.stringify({
                  error: `Claude CLI exited with code ${code}`,
                  exitCode: code,
                  stderr: stderrBuf || undefined,
                })}\n\n`
              )
            );
          } catch {
            // stream already closed
          }
        }

        try {
          controller.enqueue(
            encoder.encode(
              `event: done\ndata: ${JSON.stringify({
                sessionId: resolvedSessionId,
                exitCode: code,
              })}\n\n`
            )
          );
          controller.close();
        } catch {
          // stream already closed
        }
      });
    },

    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function handleEvent(
  event: Record<string, unknown>,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  onSessionId: (id: string) => void
) {
  // Extract session ID from init event
  if (
    event.type === "system" &&
    event.subtype === "init" &&
    event.session_id
  ) {
    onSessionId(event.session_id as string);
    return;
  }

  // Extract streaming text tokens
  if (event.type === "assistant" && event.message) {
    const msg = event.message as Record<string, unknown>;
    if (msg.type === "message" && Array.isArray(msg.content)) {
      for (const block of msg.content) {
        const b = block as Record<string, unknown>;
        if (b.type === "text" && typeof b.text === "string") {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "token", text: b.text })}\n\n`
            )
          );
        }
      }
    }
    return;
  }

  // Extract result with session ID
  if (event.type === "result") {
    if (event.session_id) {
      onSessionId(event.session_id as string);
    }
    if (typeof event.result === "string" && event.result) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "result", text: event.result })}\n\n`
        )
      );
    }
    return;
  }
}
