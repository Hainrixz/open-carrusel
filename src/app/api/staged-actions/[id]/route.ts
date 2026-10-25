// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
import { NextResponse } from "next/server";
import { getStagedAction, updateStagedActionStatus } from "@/lib/staged-actions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const action = await getStagedAction(id);
  if (!action) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(action);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { status } = body as { status?: string };

    if (status === "rejected") {
      const updated = await updateStagedActionStatus(id, "rejected");
      if (!updated) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
