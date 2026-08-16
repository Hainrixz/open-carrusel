import type { AspectRatio } from "@/types/carousel";
import { peekTask, type MagnificStatus } from "./magnific-tasks";

/**
 * Magnific text-to-image client (Seedream V5 Lite).
 *
 * POST /v1/ai/text-to-image/seedream-v5-lite returns a task_id; the image URL shows up
 * on GET /{task-id} once status is COMPLETED. We poll, because the app runs on localhost
 * and a webhook has nowhere to land unless the user tunnels the port. If a webhook DOES
 * land, the poll loop short-circuits on the cached result.
 *
 * https://docs.magnific.com/api-reference/text-to-image/post-seedream-v5-lite
 */

const API_ROOT = "https://api.magnific.com/v1/ai/text-to-image/seedream-v5-lite";

/** Magnific's aspect enum. Closest available shape for each carousel ratio. */
const ASPECT_MAP: Record<AspectRatio, string> = {
  "1:1": "square_1_1",
  "4:5": "traditional_3_4",
  "9:16": "social_story_9_16",
};

const POLL_INTERVAL_MS = 2500;
const FIRST_POLL_DELAY_MS = 4000;
const DEFAULT_TIMEOUT_MS = 150_000;
export const MAX_PROMPT_LENGTH = 4096;

export class MagnificError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "MagnificError";
  }
}

export function isMagnificConfigured(): boolean {
  return Boolean(process.env.MAGNIFIC_API_KEY?.trim());
}

export function hasWebhookSecret(): boolean {
  return Boolean(process.env.MAGNIFIC_WEBHOOK_SECRET?.trim());
}

function apiKey(): string {
  const key = process.env.MAGNIFIC_API_KEY?.trim();
  if (!key) {
    throw new MagnificError(
      "MAGNIFIC_API_KEY is not set. Add it to .env.local and restart the dev server.",
      503
    );
  }
  return key;
}

/** Only used when the app is publicly reachable; Magnific rejects non-URI values. */
function webhookUrl(): string | undefined {
  const url = process.env.MAGNIFIC_WEBHOOK_URL?.trim();
  if (!url || !/^https:\/\//i.test(url)) return undefined;
  return url;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface TaskPayload {
  task_id: string;
  status: MagnificStatus;
  generated?: string[];
}

function readTask(body: unknown): TaskPayload {
  const data = (body as { data?: TaskPayload })?.data;
  if (!data?.task_id || !data.status) {
    throw new MagnificError("Unexpected response from Magnific", 502);
  }
  return data;
}

async function requestJson(
  url: string,
  init: RequestInit
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "x-magnific-api-key": apiKey(),
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch (err) {
    throw new MagnificError(
      `Could not reach Magnific: ${(err as Error).message}`,
      502
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let detail = text.slice(0, 300);
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed.message) detail = parsed.message;
    } catch {
      // keep the raw text
    }
    const status = response.status === 401 ? 401 : response.status >= 500 ? 502 : 400;
    throw new MagnificError(
      `Magnific returned ${response.status}${detail ? `: ${detail}` : ""}`,
      status
    );
  }

  return response.json();
}

export interface GenerateOptions {
  prompt: string;
  aspectRatio: AspectRatio;
  seed?: number;
  timeoutMs?: number;
}

export interface GeneratedImage {
  taskId: string;
  sourceUrl: string;
}

/** Creates a task and resolves once Magnific has an image URL for it. */
export async function generateImage({
  prompt,
  aspectRatio,
  seed,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: GenerateOptions): Promise<GeneratedImage> {
  const hook = webhookUrl();
  const created = readTask(
    await requestJson(API_ROOT, {
      method: "POST",
      body: JSON.stringify({
        prompt,
        aspect_ratio: ASPECT_MAP[aspectRatio],
        ...(seed !== undefined ? { seed } : {}),
        ...(hook ? { webhook_url: hook } : {}),
      }),
    })
  );

  const deadline = Date.now() + timeoutMs;
  await sleep(FIRST_POLL_DELAY_MS);

  while (Date.now() < deadline) {
    const cached = peekTask(created.task_id);
    const task =
      cached?.status === "COMPLETED" || cached?.status === "FAILED"
        ? { task_id: cached.taskId, status: cached.status, generated: cached.generated }
        : readTask(await requestJson(`${API_ROOT}/${created.task_id}`, { method: "GET" }));

    if (task.status === "COMPLETED") {
      const sourceUrl = task.generated?.[0];
      if (!sourceUrl) {
        throw new MagnificError("Magnific finished the task with no image", 502);
      }
      return { taskId: task.task_id, sourceUrl };
    }
    if (task.status === "FAILED") {
      throw new MagnificError(
        "Magnific could not generate this image. Try a different prompt.",
        502
      );
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new MagnificError(
    `Magnific did not finish within ${Math.round(timeoutMs / 1000)}s (task ${created.task_id})`,
    504
  );
}

/** Downloads the generated image straight from Magnific's CDN. */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new MagnificError(
      `Could not download the generated image (${response.status})`,
      502
    );
  }
  return Buffer.from(await response.arrayBuffer());
}
