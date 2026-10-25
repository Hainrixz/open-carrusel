// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
import { NextResponse } from "next/server";
import { duplicateCarousel } from "@/lib/carousels";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const duplicate = await duplicateCarousel(id);
    if (!duplicate) {
      return NextResponse.json({ error: "Carousel not found" }, { status: 404 });
    }
    return NextResponse.json(duplicate, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to duplicate" }, { status: 500 });
  }
}
