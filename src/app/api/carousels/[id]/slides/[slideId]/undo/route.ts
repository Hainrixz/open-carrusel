// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
import { NextResponse } from "next/server";
import { undoSlide } from "@/lib/carousels";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; slideId: string }> }
) {
  const { id, slideId } = await params;
  const slide = await undoSlide(id, slideId);
  if (!slide) {
    return NextResponse.json(
      { error: "Not found or no previous versions" },
      { status: 404 }
    );
  }
  return NextResponse.json(slide);
}
