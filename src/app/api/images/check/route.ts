import { NextResponse } from "next/server";
import { hasWebhookSecret, isMagnificConfigured } from "@/lib/magnific";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mirrors /api/chat/check: tells the UI whether slide imagery is available. */
export async function GET() {
  return NextResponse.json({
    configured: isMagnificConfigured(),
    provider: "magnific",
    model: "seedream-v5-lite",
    webhook: hasWebhookSecret() && Boolean(process.env.MAGNIFIC_WEBHOOK_URL?.trim()),
  });
}
