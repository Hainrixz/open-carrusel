// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
import { NextResponse } from "next/server";
import { getTemplate } from "@/lib/templates";
import { createCarousel, addSlide } from "@/lib/carousels";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Create new carousel from template
  const carousel = await createCarousel(
    `${template.name} (from template)`,
    template.aspectRatio
  );

  // Copy all slides
  for (const slide of template.slides) {
    await addSlide(carousel.id, slide.html, slide.notes);
  }

  return NextResponse.json(carousel, { status: 201 });
}
