// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
import { NextResponse } from "next/server";
import { listStagedActions, createStagedAction } from "@/lib/staged-actions";
import type { StagedActionType } from "@/types/staged-action";

export async function GET() {
  const actions = await listStagedActions();
  return NextResponse.json({ actions });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, fileName, content, description, carouselId, autoExecute } =
      body as {
        type?: StagedActionType;
        fileName?: string;
        content?: string;
        description?: string;
        carouselId?: string;
        autoExecute?: boolean;
      };

    // Only allow export_png type (security constraint)
    if (type !== "export_png") {
      return NextResponse.json(
        { error: 'Only "export_png" action type is allowed' },
        { status: 400 }
      );
    }

    if (!fileName || !content || !description || !carouselId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate file extension
    if (!fileName.endsWith(".png")) {
      return NextResponse.json(
        { error: "Only .png files are allowed" },
        { status: 400 }
      );
    }

    const action = await createStagedAction({
      type,
      fileName,
      content,
      description,
      carouselId,
      autoExecute,
    });

    return NextResponse.json({ action }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
