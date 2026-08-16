import { NextResponse } from "next/server";
import crypto from "crypto";
import { hasWebhookSecret } from "@/lib/magnific";
import { recordTask, type MagnificStatus } from "@/lib/magnific-tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Magnific webhook receiver.
 *
 * Optional: the poll loop in src/lib/magnific.ts already resolves every task, and this
 * route is unreachable from Magnific unless the dev server is exposed through a tunnel.
 * When it IS reachable, set MAGNIFIC_WEBHOOK_URL to <public-origin>/api/images/webhook
 * plus MAGNIFIC_WEBHOOK_SECRET, and finished tasks land here instead of costing a poll.
 *
 * Signature scheme: HMAC-SHA256 over "<webhook-id>.<webhook-timestamp>.<raw body>",
 * base64, compared against the webhook-signature header.
 * https://docs.magnific.com/webhooks
 */

const TOLERANCE_SECONDS = 5 * 60;
const MAX_BODY_BYTES = 64 * 1024;

export async function POST(request: Request) {
  if (!hasWebhookSecret()) {
    return NextResponse.json(
      { error: "MAGNIFIC_WEBHOOK_SECRET is not set" },
      { status: 503 }
    );
  }

  const id = request.headers.get("webhook-id");
  const timestamp = request.headers.get("webhook-timestamp");
  const signature = request.headers.get("webhook-signature");
  if (!id || !timestamp || !signature) {
    return NextResponse.json(
      { error: "Missing webhook-id, webhook-timestamp or webhook-signature" },
      { status: 400 }
    );
  }

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) {
    return NextResponse.json({ error: "Invalid webhook-timestamp" }, { status: 400 });
  }
  if (Math.abs(Date.now() / 1000 - sentAt) > TOLERANCE_SECONDS) {
    return NextResponse.json({ error: "Webhook timestamp out of range" }, { status: 400 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  if (!verify(`${id}.${timestamp}.${raw}`, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const task = readTask(payload);
  if (!task) {
    return NextResponse.json({ error: "Unrecognized payload" }, { status: 400 });
  }

  recordTask(task);
  return NextResponse.json({ received: true });
}

function verify(content: string, header: string): boolean {
  const expected = crypto
    .createHmac("sha256", Buffer.from(process.env.MAGNIFIC_WEBHOOK_SECRET!.trim(), "utf-8"))
    .update(content)
    .digest("base64");
  const expectedBuf = Buffer.from(expected, "utf-8");

  // Providers send either a bare signature or a space-separated list of "v1,<sig>" pairs.
  const candidates = header
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => (part.includes(",") ? part.slice(part.indexOf(",") + 1) : part));

  return candidates.some((candidate) => {
    const buf = Buffer.from(candidate, "utf-8");
    return buf.length === expectedBuf.length && crypto.timingSafeEqual(buf, expectedBuf);
  });
}

function readTask(
  payload: unknown
): { taskId: string; status: MagnificStatus; generated: string[] } | null {
  const source =
    (payload as { data?: Record<string, unknown> })?.data ??
    (payload as Record<string, unknown>);
  const taskId = source?.task_id;
  const status = source?.status;
  if (typeof taskId !== "string" || typeof status !== "string") return null;

  const generated = Array.isArray(source.generated)
    ? source.generated.filter((u): u is string => typeof u === "string")
    : [];

  return { taskId, status: status as MagnificStatus, generated };
}
