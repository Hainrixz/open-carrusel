// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
import { NextResponse } from "next/server";
import { removeBrandRule, updateBrandRule } from "@/lib/brand";

const MAX_RULE_LENGTH = 1000;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { text } = body as { text?: string };

    if (
      !text ||
      typeof text !== "string" ||
      !text.trim() ||
      text.trim().length > MAX_RULE_LENGTH
    ) {
      return NextResponse.json(
        { error: `Rule text is required (max ${MAX_RULE_LENGTH} characters)` },
        { status: 400 }
      );
    }

    const rule = await updateBrandRule(id, text);
    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }
    return NextResponse.json(rule);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const removed = await removeBrandRule(id);
  if (!removed) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
