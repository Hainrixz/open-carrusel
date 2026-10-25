// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { generateId } from "@/lib/utils";

const UPLOAD_DIR = path.resolve(process.cwd(), "public/uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Magic bytes for allowed image types
const MAGIC_BYTES: Record<string, number[][]> = {
  png: [[0x89, 0x50, 0x4e, 0x47]],
  jpg: [
    [0xff, 0xd8, 0xff],
  ],
  webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF header
};

// Font file magic bytes
const FONT_MAGIC: Record<string, number[][]> = {
  woff2: [[0x77, 0x4f, 0x46, 0x32]],
  ttf: [[0x00, 0x01, 0x00, 0x00]],
};

function matchesMagic(buffer: Uint8Array, magic: number[]): boolean {
  return magic.every((byte, i) => buffer[i] === byte);
}

function detectType(
  buffer: Uint8Array
): "image" | "font" | null {
  for (const patterns of Object.values(MAGIC_BYTES)) {
    for (const pattern of patterns) {
      if (matchesMagic(buffer, pattern)) return "image";
    }
  }
  for (const patterns of Object.values(FONT_MAGIC)) {
    for (const pattern of patterns) {
      if (matchesMagic(buffer, pattern)) return "font";
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Request must be multipart/form-data with a 'file' field" },
        { status: 400 }
      );
    }
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    // Reject SVGs explicitly (XSS risk)
    const ext = path.extname(file.name).toLowerCase();
    if (ext === ".svg" || file.type === "image/svg+xml") {
      return NextResponse.json(
        { error: "SVG files are not allowed" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Validate magic bytes
    const fileType = detectType(buffer);
    if (!fileType) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: PNG, JPG, WebP, WOFF2, TTF" },
        { status: 400 }
      );
    }

    const id = generateId();
    await mkdir(UPLOAD_DIR, { recursive: true });

    if (fileType === "font") {
      // Save fonts directly — no Sharp processing
      const fontExt = ext === ".woff2" ? ".woff2" : ".ttf";
      const fontDir = path.join(UPLOAD_DIR, "fonts");
      await mkdir(fontDir, { recursive: true });
      const filename = `${id}${fontExt}`;
      await writeFile(path.join(fontDir, filename), Buffer.from(arrayBuffer));
      return NextResponse.json({
        id,
        url: `/uploads/fonts/${filename}`,
        type: "font",
      });
    }

    // Process image through Sharp: strip EXIF, enforce sRGB, max 1080px, convert to PNG
    const processed = await sharp(Buffer.from(arrayBuffer))
      .resize(1080, 1080, { fit: "inside", withoutEnlargement: true })
      .toColorspace("srgb")
      .png()
      .toBuffer();

    const filename = `${id}.png`;
    await writeFile(path.join(UPLOAD_DIR, filename), processed);

    return NextResponse.json({
      id,
      url: `/uploads/${filename}`,
      type: "image",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
