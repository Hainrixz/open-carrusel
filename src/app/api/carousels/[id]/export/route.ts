// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
import { NextResponse } from "next/server";
import archiver from "archiver";
import { getCarousel } from "@/lib/carousels";
import { exportAllSlides } from "@/lib/export-slides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const carousel = await getCarousel(id);

  if (!carousel) {
    return NextResponse.json({ error: "Carousel not found" }, { status: 404 });
  }

  if (carousel.slides.length === 0) {
    return NextResponse.json({ error: "No slides to export" }, { status: 400 });
  }

  try {
    // Export all slides to PNG buffers
    const pngBuffers = await exportAllSlides(
      carousel.slides,
      carousel.aspectRatio
    );

    // Build ZIP archive and collect all data
    const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
      const archive = archiver("zip", { zlib: { level: 5 } });
      const chunks: Buffer[] = [];

      archive.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      archive.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      archive.on("error", (err) => {
        reject(err);
      });

      try {
        for (const { name, buffer } of pngBuffers) {
          archive.append(buffer, { name });
        }
        archive.finalize();
      } catch (err) {
        archive.destroy();
        reject(err);
      }
    });

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="carousel-${carousel.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.zip"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Export failed: ${message}` },
      { status: 500 }
    );
  }
}
